import { NextRequest, NextResponse } from 'next/server';
import { sendBackendWhatsAppAlert } from '@/lib/whatsapp/baileys-service';

export async function POST(req: NextRequest) {
  try {
    let customPhone: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body?.phoneNumber) customPhone = String(body.phoneNumber);
    } catch {}

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const message = [
      `🧪 *GANESH MULE WHATSAPP OPERATIONS TEST* ⚡`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Status:* Baileys Web Socket Verified`,
      `*Timestamp:* ${timestamp}`,
      `*System:* Backend Operations Desk`,
      ``,
      `Operational Event Alert Subscriptions:`,
      `• 📦 New Paid Customer Orders`,
      `• 🚚 Delhivery AWB Consignment Dispatch`,
      `• 📉 Warehouse Low-Stock Alerts`,
      `• 🌙 12:30 AM IST Batch Reconciliation`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_This automated notification was triggered from the Admin Operations Panel._`,
    ].join('\n');

    const result = await sendBackendWhatsAppAlert({
      alertType: 'TEST',
      title: 'WhatsApp Operations Desk Test Ping',
      message,
      customRecipients: customPhone ? [customPhone] : undefined,
    });

    return NextResponse.json({
      success: true,
      result,
      message: result.success
        ? `Test alert dispatched to ${result.sentCount} recipient(s).`
        : `Test message prepared. Status: ${result.skippedReason || 'Logged in system'}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send test WhatsApp message', details: error.message },
      { status: 500 }
    );
  }
}
