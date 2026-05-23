export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, ChatMessage } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selfId = searchParams.get('selfId');
    const otherId = searchParams.get('otherId');

    const db = getDatabase();

    if (selfId && otherId) {
      // Direct message history
      const thread = db.messages.filter(
        (m) =>
          (m.pengirimId === selfId && m.penerimaId === otherId) ||
          (m.pengirimId === otherId && m.penerimaId === selfId)
      );
      // Sort older first for scrolling chat room
      thread.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return NextResponse.json(thread);
    }

    // Default: return all messages
    return NextResponse.json(db.messages);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pengirimId, penerimaId, teks } = body;

    if (!pengirimId || !penerimaId || !teks) {
      return NextResponse.json({ error: 'Data chat belum lengkap.' }, { status: 400 });
    }

    const db = getDatabase();
    const now = new Date();
    
    // Format "HH.mm" (e.g. 11.18 or 05.58)
    const jam = now.getHours().toString().padStart(2, '0');
    const mnt = now.getMinutes().toString().padStart(2, '0');
    const jamMnt = `${jam}.${mnt}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      pengirimId,
      penerimaId,
      teks,
      tanggal: jamMnt,
      timestamp: now.toISOString()
    };

    db.messages.push(newMsg);
    saveDatabase(db);

    return NextResponse.json(newMsg);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
