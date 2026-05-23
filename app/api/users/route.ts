export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, User } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    return NextResponse.json(
      db.users.map((u) => ({
        id: u.id,
        username: u.username,
        nama: u.nama,
        role: u.role,
        kelas: u.kelas,
        avatar: u.avatar,
        password: u.passwordHash
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, nama, kelas } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const db = getDatabase();
    
    // Check if user already exists
    const exists = db.users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 });
    }

    const defaultNama = nama || username.charAt(0).toUpperCase() + username.slice(1);
    const defaultKelas = kelas || 'Kelas 10 MIPA 1';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: username.trim().toLowerCase(),
      passwordHash: password,
      nama: defaultNama,
      role: 'siswa',
      kelas: defaultKelas,
      avatar: defaultNama.charAt(0).toUpperCase()
    };

    db.users.push(newUser);
    saveDatabase(db);

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      nama: newUser.nama,
      role: newUser.role,
      kelas: newUser.kelas,
      avatar: newUser.avatar,
      // also include plain password so it can be copied on the admin screen easily
      password: newUser.passwordHash
    });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nama, avatar, kelas } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID Pengguna wajib disertakan.' }, { status: 400 });
    }

    const db = getDatabase();
    const userIndex = db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Update the user details
    if (nama !== undefined) {
      const trimmedNama = nama.trim();
      if (!trimmedNama) {
        return NextResponse.json({ error: 'Nama tidak boleh kosong.' }, { status: 400 });
      }
      db.users[userIndex].nama = trimmedNama;
      
      // Cascade to reports
      db.reports = db.reports.map(r => {
        if (r.pelaporId === id) {
          return { ...r, pelaporNama: trimmedNama };
        }
        return r;
      });
    }

    if (avatar !== undefined) {
      db.users[userIndex].avatar = avatar;
    }

    if (kelas !== undefined) {
      db.users[userIndex].kelas = kelas;
      
      // Cascade to reports
      db.reports = db.reports.map(r => {
        if (r.pelaporId === id) {
          return { ...r, pelaporKelas: kelas };
        }
        return r;
      });
    }

    saveDatabase(db);

    const updatedUser = db.users[userIndex];
    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      nama: updatedUser.nama,
      role: updatedUser.role,
      kelas: updatedUser.kelas,
      avatar: updatedUser.avatar,
      password: updatedUser.passwordHash
    });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
