export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, Report, ChatMessage } from '@/lib/db';

const BULAN_INDONESIA = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

function formatIndonesianDate(date: Date) {
  const tgl = date.getDate().toString().padStart(2, '0');
  const bln = BULAN_INDONESIA[date.getMonth()];
  const thn = date.getFullYear();
  const jam = date.getHours().toString().padStart(2, '0');
  const mnt = date.getMinutes().toString().padStart(2, '0');
  return `${tgl} ${bln} ${thn}, ${jam}.${mnt}`;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    return NextResponse.json(db.reports);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pelaporId, pelaporNama, pelaporKelas, isAnonim, jenis, deskripsi, lokasi, frekuensi, relasi } = body;

    if (!pelaporId || !jenis || !deskripsi || !lokasi) {
      return NextResponse.json({ error: 'Data laporan belum lengkap.' }, { status: 400 });
    }

    const db = getDatabase();
    const now = new Date();

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      pelaporId,
      pelaporNama,
      pelaporKelas: pelaporKelas || '',
      isAnonim: !!isAnonim,
      jenis,
      deskripsi,
      lokasi,
      prioritas: 'Sedang', // default priority
      status: 'Baru',      // default status
      catatan: '',
      tanggal: formatIndonesianDate(now),
      createdAt: now.toISOString(),
      frekuensi,
      relasi
    };

    db.reports.unshift(newReport); // append to beginning
    saveDatabase(db);

    return NextResponse.json(newReport);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, prioritas, status, catatan, adminId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID laporan diperlukan.' }, { status: 400 });
    }

    const db = getDatabase();
    const reportIndex = db.reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    const oldStatus = db.reports[reportIndex].status;
    const newStatus = status || oldStatus;

    // Update fields
    const updated = {
      ...db.reports[reportIndex],
      prioritas: prioritas || db.reports[reportIndex].prioritas,
      status: newStatus,
      catatan: catatan !== undefined ? catatan : db.reports[reportIndex].catatan
    };

    db.reports[reportIndex] = updated;

    // Send chat if status changes
    if (newStatus !== oldStatus) {
      const pelaporId = updated.pelaporId;
      const senderId = adminId || db.users.find((u) => u.role === 'admin')?.id || 'admin-1';

      const now = new Date();
      const jam = now.getHours().toString().padStart(2, '0');
      const mnt = now.getMinutes().toString().padStart(2, '0');
      const jamMnt = `${jam}.${mnt}`;

      const jenisLaporan = updated.jenis;
      let teks = '';
      if (newStatus === 'Proses') {
        teks = `Status laporan Anda tentang "${jenisLaporan}" telah diubah menjadi PROSES. Tim Konseling Sekolah sedang meninjau dan akan segera mengambil tindakan.`;
      } else if (newStatus === 'Selesai') {
        teks = `Laporan Anda tentang "${jenisLaporan}" telah dinyatakan SELESAI dan ditindaklanjuti secara penuh oleh sekolah. Terima kasih atas keberanian Anda melapor!`;
      } else {
        teks = `Status laporan Anda tentang "${jenisLaporan}" sekarang diperbarui menjadi: ${newStatus.toUpperCase()}`;
      }

      const autoMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        pengirimId: senderId,
        penerimaId: pelaporId,
        teks: teks,
        tanggal: jamMnt,
        timestamp: now.toISOString()
      };

      db.messages.push(autoMsg);
    }

    saveDatabase(db);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
