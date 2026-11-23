import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchBaileysGroups } from '@/lib/whatsapp/baileys-service';
import { getWhatsAppSettings, saveWhatsAppSettings } from '@/lib/whatsapp/settings';

const AddGroupSchema = z.object({
  jid: z.string().min(5, 'Valid WhatsApp Group JID is required'),
  name: z.string().optional(),
});

export async function GET() {
  try {
    const groups = await fetchBaileysGroups();
    return NextResponse.json({ success: true, groups });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp groups', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid group parameter', details: parsed.error },
        { status: 400 }
      );
    }

    const { jid, name } = parsed.data;
    const cleanJid = jid.includes('@g.us') ? jid : `${jid.replace(/[^0-9-]/g, '')}@g.us`;
    const settings = getWhatsAppSettings();
    const currentGroups = settings.staffGroups || [];

    if (currentGroups.some((g) => g.jid === cleanJid)) {
      return NextResponse.json({ error: 'This group is already configured' }, { status: 400 });
    }

    const newGroup = {
      jid: cleanJid,
      name: name?.trim() || `Staff Group (${cleanJid.slice(0, 10)}...)`,
    };

    const updated = saveWhatsAppSettings({
      staffGroups: [...currentGroups, newGroup],
    });

    return NextResponse.json({ success: true, settings: updated, group: newGroup });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add staff group', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jid = searchParams.get('jid');
    if (!jid) {
      return NextResponse.json({ error: 'Group JID is required' }, { status: 400 });
    }

    const settings = getWhatsAppSettings();
    const currentGroups = settings.staffGroups || [];
    const updated = saveWhatsAppSettings({
      staffGroups: currentGroups.filter((g) => g.jid !== jid),
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to remove staff group', details: error.message },
      { status: 500 }
    );
  }
}
