/**
 * Precision Decimal Arithmetic Engine
 * Eliminates JavaScript IEEE-754 floating-point drift in monetary calculations.
 *
 * Implements Statutory Indian GST Rounding Rules (Section 170, CGST Act 2017):
 * - Monetary figures are represented in minor units (Paise: 100 paise = 1 INR)
 * - Intermediate rates and percentages are evaluated with scaled integer precision (10^6 micro-units)
 * - Rounding method: ROUND_HALF_UP (0.5 rounds away from zero to the nearest integer paise)
 */

export class FinanceDecimal {
  private readonly microValue: bigint; // Scaled by 1,000,000 (6 decimal places)
  private static readonly SCALE = 1_000_000n;

  private constructor(microValue: bigint) {
    this.microValue = microValue;
  }

  /**
   * Creates a Decimal from integer paise (1 INR = 100 paise)
   */
  public static fromPaise(paise: number | bigint): FinanceDecimal {
    return new FinanceDecimal(BigInt(Math.round(Number(paise))) * FinanceDecimal.SCALE);
  }

  /**
   * Creates a Decimal from major units (Rupees, e.g. 899.00)
   */
  public static fromRupees(rupees: number | string): FinanceDecimal {
    const num = typeof rupees === 'string' ? parseFloat(rupees.trim()) : rupees;
    if (isNaN(num)) return new FinanceDecimal(0n);
    const paise = BigInt(Math.round(num * 100));
    return new FinanceDecimal(paise * FinanceDecimal.SCALE);
  }

  /**
   * Creates a Decimal from raw float rate (e.g. 18.0 for 18% or 0.18)
   */
  public static fromRatePercent(percent: number): FinanceDecimal {
    const micro = BigInt(Math.round(percent * 10_000)); // percent / 100 * 1,000,000
    return new FinanceDecimal(micro);
  }

  public static zero(): FinanceDecimal {
    return new FinanceDecimal(0n);
  }

  public add(other: FinanceDecimal): FinanceDecimal {
    return new FinanceDecimal(this.microValue + other.microValue);
  }

  public sub(other: FinanceDecimal): FinanceDecimal {
    return new FinanceDecimal(this.microValue - other.microValue);
  }

  public mulRate(percent: number): FinanceDecimal {
    // this * (percent / 100)
    // scaled arithmetic: (this.microValue * BigInt(Math.round(percent * 10000))) / (100 * 10000)
    const factor = BigInt(Math.round(percent * 10_000));
    const result = (this.microValue * factor) / 1_000_000n;
    return new FinanceDecimal(result);
  }

  public mulQuantity(qty: number): FinanceDecimal {
    return new FinanceDecimal(this.microValue * BigInt(qty));
  }

  /**
   * Extracts tax from a tax-inclusive amount:
   * Taxable = Total * 100 / (100 + rate)
   * Tax = Total - Taxable
   */
  public extractTaxFromInclusive(gstRatePercent: number): { taxable: FinanceDecimal; tax: FinanceDecimal } {
    if (gstRatePercent <= 0) {
      return { taxable: this, tax: FinanceDecimal.zero() };
    }
    const divisor = BigInt(Math.round((100 + gstRatePercent) * 10_000));
    const taxableMicro = (this.microValue * 1_000_000n) / divisor;
    const taxable = new FinanceDecimal(taxableMicro);
    const tax = this.sub(taxable);
    return { taxable, tax };
  }

  /**
   * Adds tax to a tax-exclusive amount:
   * Tax = Taxable * rate / 100
   * Total = Taxable + Tax
   */
  public addTaxToExclusive(gstRatePercent: number): { taxable: FinanceDecimal; tax: FinanceDecimal; total: FinanceDecimal } {
    if (gstRatePercent <= 0) {
      return { taxable: this, tax: FinanceDecimal.zero(), total: this };
    }
    const tax = this.mulRate(gstRatePercent);
    const total = this.add(tax);
    return { taxable: this, tax, total };
  }

  /**
   * Converts to integer paise using Half-Up Rounding
   */
  public toPaise(): number {
    const sign = this.microValue >= 0n ? 1n : -1n;
    const abs = this.microValue * sign;
    const quotient = abs / FinanceDecimal.SCALE;
    const remainder = abs % FinanceDecimal.SCALE;

    let rounded = quotient;
    if (remainder >= FinanceDecimal.SCALE / 2n) {
      rounded += 1n;
    }
    return Number(rounded * sign);
  }

  /**
   * Converts to standard major units (Rupees as float with 2 decimal places)
   */
  public toRupees(): number {
    return this.toPaise() / 100;
  }

  /**
   * Formats as Indian Currency string e.g. "₹899.00"
   */
  public toFormattedINR(): string {
    const rupees = this.toRupees();
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }
}
