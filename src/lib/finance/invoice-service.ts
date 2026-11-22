/**
 * Platform Service Invoice Generator & Register
 * Issues official GST-compliant tax invoices from the Developer Platform entity to Client Businesses.
 */

import { prisma, isDatabaseOnline } from '@/lib/db';
import { getPlatformBusinessProfile } from './settings-store';
import { FinanceDecimal } from './decimal';

export interface GenerateInvoiceParams {
  orderId?: string;
  orderNumber?: string;
  transactionId?: string;
  clientBusinessName?: string;
  clientGstin?: string | null;
  clientAddress?: any;
  serviceDescription?: string;
  taxableAmountPaise: number;
  gstRate?: number; // default 18.0%
  placeOfSupplyStateCode?: string; // default '27'
  notes?: string;
}

export function generateInvoiceNumber(sequence: number, prefix = 'PINV', year = new Date().getFullYear()): string {
  const padded = String(sequence).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

export async function generatePlatformInvoice(params: GenerateInvoiceParams) {
  const profile = await getPlatformBusinessProfile();
  const dbOnline = await isDatabaseOnline();

  const gstRate = params.gstRate ?? 18.0;
  const taxableDec = FinanceDecimal.fromPaise(params.taxableAmountPaise);
  const gstAmountDec = taxableDec.mulRate(gstRate);
  const totalAmountPaise = taxableDec.toPaise() + gstAmountDec.toPaise();

  const supplierStateCode = profile.stateCode || '27';
  const recipientStateCode = params.placeOfSupplyStateCode || '27';
  const isInterState = supplierStateCode !== recipientStateCode;

  const gstAmountPaise = gstAmountDec.toPaise();
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isInterState) {
    igstPaise = gstAmountPaise;
  } else {
    cgstPaise = Math.round(gstAmountPaise / 2);
    sgstPaise = gstAmountPaise - cgstPaise;
  }

  // Idempotency check: if an invoice already exists for this order/transaction, return existing
  if (dbOnline && (params.orderId || params.orderNumber)) {
    const existing = await prisma.platformInvoice.findFirst({
      where: {
        OR: [
          ...(params.orderId ? [{ orderId: params.orderId }] : []),
          ...(params.orderNumber ? [{ orderNumber: params.orderNumber }] : []),
        ],
      },
    });
    if (existing) {
      return existing;
    }
  }

  // Generate unique sequential invoice number (e.g. PINV-2026-1001)
  const currentYear = new Date().getFullYear();
  const nextSeq = profile.nextInvoiceSeq || 1001;
  const invoiceNumber = `${profile.invoicePrefix}-${currentYear}-${nextSeq}`;

  let invoiceRecord: any = null;

  if (dbOnline) {
    try {
      invoiceRecord = await prisma.$transaction(async (tx) => {
        const inv = await tx.platformInvoice.create({
          data: {
            invoiceNumber,
            invoiceDate: new Date(),
            orderId: params.orderId || null,
            orderNumber: params.orderNumber || null,
            clientBusinessName: params.clientBusinessName || 'Ganesh Mule Pure Honey (Client Store)',
            clientGstin: params.clientGstin || null,
            clientAddress: params.clientAddress || null,
            serviceDescription:
              params.serviceDescription ||
              'E-Commerce Platform Infrastructure, Gateway Orchestration & Order Processing Services',
            taxableAmountPaise: taxableDec.toPaise(),
            gstRate,
            cgstPaise,
            sgstPaise,
            igstPaise,
            totalAmountPaise,
            status: 'ISSUED',
            placeOfSupply: `${recipientStateCode === '27' ? 'Maharashtra' : 'Out of State'} (${recipientStateCode})`,
            notes: params.notes || null,
          },
        });

        // Increment sequence in business profile
        await tx.platformBusinessProfile.update({
          where: { id: 'singleton' },
          data: { nextInvoiceSeq: { increment: 1 } },
        });

        // Link with PlatformTransaction if transactionId or orderId provided
        if (params.transactionId || params.orderId) {
          await tx.platformTransaction.updateMany({
            where: {
              OR: [
                ...(params.transactionId ? [{ id: params.transactionId }] : []),
                ...(params.orderId ? [{ orderId: params.orderId }] : []),
              ],
            },
            data: { invoiceId: inv.id },
          });
        }

        return inv;
      });
    } catch (err) {
      console.error('[InvoiceService] Failed to create platform invoice in DB:', err);
    }
  }

  if (!invoiceRecord) {
    invoiceRecord = {
      id: `pinv-${Date.now()}`,
      invoiceNumber,
      invoiceDate: new Date().toISOString(),
      orderId: params.orderId || null,
      orderNumber: params.orderNumber || null,
      clientBusinessName: params.clientBusinessName || 'Ganesh Mule Pure Honey (Client Store)',
      clientGstin: params.clientGstin || null,
      serviceDescription:
        params.serviceDescription ||
        'E-Commerce Platform Infrastructure, Gateway Orchestration & Order Processing Services',
      taxableAmountPaise: taxableDec.toPaise(),
      gstRate,
      cgstPaise,
      sgstPaise,
      igstPaise,
      totalAmountPaise,
      status: 'ISSUED',
      placeOfSupply: `Maharashtra (${recipientStateCode})`,
      createdAt: new Date().toISOString(),
    };
  }

  return invoiceRecord;
}

