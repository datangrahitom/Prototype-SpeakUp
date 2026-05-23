import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const user = db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    // Return user info (omit sensitive info if needed, but for simple app it is perfect)
    return NextResponse.json({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      kelas: user.kelas,
      avatar: user.avatar
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
