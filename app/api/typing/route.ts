export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getTypingUsersFor, setTyping } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selfId = searchParams.get('selfId');
    if (!selfId) {
      return NextResponse.json({ error: 'selfId is required.' }, { status: 400 });
    }
    const typingUsers = getTypingUsersFor(selfId);
    return NextResponse.json({ typingUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, penerimaId } = body;

    if (!senderId || !penerimaId) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
    }

    setTyping(senderId, penerimaId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
