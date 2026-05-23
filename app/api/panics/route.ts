export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, PanicTrigger } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    return NextResponse.json(db.panics.filter((p) => p.status === 'Aktif'));
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siswaId, siswaNama, siswaKelas } = body;

    if (!siswaId || !siswaNama) {
      return NextResponse.json({ error: 'Data siswa diperlukan.' }, { status: 400 });
    }

    const db = getDatabase();
    const newPanic: PanicTrigger = {
      id: `panic-${Date.now()}`,
      siswaId,
      siswaNama,
      siswaKelas,
      status: 'Aktif',
      timestamp: new Date().toISOString()
    };

    db.panics.push(newPanic);

    // Also automatically file an urgent report under "Panggilan Darurat (Panic Button)"
    // so it shows up in reports triage immediately!
    const BULAN_INDONESIA = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const now = new Date();
    const tgl = now.getDate().toString().padStart(2, '0');
    const bln = BULAN_INDONESIA[now.getMonth()];
    const thn = now.getFullYear();
    const jam = now.getHours().toString().padStart(2, '0');
    const mnt = now.getMinutes().toString().padStart(2, '0');
    const tglString = `${tgl} ${bln} ${thn}, ${jam}.${mnt}`;

    db.reports.unshift({
      id: `rep-panic-${Date.now()}`,
      pelaporId: siswaId,
      pelaporNama: siswaNama,
      pelaporKelas: siswaKelas,
      isAnonim: false,
      jenis: 'Panggilan Darurat',
      deskripsi: '⚠️ TOMBOL DARURAT DIPICU! Siswa membutuhkan pertolongan fisik secepatnya.',
      lokasi: 'Lokasi Terdefinisi GPS / Area Sekolah',
      prioritas: 'Tinggi',
      status: 'Baru',
      catatan: '',
      tanggal: tglString,
      createdAt: now.toISOString()
    });

    saveDatabase(db);
    return NextResponse.json(newPanic);
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID panik diperlukan.' }, { status: 400 });
    }

    const db = getDatabase();
    const index = db.panics.findIndex((p) => p.id === id);

    if (index !== -1) {
      const panicObj = db.panics[index];
      panicObj.status = 'Selesai';

      // Also mark any associated "Panggilan Darurat" report for this student as "Selesai"
      const reportIndex = db.reports.findIndex(
        (r) => r.pelaporId === panicObj.siswaId && r.jenis === 'Panggilan Darurat' && r.status !== 'Selesai'
      );
      if (reportIndex !== -1) {
        db.reports[reportIndex].status = 'Selesai';
        db.reports[reportIndex].catatan = db.reports[reportIndex].catatan 
          ? `${db.reports[reportIndex].catatan}\nAtasi via banner darurat.`
          : 'Diatasi oleh Admin via banner darurat.';
      }

      saveDatabase(db);
      return NextResponse.json(panicObj);
    }

    return NextResponse.json({ error: 'Alarm tidak ditemukan.' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
