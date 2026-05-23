'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  User,
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  Check,
  Info,
  FileText,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Zap,
  MapPin,
  Calendar,
  X,
  Search,
  BellRing,
  Copy,
  Users,
  Download
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserSession {
  id: string;
  username: string;
  nama: string;
  role: 'admin' | 'siswa';
  kelas?: string;
  avatar: string;
  password?: string;
}

interface Report {
  id: string;
  pelaporId: string;
  pelaporNama: string;
  pelaporKelas?: string;
  isAnonim: boolean;
  jenis: string;
  deskripsi: string;
  lokasi: string;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Baru' | 'Proses' | 'Selesai';
  catatan: string;
  tanggal: string;
  createdAt: string;
  frekuensi?: string;
  relasi?: string;
}

interface ChatMessage {
  id: string;
  pengirimId: string;
  penerimaId: string;
  teks: string;
  tanggal: string;
  timestamp: string;
}

interface PanicTrigger {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaKelas?: string;
  status: 'Aktif' | 'Selesai';
  timestamp: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // App view & role states
  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speakup_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [viewState, setViewState] = useState<'login' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speakup_session');
      if (saved) return 'dashboard';
    }
    return 'login';
  });

  const [activeTab, setActiveTab] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speakup_theme') as 'light' | 'dark' | null;
      return saved || 'light';
    }
    return 'light';
  });

  // Db-backed lists
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePanics, setActivePanics] = useState<PanicTrigger[]>([]);

  // Admin notification states for new reports ('Baru')
  const [adminNewReportNotify, setAdminNewReportNotify] = useState<Report | null>(null);
  const knownReportIdsRef = useRef<Set<string>>(new Set());
  const sessionRef = useRef<UserSession | null>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Auth UI states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App global UI triggers
  const [showPanduan, setShowPanduan] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeChatPartner, setActiveChatPartner] = useState<UserSession | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Triage state
  const [selectedReportForTriage, setSelectedReportForTriage] = useState<Report | null>(null);
  const [triagePrioritas, setTriagePrioritas] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [triageStatus, setTriageStatus] = useState<'Baru' | 'Proses' | 'Selesai'>('Baru');
  const [triageCatatan, setTriageCatatan] = useState('');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState<string>('Semua');
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilterStatus, setChatFilterStatus] = useState<string>('Semua');
  const [chatFilterClass, setChatFilterClass] = useState<string>('Semua');

  // Reporting draft states
  const [showLaporCepat, setShowLaporCepat] = useState(false);
  const [formCepatLokasi, setFormCepatLokasi] = useState('');
  const [formCepatDeskripsi, setFormCepatDeskripsi] = useState('');
  const [formCepatIsAnonim, setFormCepatIsAnonim] = useState(false);

  const [showLaporLengkap, setShowLaporLengkap] = useState(false);
  const [formLengkapJenis, setFormLengkapJenis] = useState('Bullying Verbal');
  const [formLengkapLokasi, setFormLengkapLokasi] = useState('');
  const [formLengkapDeskripsi, setFormLengkapDeskripsi] = useState('');
  const [formLengkapIsAnonim, setFormLengkapIsAnonim] = useState(false);
  const [formLengkapFrekuensi, setFormLengkapFrekuensi] = useState('Satu Kali');
  const [formLengkapRelasi, setFormLengkapRelasi] = useState('Teman Sekelas');

  // Math Verification (Matematika Dasar) States
  const [mathNum1, setMathNum1] = useState(0);
  const [mathNum2, setMathNum2] = useState(0);
  const [mathOp, setMathOp] = useState('+');
  const [mathUserAnswer, setMathUserAnswer] = useState('');

  const generateMathChallenge = () => {
    const n1 = Math.floor(Math.random() * 9) + 2; // 2 to 10
    const n2 = Math.floor(Math.random() * (n1 - 1)) + 1; // 1 to n1-1
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    setMathNum1(n1);
    setMathNum2(n2);
    setMathOp(op);
    setMathUserAnswer('');
  };

  // Generate math verification challenge when either modal is display-triggered
  useEffect(() => {
    if (showLaporCepat || showLaporLengkap) {
      const t = setTimeout(() => {
        generateMathChallenge();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [showLaporCepat, showLaporLengkap]);

  // Admin Account provisioning draft states
  const [provUsername, setProvUsername] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provNama, setProvNama] = useState('');
  const [provKelas, setProvKelas] = useState('');
  const [provMessage, setProvMessage] = useState<string | null>(null);
  const [provHistory, setProvHistory] = useState<Array<{ username: string; pass: string; nama: string }>>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('Semua');
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Class Management
  const [classList, setClassList] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speakup_classes');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return ['Kelas 10 MIPA 1', 'Kelas 10 MIPA 2', 'Kelas 10 IPS 1', 'Kelas 10 IPS 2'];
        }
      }
    }
    return ['Kelas 10 MIPA 1', 'Kelas 10 MIPA 2', 'Kelas 10 IPS 1', 'Kelas 10 IPS 2'];
  });
  
  useEffect(() => {
    localStorage.setItem('speakup_classes', JSON.stringify(classList));
    if (classList.length > 0 && !provKelas) {
      setProvKelas(classList[0]);
    }
  }, [classList, provKelas]);

  const [isEditingClasses, setIsEditingClasses] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const handleAddClass = () => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    if (classList.includes(trimmed)) {
      triggerToast('Kelas sudah ada!');
      return;
    }
    setClassList([...classList, trimmed]);
    setNewClassName('');
    setProvKelas(trimmed);
    triggerToast('Kelas baru ditambahkan.');
  };

  const handleRemoveClass = (cls: string) => {
    const updated = classList.filter(c => c !== cls);
    setClassList(updated);
    if (provKelas === cls) {
      setProvKelas(updated.length > 0 ? updated[0] : '');
    }
    triggerToast('Kelas dihapus.');
  };

  // Profile editing states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileNama, setEditProfileNama] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');
  const [editProfileKelas, setEditProfileKelas] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    if (session) {
      setEditProfileNama(session.nama);
      setEditProfileAvatar(session.avatar || '👤');
      setEditProfileKelas(session.kelas || '');
      setShowEditProfileModal(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const trimmedNama = editProfileNama.trim();
    if (!trimmedNama) {
      triggerToast('Nama tidak boleh kosong!');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          nama: trimmedNama,
          avatar: editProfileAvatar,
          kelas: session.role === 'siswa' ? editProfileKelas : undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        triggerToast(errorData.error || 'Gagal menyimpan profil.');
        setIsSavingProfile(false);
        return;
      }

      const updatedUser = await res.json();
      
      const newSession: UserSession = {
        ...session,
        nama: updatedUser.nama,
        avatar: updatedUser.avatar,
        kelas: updatedUser.kelas
      };
      setSession(newSession);
      localStorage.setItem('speakup_session', JSON.stringify(newSession));
      
      triggerToast('Profil berhasil diperbarui!');
      setShowEditProfileModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('Koneksi server gagal.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownloadPDF = () => {
    if (reports.length === 0) {
      triggerToast('Tidak ada data laporan untuk diunduh.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // App Logo / Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // Blue color (#2563EB)
      doc.text('SPEAKUP! REKAPITULASI LAPORAN LAYANAN', 14, 20);

      // Line decoration
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.8);
      doc.line(14, 23, 283, 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate color
      
      const dateStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.text(`Dicetak pada: ${dateStr}`, 14, 29);
      doc.text(`Total Laporan: ${reports.length} kasus`, 14, 34);

      // Prepare headers
      const tableColumn = [
        'No',
        'ID Laporan',
        'Pelapor',
        'Kelas',
        'Jenis Laporan',
        'Deskripsi Kejadian',
        'Lokasi',
        'Tgl Lapor',
        'Prioritas',
        'Status'
      ];

      // Prepare rows
      const tableRows = reports.map((rep, idx) => {
        const namaPelapor = rep.isAnonim ? 'Rahasia (Anonim)' : rep.pelaporNama;
        const kelasPelapor = rep.isAnonim ? '-' : (rep.pelaporKelas || '-');
        return [
          idx + 1,
          rep.id.substring(0, 8).toUpperCase(), // short ID for presentation
          namaPelapor,
          kelasPelapor,
          rep.jenis,
          rep.deskripsi || '-',
          rep.lokasi || '-',
          rep.tanggal || '-',
          rep.prioritas,
          rep.status
        ];
      });

      // Render table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 38,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          textColor: [30, 41, 59] // slate-800
        },
        headStyles: {
          fillColor: [37, 99, 235], // Blue-600 focus
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 10 },    // No
          1: { cellWidth: 20 },    // ID Laporan
          2: { cellWidth: 35 },    // Pelapor
          3: { cellWidth: 25 },    // Kelas
          4: { cellWidth: 32 },    // Jenis Laporan
          5: { cellWidth: 70 },    // Deskripsi Kejadian (wider for detail)
          6: { cellWidth: 25 },    // Lokasi
          7: { cellWidth: 20 },    // Tgl Lapor
          8: { cellWidth: 18 },    // Prioritas
          9: { cellWidth: 16 }     // Status
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, 250, doc.internal.pageSize.height - 10);
        }
      });

      // Save PDF file
      const fileDate = new Date().toISOString().split('T')[0];
      doc.save(`rekap_laporan_speakup_${fileDate}.pdf`);
      triggerToast('Berkas PDF berhasil diunduh.');
    } catch (error) {
      console.error('PDF generation error:', error);
      triggerToast('Gagal merender PDF secara offline.');
    }
  };

  // Toast / Status notify
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Play a brief visual/audio alert sound synthetically via Web Audio API (robust with zero external audio assets)
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Chime 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      // Chime 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn('Audio play restricted or unsupported:', err);
    }
  };

  // Fetch all backend data
  const fetchData = async () => {
    const safeFetchJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Fetch ${url} failed with status ${res.status}`);
          return null;
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`Fetch ${url} did not return JSON. Content-Type: ${contentType}`);
          return null;
        }
        return await res.json();
      } catch (err) {
        console.error(`Network or parse error on fetch ${url}:`, err);
        return null;
      }
    };

    try {
      const [reportsRes, usersRes, messagesRes, panicsRes] = await Promise.all([
        safeFetchJson('/api/reports'),
        safeFetchJson('/api/users'),
        safeFetchJson('/api/messages'),
        safeFetchJson('/api/panics')
      ]);

      if (reportsRes && Array.isArray(reportsRes)) {
        // Only run detection check if:
        // 1. Current user is an admin
        // 2. We already populated the initial "known" set (meaning this is a dynamic update/new submission)
        const currentSession = sessionRef.current;
        if (currentSession?.role === 'admin' && knownReportIdsRef.current.size > 0) {
          const newBaruReports = reportsRes.filter((r: Report) => r.status === 'Baru' && !knownReportIdsRef.current.has(r.id));
          if (newBaruReports.length > 0) {
            // Trigger beautiful synthetic audio chime
            playNotificationSound();
            // Trigger visual notification banner
            setAdminNewReportNotify(newBaruReports[newBaruReports.length - 1]);
          }
        }

        // Always register IDs as known/seen
        reportsRes.forEach((r: Report) => {
          knownReportIdsRef.current.add(r.id);
        });

        setReports(reportsRes);
      }
      if (usersRes && Array.isArray(usersRes)) setUsers(usersRes);
      if (messagesRes && Array.isArray(messagesRes)) setMessages(messagesRes);
      if (panicsRes && Array.isArray(panicsRes)) setActivePanics(panicsRes);
    } catch (e) {
      console.error('Failed to update dashboard databases', e);
    }
  };

  // Load session & configuration on mount
  useEffect(() => {
    const tMounted = setTimeout(() => {
      setMounted(true);
    }, 0);
    // Load initial seeds deferred to satisfy mount effect rules
    const t = setTimeout(() => {
      fetchData();
    }, 10);
    return () => {
      clearTimeout(tMounted);
      clearTimeout(t);
    };
  }, []);

  // Sync document root class & style with theme state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      const body = window.document.body;
      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
        body.style.backgroundColor = '#09090b'; // zinc-950
        body.style.color = '#f4f4f5'; // zinc-100
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        body.style.backgroundColor = '#f8fafc'; // slate-50
        body.style.color = '#09090b'; // zinc-900
      }
    }
  }, [theme]);

  // Sync / Polling intervals (every 4 seconds for immediate multi-role dynamic updates)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom of chat when messaging active partner
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatPartner, messages]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setLoginError('Harap lengkapi username dan password.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (!res.ok) {
        let errMsg = 'Autentikasi gagal.';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          }
        } catch (e) {
          // ignore and fallback
        }
        setLoginError(errMsg);
        setIsLoggingIn(false);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setLoginError('Format respons dari server salah.');
        setIsLoggingIn(false);
        return;
      }

      const userData: UserSession = await res.json();
      localStorage.setItem('speakup_session', JSON.stringify(userData));
      knownReportIdsRef.current.clear();
      setAdminNewReportNotify(null);
      setSession(userData);
      setViewState('dashboard');
      setActiveTab(0);
      triggerToast(`Selamat datang kembali, ${userData.nama}!`);
    } catch (err) {
      setLoginError('Koneksi server gagal.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick Account Autofill helper (as seen in screenshots "Demo Akun")
  const autofillAccount = (user: string, pass: string) => {
    setUsernameInput(user);
    setPasswordInput(pass);
    setLoginError('');
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('speakup_session');
    knownReportIdsRef.current.clear();
    setAdminNewReportNotify(null);
    setSession(null);
    setViewState('login');
    setActiveTab(0);
    setUsernameInput('');
    setPasswordInput('');
    setActiveChatPartner(null);
    setShowLogoutConfirm(false);
  };

  // Toggle Theme
  const toggleThemeMode = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('speakup_theme', nextTheme);
    triggerToast(`Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan.`);
  };

  // Submit Quick Report
  const handleSubmitLaporCepat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCepatLokasi || !formCepatDeskripsi) {
      triggerToast('Lengkapi deskripsi kejadian dan lokasinya.');
      return;
    }

    // Math verification check
    const correctAns = mathOp === '+' ? (mathNum1 + mathNum2) : (mathNum1 - mathNum2);
    if (parseInt(mathUserAnswer, 10) !== correctAns) {
      triggerToast('Verifikasi keamanan matematika salah. Silakan coba lagi.');
      generateMathChallenge();
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pelaporId: session?.id,
          pelaporNama: session?.nama,
          pelaporKelas: session?.kelas,
          isAnonim: formCepatIsAnonim,
          jenis: 'Laporan Kilat',
          deskripsi: formCepatDeskripsi,
          lokasi: formCepatLokasi
        })
      });

      if (res.ok) {
        triggerToast('Laporan cepat berhasil terkirim!');
        setFormCepatLokasi('');
        setFormCepatDeskripsi('');
        setFormCepatIsAnonim(false);
        setShowLaporCepat(false);
        fetchData();
        // Shift to history tab
        setActiveTab(1);
      } else {
        triggerToast('Gagal mengirim laporan.');
      }
    } catch (err) {
      triggerToast('Gagal terhubung ke server.');
    }
  };

  // Submit Detailed Report
  const handleSubmitLaporLengkap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLengkapLokasi || !formLengkapDeskripsi) {
      triggerToast('Deskripsi lengkap dan lokasi wajib diisi.');
      return;
    }

    // Math verification check
    const correctAns = mathOp === '+' ? (mathNum1 + mathNum2) : (mathNum1 - mathNum2);
    if (parseInt(mathUserAnswer, 10) !== correctAns) {
      triggerToast('Verifikasi keamanan matematika salah. Silakan coba lagi.');
      generateMathChallenge();
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pelaporId: session?.id,
          pelaporNama: session?.nama,
          pelaporKelas: session?.kelas,
          isAnonim: formLengkapIsAnonim,
          jenis: formLengkapJenis,
          deskripsi: formLengkapDeskripsi,
          lokasi: formLengkapLokasi,
          frekuensi: formLengkapFrekuensi,
          relasi: formLengkapRelasi
        })
      });

      if (res.ok) {
        triggerToast('Laporan lengkap berhasil terkirim!');
        setFormLengkapLokasi('');
        setFormLengkapDeskripsi('');
        setFormLengkapJenis('Bullying Verbal');
        setFormLengkapIsAnonim(false);
        setFormLengkapFrekuensi('Satu Kali');
        setFormLengkapRelasi('Teman Sekelas');
        setShowLaporLengkap(false);
        fetchData();
        // Shift to history tab
        setActiveTab(1);
      } else {
        triggerToast('Gagal mengirim laporan.');
      }
    } catch (err) {
      triggerToast('Gagal terhubung ke server.');
    }
  };

  // Create Student Account Administrative Trigger
  const handleCreateStudentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provUsername || !provPassword) {
      triggerToast('Username dan password wajib ditentukan.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: provUsername,
          password: provPassword,
          nama: provNama,
          kelas: provKelas
        })
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setProvMessage('Gagal menerbitkan akun (Respons di luar format JSON).');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        triggerToast('Akun Siswa baru berhasil dibuat!');
        setProvHistory(prev => [{ username: data.username, pass: data.password, nama: data.nama }, ...prev]);
        setProvUsername('');
        setProvPassword('');
        setProvNama('');
        setProvMessage(`Berhasil membuat akun: ${data.username} (${data.password})`);
        fetchData();
      } else {
        setProvMessage(data.error || 'Gagal menerbitkan akun.');
      }
    } catch (err) {
      triggerToast('Koneksi server gagal.');
    }
  };

  // Fill random credential values
  const handleRandomizeAccountDraft = () => {
    const randNum = Math.floor(100 + Math.random() * 900);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randPass = '';
    for (let i = 0; i < 6; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    randPass += '!';

    setProvUsername(`siswa_${randNum}`);
    setProvPassword(randPass);
    setProvNama(`Siswa Uji ${randNum}`);
    
    // Pick a random class from our managed classList, or fallback
    if (classList.length > 0) {
      setProvKelas(classList[Math.floor(Math.random() * classList.length)]);
    } else {
      setProvKelas('Siswa Uji');
    }
    setProvMessage(null);
  };

  // Copy utility for student credentials
  const handleCopyToClipboard = (text: string, userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedUserId(userId);
      triggerToast('Informasi akun berhasil disalin!');
      setTimeout(() => setCopiedUserId(null), 2500);
    } catch (err) {
      triggerToast('Gagal menyalin otomatis.');
    }
  };

  // Open Case Triage Review Modal for Admin
  const handleOpenTriage = (report: Report) => {
    setSelectedReportForTriage(report);
    setTriagePrioritas(report.prioritas);
    setTriageStatus(report.status);
    setTriageCatatan(report.catatan || '');
  };

  // Save Case Triage changes
  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForTriage) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReportForTriage.id,
          prioritas: triagePrioritas,
          status: triageStatus,
          catatan: triageCatatan,
          adminId: session?.id
        })
      });

      if (res.ok) {
        triggerToast('Perubahan kasus disimpan.');
        setSelectedReportForTriage(null);
        fetchData();
      } else {
        triggerToast('Gagal merubah data kasus.');
      }
    } catch (err) {
      triggerToast('Terjadi gangguan server.');
    }
  };

  // Send physical panic broadcast
  const handleSendPanicAlert = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/panics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaId: session.id,
          siswaNama: session.nama,
          siswaKelas: session.kelas
        })
      });

      if (res.ok) {
        triggerToast('⚠️ DARURAT DIKIRIM! Tim keamanan sekolah disiagakan.');
        setShowPanicConfirm(false);
        fetchData();
      } else {
        triggerToast('Gagal mengirim alarm darurat.');
      }
    } catch (err) {
      triggerToast('Gangguan komunikasi darurat.');
    }
  };

  // Admin resolves alert trigger
  const handleResolvePanic = async (panicId: string) => {
    try {
      const res = await fetch('/api/panics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: panicId })
      });

      if (res.ok) {
        triggerToast('Alarm darurat berhasil diatasi.');
        fetchData();
      }
    } catch (err) {
      triggerToast('Gagal menyelesaikan alarm.');
    }
  };

  // Push counselor direct message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputValue.trim() || !activeChatPartner || !session) return;

    const messagePayload = {
      pengirimId: session.id,
      penerimaId: activeChatPartner.id,
      teks: chatInputValue.trim()
    };

    // Optimistic trigger locally first
    const clientMsg: ChatMessage = {
      id: `msg-opt-${Date.now()}`,
      pengirimId: session.id,
      penerimaId: activeChatPartner.id,
      teks: chatInputValue.trim(),
      tanggal: new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, clientMsg]);
    setChatInputValue('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload)
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to post dispatch message', e);
    }
  };

  // Filter and search computation for reports
  const filteredReports = reports.filter((r) => {
    // Role matching filters
    const roleMatch = session?.role === 'admin' || r.pelaporId === session?.id;
    if (!roleMatch) return false;

    // Filter Chips calculation
    if (reportFilter !== 'Semua') {
      if (reportFilter.toLowerCase() === 'proses' && r.status !== 'Proses') return false;
      if (reportFilter.toLowerCase() === 'baru' && r.status !== 'Baru') return false;
      if (reportFilter.toLowerCase() === 'selesai' && r.status !== 'Selesai') return false;
      // student side has "Draft", we return empty list if they filter draft
      if (reportFilter.toLowerCase() === 'draft') return false;
    }

    // Search query calculation
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    // Support search by reporter name (or "anonim" if anonymous), category/type, and status
    const reporterName = r.isAnonim ? 'anonim' : r.pelaporNama.toLowerCase();
    return (
      r.jenis.toLowerCase().includes(query) ||
      r.deskripsi.toLowerCase().includes(query) ||
      r.lokasi.toLowerCase().includes(query) ||
      reporterName.includes(query) ||
      r.pelaporNama.toLowerCase().includes(query) ||
      r.status.toLowerCase().includes(query)
    );
  });

  // Unique list of students who have messaged or registered reports for admin workspace
  const chatThreadsForAdmin = users
    .filter((u) => u.role === 'siswa')
    .map((s) => {
      // Find latest message of this user
      const userMessages = messages.filter(
        (m) =>
          (m.pengirimId === s.id && m.penerimaId === session?.id) ||
          (m.pengirimId === session?.id && m.penerimaId === s.id)
      );

      // Sort by timestamp desc to get latest
      const sorted = [...userMessages].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const lastMsg = sorted[0];

      return {
        student: s,
        lastMessageText: lastMsg ? lastMsg.teks : 'Belum ada pesan.',
        lastMessageTime: lastMsg ? lastMsg.tanggal : '',
        lastTimestamp: lastMsg ? lastMsg.timestamp : '1970'
      };
    })
    .sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());

  // Filtered student chat threads for Admin
  const filteredChatThreadsForAdmin = chatThreadsForAdmin.filter(({ student, lastMessageText }) => {
    const hasMessages = lastMessageText !== 'Belum ada pesan.';
    if (chatFilterStatus === 'Aktif' && !hasMessages) return false;
    if (chatFilterStatus === 'Belum Mulai' && hasMessages) return false;

    if (chatFilterClass !== 'Semua' && student.kelas !== chatFilterClass) return false;

    const query = chatSearch.trim().toLowerCase();
    if (!query) return true;

    const matchesName = student.nama.toLowerCase().includes(query);
    const matchesUsername = student.username.toLowerCase().includes(query);
    const matchesClass = student.kelas ? student.kelas.toLowerCase().includes(query) : false;
    const matchesMessage = lastMessageText.toLowerCase().includes(query);

    const userMessages = messages.filter(
      (m) =>
        (m.pengirimId === student.id && m.penerimaId === session?.id) ||
        (m.pengirimId === session?.id && m.penerimaId === student.id)
    );
    const matchesAnyMessage = userMessages.some((m) => m.teks.toLowerCase().includes(query));

    return matchesName || matchesUsername || matchesClass || matchesMessage || matchesAnyMessage;
  });

  // Available administrative counseling accounts on school side
  const counselorAdmins = users.filter((u) => u.role === 'admin');

  // Filtered counselor admins for Student
  const filteredCounselorAdmins = counselorAdmins.filter((adm) => {
    const directHistory = messages.filter(
      (m) =>
        (m.pengirimId === session?.id && m.penerimaId === adm.id) ||
        (m.pengirimId === adm.id && m.penerimaId === session?.id)
    );
    const hasMessages = directHistory.length > 0;

    if (chatFilterStatus === 'Aktif' && !hasMessages) return false;
    if (chatFilterStatus === 'Belum Mulai' && hasMessages) return false;

    const query = chatSearch.trim().toLowerCase();
    if (!query) return true;

    const matchesName = adm.nama.toLowerCase().includes(query);
    const matchesAnyMessage = directHistory.some((m) => m.teks.toLowerCase().includes(query));

    return matchesName || matchesAnyMessage;
  });

  // Counts summary for Admin Dashboard
  const adminCounts = {
    tinggi: reports.filter((r) => r.prioritas === 'Tinggi' && r.status !== 'Selesai').length,
    diproses: reports.filter((r) => r.status === 'Proses').length,
    selesai: reports.filter((r) => r.status === 'Selesai').length,
    total: reports.length
  };

  const isDark = theme === 'dark';
  const isAdminDashboard = session?.role === 'admin' && viewState === 'dashboard';

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-all duration-300 flex items-center justify-center ${
      isAdminDashboard 
        ? 'p-0 overflow-hidden' 
        : 'py-0 md:py-8 px-0 md:px-4'
    } ${
      isDark ? 'bg-zinc-900' : 'bg-slate-100'
    }`}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 z-50 text-center max-w-sm w-11/12 mx-auto"
          >
            <div className="bg-blue-600 text-white shadow-xl rounded-full px-5 py-3 flex items-center justify-center space-x-2 border border-blue-400">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Notification specifically for Administrators on New 'Baru' Reports */}
      <AnimatePresence>
        {adminNewReportNotify && session?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 z-50 text-left max-w-sm w-11/12 mx-auto"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-start space-x-3 transition-colors ${
              isDark ? 'bg-zinc-900 border-red-900/50 text-zinc-100 shadow-red-950/20' : 'bg-white border-red-100 text-zinc-900 shadow-red-100/40 shadow-xl'
            }`}>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 shrink-0 animate-bounce mt-0.5">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-500 animate-pulse">Laporan Baru Masuk</span>
                  <button 
                    onClick={() => setAdminNewReportNotify(null)}
                    className={`p-0.5 rounded-lg hover:bg-zinc-500/10 transition-all ${isDark ? 'text-zinc-500 hover:text-zinc-350' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-xs font-bold leading-snug mt-1.5 truncate">
                  {adminNewReportNotify.jenis}
                </h4>
                <p className={`text-[11px] leading-relaxed mt-1 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {adminNewReportNotify.deskripsi || 'Tidak ada deskripsi'}
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Navigate to History Tab
                      setActiveTab(1);
                      // Set the selected report for immediate Triage / Details modal
                      setSelectedReportForTriage(adminNewReportNotify);
                      // Clear notification
                      setAdminNewReportNotify(null);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                  >
                    Tinjau Sekarang
                  </button>
                  <button
                    onClick={() => setAdminNewReportNotify(null)}
                    className={`px-2 py-1 text-[10px] font-semibold tracking-wide rounded-lg border transition-all ${
                      isDark ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-550/5' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main viewport Container (Styled exact vertical layout mimicking standard high-end screens or full desktop console) */}
      <div 
        id="app_shell"
        className={`w-full relative flex flex-col shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
          isAdminDashboard
            ? 'max-w-none w-screen h-screen min-h-screen border-0 rounded-none'
            : 'max-w-md min-h-screen md:min-h-[840px] md:max-h-[880px] md:rounded-3xl border-0 md:border'
        } ${
          isDark 
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
            : 'bg-slate-50 border-slate-200 text-zinc-900'
        }`}
      >
        
        {/* ==================== 1. VIEW LOGIN ==================== */}
        {viewState === 'login' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto justify-between select-none relative animate-fade-in">
            
            {/* Toggle Theme inline button in Login (Floating Right) */}
            <button
              type="button"
              onClick={toggleThemeMode}
              className={`absolute top-5 right-5 p-2.5 rounded-full transition-all border cursor-pointer ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:bg-zinc-800' 
                  : 'bg-white border-zinc-200 text-zinc-640 hover:bg-zinc-100 shadow-sm'
              }`}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Upper Logo Spacer */}
            <div className="text-center pt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 shadow-xl shadow-blue-500/10 mb-5">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-display font-medium tracking-tight text-blue-500">
                SpeakUp
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-sans tracking-wide">
                Sekolah Aman, Tanpa Perundungan
              </p>
            </div>

            {/* Login Inputs Frame */}
            <form onSubmit={handleLogin} className="space-y-4 my-8 md:my-4">
              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 pl-1">Username</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                      : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-medium text-zinc-500 pl-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 transition-all ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                        : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 text-white font-medium py-3 rounded-2xl text-sm hover:scale-[1.01] hover:bg-blue-700 active:scale-95 transition-all mt-4 shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:bg-zinc-500"
              >
                <span>{isLoggingIn ? 'Memvalidasi...' : 'Sign In'}</span>
              </button>

              <div className="flex items-center justify-between text-xs text-blue-500 pt-2 px-1 font-sans">
                <button 
                  type="button" 
                  onClick={() => triggerToast('Tanya Wali Kelas / Admin untuk melisensikan password baru.')} 
                  className="hover:underline"
                >
                  Lupa Sandi?
                </button>
                <button 
                  type="button" 
                  onClick={() => triggerToast('Pilih daftar Demo Akun di bawah ini untuk menguji sistem.')}
                  className="flex items-center space-x-1 hover:underline text-blue-600 font-medium"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Panduan Login</span>
                </button>
              </div>
            </form>

            {/* Master Seed Accounts Box */}
            <div className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-100/80 border-slate-200'}`}>
              <h3 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-tight">
                Demo Akun (Sandi Acak Sesi Ini):
              </h3>
              <div className="space-y-1.5 text-xs text-zinc-500">
                <div className="flex items-center justify-between p-1 rounded-xl h-9 hover:bg-zinc-500/10 cursor-pointer" onClick={() => autofillAccount('adminspeakup1', '3P26D5!')}>
                  <span className={`font-medium ${isDark ? 'text-zinc-350' : 'text-zinc-700'}`}>Admin 1</span>
                  <span>
                    <code className="text-blue-500 font-semibold underline">adminspeakup1</code>
                    <code className={`font-mono ml-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ 3P26D5!</code>
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 rounded-xl h-9 hover:bg-zinc-500/10 cursor-pointer" onClick={() => autofillAccount('adminspeakup2', 'AUD668!')}>
                  <span className={`font-medium ${isDark ? 'text-zinc-350' : 'text-zinc-700'}`}>Admin 2</span>
                  <span>
                    <code className="text-blue-500 font-semibold underline">adminspeakup2</code>
                    <code className={`font-mono ml-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ AUD668!</code>
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 rounded-xl h-9 hover:bg-zinc-500/10 cursor-pointer" onClick={() => autofillAccount('adminspeakup3', '75T621!')}>
                  <span className={`font-medium ${isDark ? 'text-zinc-350' : 'text-zinc-700'}`}>Admin 3</span>
                  <span>
                    <code className="text-blue-500 font-semibold underline">adminspeakup3</code>
                    <code className={`font-mono ml-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ 75T621!</code>
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 rounded-xl h-9 hover:bg-zinc-500/10 cursor-pointer" onClick={() => autofillAccount('adam', 'XNV283!')}>
                  <span className={`font-medium ${isDark ? 'text-zinc-350' : 'text-zinc-700'}`}>Siswa: adam</span>
                  <span>
                    <code className="text-blue-500 font-semibold underline">adam</code>
                    <code className={`font-mono ml-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ XNV283!</code>
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 rounded-xl h-9 hover:bg-zinc-500/10 cursor-pointer" onClick={() => autofillAccount('siti', 'N3E959!')}>
                  <span className={`font-medium ${isDark ? 'text-zinc-350' : 'text-zinc-700'}`}>Siswa: siti</span>
                  <span>
                    <code className="text-blue-500 font-semibold underline">siti</code>
                    <code className={`font-mono ml-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ N3E959!</code>
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== 2. ADMIN/STUDENT DASHBOARD ==================== */}
        {viewState === 'dashboard' && session && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Realtime Active SOS Banner (Brings app to life if any user is panicking) */}
            {activePanics.length > 0 && (
              <div className="bg-red-600 text-white text-xs px-4 py-2.5 flex items-center justify-between animate-pulse shrink-0">
                <div className="flex items-center space-x-1.5 font-bold tracking-wide">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>EMERGENCY: {activePanics[0].siswaNama} ({activePanics[0].siswaKelas || 'Siswa'}) Membutuhkan Bantuan!</span>
                </div>
                {session?.role === 'admin' ? (
                  <button 
                    onClick={() => handleResolvePanic(activePanics[0].id)}
                    className="bg-white text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider hover:bg-zinc-100"
                  >
                    Atasi
                  </button>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-red-200">Menunggu Admin</span>
                )}
              </div>
            )}

            {/* Header section (Light border, logo) */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 select-none ${
              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center p-1 shadow-md shadow-blue-500/20">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-medium text-base tracking-tight text-blue-500">
                  SpeakUp
                </span>
              </div>
              
              <div className="flex items-center space-x-2.5">
                {/* Header Theme Switcher */}
                <button
                  type="button"
                  onClick={toggleThemeMode}
                  className={`p-2 rounded-full transition-all border cursor-pointer ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:bg-zinc-800' 
                      : 'bg-slate-100 border-zinc-200 text-zinc-650 hover:bg-zinc-200/50 shadow-sm'
                  }`}
                  title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                {/* Profile Shortcut Badge */}
                <div 
                  onClick={() => setActiveTab(3)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer hover:bg-zinc-500/5 transition-all ${
                    isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-slate-100'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {session.avatar}
                  </div>
                  <span className="text-xs font-medium max-w-[80px] truncate">
                    {session.nama.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Main scrollable body area per Tab */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              
              {/* ==================== A. TAB: HOME (INDEX 0) ==================== */}
              {activeTab === 0 && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* ADMIN HOME VIEW */}
                  {session.role === 'admin' && (
                    <>
                      {/* Priority Metrics Cards Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className={`p-3 rounded-2xl border-l-[3.5px] border-l-red-500 border relative ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                          <p className={`text-[10px] font-bold tracking-wider capitalize truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Tinggi</p>
                          <p className={`text-2xl font-display font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{adminCounts.tinggi}</p>
                        </div>
                        <div className={`p-3 rounded-2xl border-l-[3.5px] border-l-blue-500 border relative ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                          <p className={`text-[10px] font-bold tracking-wider capitalize truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Diproses</p>
                          <p className={`text-2xl font-display font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{adminCounts.diproses}</p>
                        </div>
                        <div className={`p-3 rounded-2xl border-l-[3.5px] border-l-green-500 border relative ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                          <p className={`text-[10px] font-bold tracking-wider capitalize truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Selesai</p>
                          <p className={`text-2xl font-display font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{adminCounts.selesai}</p>
                        </div>
                        <div className={`p-3 rounded-2xl border-l-[3.5px] border-l-zinc-400 border relative ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                          <p className={`text-[10px] font-bold tracking-wider capitalize truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total</p>
                          <p className={`text-2xl font-display font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{adminCounts.total}</p>
                        </div>
                      </div>

                      {/* Responsive Grid for Shortcuts and Registration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

                        {/* Quick Navigation Frame Layout */}
                        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-sm'}`}>
                          <h3 className="text-xs font-bold text-zinc-500 pl-1 mb-3 uppercase tracking-wider">Navigasi Pintasan</h3>
                          <div className="space-y-2.5">
                            <button
                              onClick={() => { setActiveTab(1); setReportFilter('Semua'); }}
                              className="w-full bg-blue-600 text-white font-medium py-3 rounded-2xl text-xs hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center space-x-2"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Buka Daftar Laporan</span>
                            </button>

                            <button
                              onClick={() => {
                                // Trigger state/view or open FAB menu
                                setViewState('dashboard');
                                setActiveTab(0);
                                // Simulates opening FAB student registration
                                handleRandomizeAccountDraft();
                                triggerToast('Membuka menu pembuatan akun siswa.');
                                // In PDF: button "Buat Akun Siswa" swaps views. We can render account registration on page 5 middle image!
                                // Let's scroll or navigate to that UI component cleanly below.
                                const accEl = document.getElementById('section-buat-akun-siswa');
                                accEl?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-zinc-700 hover:bg-slate-200'
                              }`}
                            >
                              <User className="w-4 h-4" />
                              <span>Buat Akun Siswa</span>
                            </button>

                            <button
                              onClick={() => setShowPanduan(true)}
                              className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-zinc-700 hover:bg-slate-200'
                              }`}
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Panduan Penggunaan</span>
                            </button>

                            <button
                              onClick={handleDownloadPDF}
                              className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-zinc-700 hover:bg-slate-200'
                              }`}
                            >
                              <Download className="w-4 h-4 text-blue-500" />
                              <span>Unduh Rekap PDF</span>
                            </button>
                          </div>
                        </div>

                        {/* Administrative Account Registration Segment (Page 5 Middle Visual) */}
                        <div 
                          id="section-buat-akun-siswa"
                          className={`p-5 rounded-3xl border transition-all ${
                            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-sm font-bold tracking-tight text-blue-500">Buat Akun Siswa</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>ADMIN</span>
                          </div>
                          <p className="text-xs text-zinc-500 pl-0.5 mb-4">Generate akun resmi permanen untuk pelapor.</p>

                          <form onSubmit={handleCreateStudentAccount} className="space-y-3">
                            <input
                              type="text"
                              placeholder="Username"
                              value={provUsername}
                              onChange={(e) => setProvUsername(e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                              }`}
                            />
                            <input
                              type="text"
                              placeholder="Password"
                              value={provPassword}
                              onChange={(e) => setProvPassword(e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                              }`}
                            />
                            <input
                              type="text"
                              placeholder="Nama Lengkap Siswa"
                              value={provNama}
                              onChange={(e) => setProvNama(e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                              }`}
                            />
                            <div className="flex flex-col space-y-2">
                              {!isEditingClasses ? (
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={provKelas}
                                    onChange={(e) => setProvKelas(e.target.value)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                                    }`}
                                  >
                                    {classList.map(cls => (
                                      <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingClasses(true)}
                                    className={`p-2.5 rounded-xl border transition-all ${
                                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 shadow-sm'
                                    }`}
                                    title="Atur Kelas"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className={`p-3 rounded-xl border text-xs space-y-3 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-zinc-200'}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-zinc-500">Kelola Daftar Kelas</span>
                                    <button 
                                      type="button"
                                      onClick={() => setIsEditingClasses(false)} 
                                      className="text-blue-500 hover:underline font-medium"
                                    >
                                      Selesai
                                    </button>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={newClassName}
                                      onChange={e => setNewClassName(e.target.value)}
                                      placeholder="Nama Kelas Baru"
                                      className={`flex-1 px-3 py-2 rounded-lg text-xs border focus:outline-none ${
                                        isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleAddClass}
                                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                                    {classList.map(cls => (
                                      <div key={cls} className={`flex items-center justify-between p-1.5 rounded-lg border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-white'}`}>
                                        <span className="text-zinc-500 font-medium pl-1">{cls}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveClass(cls)}
                                          className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                    {classList.length === 0 && (
                                      <div className="text-center p-2 text-zinc-500 text-[10px]">Belum ada kelas</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {provMessage && (
                              <p className="text-[11px] font-bold text-blue-500 pl-1 py-1">{provMessage}</p>
                            )}

                            <div className="flex space-x-2 pt-1.5">
                              <button
                                type="button"
                                onClick={handleRandomizeAccountDraft}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-zinc-700'
                                }`}
                              >
                                🎲 Acak
                              </button>
                              <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl text-xs hover:bg-blue-700 transition-all"
                              >
                                Buat Akun
                              </button>
                            </div>
                          </form>

                          {/* Created list of current session */}
                          {provHistory.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-500/10">
                              <h4 className="text-xs font-bold text-zinc-500 mb-2">Riwayat Akun (Sesi Ini)</h4>
                              <div className="space-y-1.5 text-[11px]">
                                {provHistory.map((h, i) => (
                                  <div key={i} className="flex justify-between p-1.5 rounded-xl bg-zinc-500/5 font-mono">
                                    <span>{h.nama} ({h.username})</span>
                                    <span className="text-blue-500 font-bold">{h.pass}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Section: Daftar Akun Siswa */}
                      <div className={`p-6 rounded-3xl border mt-5 transition-all ${
                        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-md'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-500/10">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-500">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold tracking-tight">Daftar Akun Siswa</h3>
                              <p className="text-xs text-zinc-500">
                                Kelola dan tinjau seluruh akun siswa terdaftar di SpeakUp.
                              </p>
                            </div>
                          </div>
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 self-start sm:self-auto">
                            {users.filter(u => u.role === 'siswa').length} Akun Siswa
                          </div>
                        </div>

                        {/* Search and Dropdown Class Filter */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              placeholder="Cari nama, username, kelas..."
                              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                              }`}
                            />
                            {studentSearchQuery && (
                              <button
                                onClick={() => setStudentSearchQuery('')}
                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="w-full sm:w-48">
                            <select
                              value={studentClassFilter}
                              onChange={(e) => setStudentClassFilter(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                              }`}
                            >
                              <option value="Semua">Semua Kelas</option>
                              {Array.from(new Set([
                                ...classList,
                                ...users.filter(u => u.role === 'siswa').map(u => u.kelas).filter(Boolean) as string[]
                              ])).map((kls) => (
                                <option key={kls} value={kls}>{kls}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Student Accounts Grid / Table list */}
                        {users.filter(u => u.role === 'siswa').length === 0 ? (
                          <div className="text-center p-8 border border-dashed rounded-2xl text-xs text-zinc-500">
                            Tidak ada akun siswa terdaftar di database.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                              <thead>
                                <tr className={`text-[10px] font-bold uppercase tracking-wider border-b ${
                                  isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'
                                }`}>
                                  <th className="py-2.5 px-3">Nama Siswa</th>
                                  <th className="py-2.5 px-3">Kelas</th>
                                  <th className="py-2.5 px-3">Username</th>
                                  <th className="py-2.5 px-3">Password Resmi</th>
                                  <th className="py-2.5 px-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-500/10">
                                {users.filter(u => u.role === 'siswa')
                                  .filter(u => {
                                    const matchesSearch = studentSearchQuery.trim() === '' || 
                                      u.nama.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                      u.username.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                      (u.kelas && u.kelas.toLowerCase().includes(studentSearchQuery.toLowerCase()));
                                    
                                    const matchesClass = studentClassFilter === 'Semua' || u.kelas === studentClassFilter;
                                    return matchesSearch && matchesClass;
                                  })
                                  .map((u) => {
                                    const isNewlyCreated = provHistory.some(h => h.username === u.username);
                                    return (
                                      <tr key={u.id} className={`text-xs hover:bg-zinc-500/5 transition-colors group ${
                                        isNewlyCreated ? (isDark ? 'bg-blue-950/20' : 'bg-blue-50/40') : ''
                                      }`}>
                                        <td className="py-3 px-3">
                                          <div className="flex items-center space-x-2.5">
                                            <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                                              {u.avatar || u.nama.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                                                {u.nama}
                                              </span>
                                              {isNewlyCreated && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 animate-pulse">
                                                  ✨ Baru Saja Dibuat
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3">
                                          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                            {u.kelas || '-'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                                          {u.username}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-[11px]">
                                          <span className="bg-zinc-500/10 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">
                                            {u.password || 'Tersimpan'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                          <button
                                            onClick={() => {
                                              const credInfo = `Nama: ${u.nama}\nKelas: ${u.kelas}\nUsername: ${u.username}\nPassword: ${u.password || 'Tersimpan'}`;
                                              handleCopyToClipboard(credInfo, u.id);
                                            }}
                                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                                              copiedUserId === u.id
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : isDark
                                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                                                  : 'bg-slate-50 border-slate-200 text-zinc-700 hover:bg-slate-100'
                                            }`}
                                          >
                                            {copiedUserId === u.id ? (
                                              <>
                                                <Check className="w-3 h-3" />
                                                <span>Tersalin!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" />
                                                <span>Salin Akun</span>
                                              </>
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })
                                }
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* Summary of matching items */}
                        <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-500/10">
                          <span>
                            Menampilkan {
                              users.filter(u => u.role === 'siswa')
                                .filter(u => {
                                  const matchesSearch = studentSearchQuery.trim() === '' || 
                                    u.nama.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                    u.username.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                    (u.kelas && u.kelas.toLowerCase().includes(studentSearchQuery.toLowerCase()));
                                  
                                  const matchesClass = studentClassFilter === 'Semua' || u.kelas === studentClassFilter;
                                  return matchesSearch && matchesClass;
                                }).length
                            } dari {users.filter(u => u.role === 'siswa').length} siswa.
                          </span>
                          <span>Fitur Enkripsi Aman</span>
                        </div>

                      </div>
                    </>
                  )}

                  {/* STUDENT HOME VIEW (Page 6 Visuals) */}
                  {session.role === 'siswa' && (
                    <>
                      {/* Panoramic SOS SOS Red Panic banner button */}
                      <button
                        onClick={() => setShowPanicConfirm(true)}
                        className="w-full bg-red-600 text-white p-5 rounded-3xl border-0 hover:scale-[1.01] active:scale-95 transition-all text-center select-none shadow-xl shadow-red-500/10 relative overflow-hidden group tracking-wide group"
                      >
                        <div className="absolute inset-0 bg-red-500 group-hover:scale-110 opacity-10 blur-xl transition-all" />
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-2">
                          <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <h2 className="text-xl font-display font-medium tracking-tight">
                          PANIC BUTTON
                        </h2>
                        <p className="text-[11px] text-red-100 max-w-xs mx-auto mt-1 font-sans font-light leading-relaxed">
                          Ketuk segera jika Anda dalam bahaya fisik atau butuh bantuan darurat saat ini juga.
                        </p>
                      </button>

                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-zinc-500 pl-1 uppercase tracking-wider">
                          Pilih Mode Lapor
                        </h3>

                        {/* Card Options */}
                        <div
                          onClick={() => setShowLaporCepat(true)}
                          className={`p-4 rounded-3xl border cursor-pointer hover:border-blue-500/30 active:scale-98 transition-all flex items-center justify-between group ${
                            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                              <Zap className="w-5 h-5 fill-current" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-semibold">Laporan Cepat</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Lapor cepat &lt;60 detik</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div
                          onClick={() => setShowLaporLengkap(true)}
                          className={`p-4 rounded-3xl border cursor-pointer hover:border-blue-500/30 active:scale-98 transition-all flex items-center justify-between group ${
                            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 hover:bg-slate-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-semibold">Laporan Lengkap</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Form lengkap & terarah</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div
                          onClick={() => setShowPanduan(true)}
                          className={`p-4 rounded-3xl border cursor-pointer hover:border-blue-500/30 active:scale-98 transition-all flex items-center justify-between group ${
                            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 hover:bg-slate-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-semibold">Panduan Aplikasi</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Cara aman menggunakan SpeakUp</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </>
                  )}

                </div>
              )}

              {/* ==================== B. TAB: REPORTS (INDEX 1) ==================== */}
              {activeTab === 1 && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Header title */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-lg font-display font-medium text-blue-500">
                      {session.role === 'admin' ? 'Semua Laporan Masuk' : 'Riwayat Laporan'}
                    </h2>
                    {session.role === 'admin' && (
                      <button
                        onClick={handleDownloadPDF}
                        className={`flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/50 active:scale-95'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-slate-50 active:scale-95 shadow-sm'
                        }`}
                        title="Unduh semua laporan sebagai berkas PDF"
                      >
                        <Download className="w-4 h-4 text-blue-500" />
                        <span>Unduh Rekap PDF</span>
                      </button>
                    )}
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={session.role === 'admin' ? "Cari nama pelapor, laporan, status..." : "Cari laporan, lokasi, atau tanggal..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full px-4 py-3 pl-11 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' 
                          : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                    <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Filter chips (Horizontal Scrollable) */}
                  <div className="flex space-x-1.5 overflow-x-auto pb-1 invisible-scrollbar">
                    {session.role === 'admin' ? (
                      ['Semua', 'Baru', 'Proses', 'Selesai'].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setReportFilter(chip)}
                          className={`px-4.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all capitalize ${
                            reportFilter === chip
                              ? 'bg-blue-600 text-white'
                              : isDark 
                                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' 
                                : 'bg-slate-100 hover:bg-slate-200 text-zinc-600 shadow-sm'
                          }`}
                        >
                          {chip}
                        </button>
                      ))
                    ) : (
                      ['Semua', 'Proses', 'Draft'].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setReportFilter(chip)}
                          className={`px-4.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all capitalize ${
                            reportFilter === chip
                              ? 'bg-blue-600 text-white'
                              : isDark 
                                ? 'bg-zinc-900 text-zinc-400' 
                                : 'bg-slate-100 hover:bg-slate-200 text-zinc-600 shadow-sm'
                          }`}
                        >
                          {chip === 'Draft' ? 'Draft' : chip}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Dynamic report listings */}
                  <div className={session.role === 'admin' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                    {filteredReports.length === 0 ? (
                      <div className="text-center p-8 text-xs text-zinc-500 border border-dashed rounded-3xl">
                        Tidak ada laporan terdeteksi.
                      </div>
                    ) : (
                      filteredReports.map((rep) => (
                        <div
                          key={rep.id}
                          onClick={() => {
                            if (session.role === 'admin') {
                              handleOpenTriage(rep);
                            } else {
                              triggerToast(`Laporan "${rep.jenis}" berstatus: ${rep.status}. Catatan Admin: ${rep.catatan || 'Belum ada tanggapan.'}`);
                            }
                          }}
                          className={`p-4 rounded-3xl text-left border relative transition-all active:scale-[0.99] select-none ${
                            session.role === 'admin' ? 'cursor-pointer hover:border-blue-500/20' : ''
                          } ${
                            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                              {rep.jenis}
                            </h4>
                            <div className="flex space-x-1.5 items-center">
                              {/* Severity Level badge */}
                              {rep.prioritas === 'Tinggi' && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/10 uppercase tracking-widest">
                                  Tinggi
                                </span>
                              )}
                              {rep.prioritas === 'Sedang' && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10 uppercase tracking-widest">
                                  Sedang
                                </span>
                              )}
                              {rep.prioritas === 'Rendah' && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/10 uppercase tracking-widest">
                                  Rendah
                                </span>
                              )}

                              {/* Progress status Badge */}
                              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                rep.status === 'Selesai' 
                                  ? 'bg-green-500/10 text-green-500 border-green-500/15'
                                  : rep.status === 'Proses'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/15'
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/15'
                              }`}>
                                {rep.status === 'Baru' ? 'Baru' : rep.status === 'Proses' ? 'Sedang' : 'Selesai'}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed pl-0.5">
                            {rep.deskripsi}
                          </p>

                          <div className="mt-3.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-500/5 pt-2 pl-0.5">
                            <div className="flex items-center space-x-3 text-zinc-500">
                              <span className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span className="font-medium">
                                  {rep.isAnonim ? 'Anonim' : rep.pelaporNama}
                                </span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span className="truncate max-w-[120px]">{rep.lokasi}</span>
                              </span>
                            </div>
                            <span className="font-medium text-zinc-500 whitespace-nowrap">{rep.tanggal}</span>
                          </div>

                          {/* Admin response Note badge shown inside Report list card if exists */}
                          {rep.catatan && (
                            <div className="mt-2.5 p-2 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-blue-500 pl-3 relative flex items-start space-x-1">
                              <span className="font-bold shrink-0">Admin:</span>
                              <p className="font-normal italic truncate">{rep.catatan}</p>
                            </div>
                          )}

                        </div>
                      )))}
                    </div>
                  </div>

              )}

              {/* ==================== C. TAB: CHAT / COUNSELING (INDEX 2) ==================== */}
              {activeTab === 2 && (
                <div className="space-y-4 animate-fade-in flex flex-col h-full">
                  
                  {/* Title */}
                  <h2 className="text-lg font-display font-medium text-blue-500 select-none">
                    {session.role === 'admin' ? 'Kontak Siswa' : 'Pilih Tujuan Konseling'}
                  </h2>

                  {/* Search thread */}
                  <div className="flex flex-col gap-3 shrink-0 select-none">
                    <div className="relative">
                      <input
                        type="text"
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder={session.role === 'admin' ? "Cari nama siswa, username, kelas, atau isi pesan..." : "Cari nama admin atau isi pesan..."}
                        className={`w-full px-4 py-3 pl-11 pr-10 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                          isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' 
                            : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
                        }`}
                      />
                      <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      {chatSearch && (
                        <button
                          onClick={() => setChatSearch('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-1">Status:</span>
                      {['Semua', 'Aktif', 'Belum Mulai'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setChatFilterStatus(status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            chatFilterStatus === status
                              ? 'bg-blue-600 text-white'
                              : isDark
                                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                                : 'bg-slate-100 hover:bg-slate-200 text-zinc-600 shadow-sm'
                          }`}
                        >
                          {status}
                        </button>
                      ))}

                      {session.role === 'admin' && (
                        <div className="flex items-center space-x-2 ml-auto shrink-0 mt-1 sm:mt-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-1">Kelas:</span>
                          <select
                            value={chatFilterClass}
                            onChange={(e) => setChatFilterClass(e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border focus:outline-none transition-all cursor-pointer ${
                              isDark 
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                                : 'bg-slate-100 border-zinc-200 text-zinc-600'
                            }`}
                          >
                            <option value="Semua">Semua Kelas</option>
                            {Array.from(new Set([
                              ...classList,
                              ...users.filter(u => u.role === 'siswa').map(u => u.kelas).filter(Boolean) as string[]
                            ])).map((kls) => (
                              <option key={kls} value={kls}>{kls}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Threads mapping list */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    
                    {/* ADMIN VIEW CHAT THREADS LISTING */}
                    {session.role === 'admin' && (
                      <>
                        {filteredChatThreadsForAdmin.length === 0 ? (
                          <div className="text-center p-12 text-xs text-zinc-550 border border-dashed rounded-3xl select-none mt-2">
                            <MessageSquare className="w-8 h-8 mx-auto text-zinc-650 opacity-60 mb-2" />
                            <p className="font-semibold text-zinc-500">Tidak ada chat siswa ditemukan.</p>
                            <p className="text-[10px] text-zinc-450 mt-1">Gunakan kata kunci pencarian berbeda atau reset filter.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredChatThreadsForAdmin.map(({ student, lastMessageText, lastMessageTime }) => (
                              <div
                                key={student.id}
                                onClick={() => setActiveChatPartner(student)}
                                className={`p-4 rounded-3xl flex items-center justify-between border cursor-pointer hover:border-blue-500/20 active:scale-98 transition-all relative ${
                                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3.5 w-9/12">
                                  <div className="w-10 h-10 rounded-full bg-blue-600/15 text-blue-600 font-bold flex items-center justify-center shrink-0">
                                    {student.avatar}
                                  </div>
                                  <div className="text-left w-full">
                                    <h4 className="text-xs font-bold leading-none">{student.nama}</h4>
                                    <p className="text-[10px] text-blue-500 mt-1 font-bold">{student.kelas || 'Siswa'}</p>
                                    <p className="text-[11px] text-zinc-500 mt-1.5 truncate max-w-full font-sans tracking-tight">
                                      {lastMessageText}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-medium pl-2 whitespace-nowrap">
                                  {lastMessageTime || 'Baru'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* STUDENT VIEW COUNSELING LISTING (Direct access targets shown on Page 7 Middle Screen) */}
                    {session.role === 'siswa' && (
                      <>
                        {filteredCounselorAdmins.length === 0 ? (
                          <div className="text-center p-12 text-xs text-zinc-550 border border-dashed rounded-3xl select-none mt-2">
                            <MessageSquare className="w-8 h-8 mx-auto text-zinc-650 opacity-60 mb-2" />
                            <p className="font-semibold text-zinc-500">Tidak ada admin konseling ditemukan.</p>
                            <p className="text-[10px] text-zinc-450 mt-1">Ubah kata kunci pencarian atau hilangkan filter aktif.</p>
                          </div>
                        ) : (
                          filteredCounselorAdmins.map((adm) => {
                            // Find latest text block between Student and this specified Admin
                            const directHistory = messages.filter(
                              (m) =>
                                (m.pengirimId === session.id && m.penerimaId === adm.id) ||
                                (m.pengirimId === adm.id && m.penerimaId === session.id)
                            );
                            const sorted = [...directHistory].sort(
                              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                            );
                            const lastMsg = sorted[0];

                            return (
                              <div
                                key={adm.id}
                                onClick={() => setActiveChatPartner(adm)}
                                className={`p-4 rounded-3xl flex items-center justify-between border cursor-pointer hover:border-blue-500/20 active:scale-98 transition-all ${
                                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3.5 w-9/12 animate-fade-in">
                                  <div className="w-10 h-10 rounded-full bg-red-600/10 text-red-600 font-bold flex items-center justify-center shrink-0">
                                    {adm.avatar}
                                  </div>
                                  <div className="text-left w-full">
                                    <h4 className="text-xs font-bold leading-none">{adm.nama}</h4>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 mt-1.5 inline-block uppercase tracking-wider">
                                      Administrator
                                    </span>
                                    <p className="text-[11px] text-zinc-500 mt-1.5 truncate leading-tight font-sans">
                                      {lastMsg ? lastMsg.teks : 'Ketuk untuk memulai konseling aman.'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-medium pl-2 whitespace-nowrap">
                                  {lastMsg ? lastMsg.tanggal : ''}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </>
                    )}

                  </div>

                </div>
              )}

              {/* ==================== D. TAB: PROFILE (INDEX 3) ==================== */}
              {activeTab === 3 && (
                <div className="space-y-5 animate-fade-in select-none">
                  
                  {/* Header title */}
                  <h2 className="text-lg font-display font-medium text-blue-500">
                    Akun Pengguna
                  </h2>

                  {/* Profile Card Header visual (Page 4 visual) */}
                  <div className={`p-6 rounded-3xl text-center border ${
                    isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md mb-3">
                      {session.avatar}
                    </div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{session.nama}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {session.role === 'admin' ? 'Administrator' : `${session.kelas || 'Siswa'}`}
                    </p>
                    <span className="inline-block text-[9px] font-bold px-3 py-1 rounded-full bg-blue-600/10 text-blue-500 mt-3 border border-blue-500/10 uppercase tracking-widest leading-none">
                      {session.role}
                    </span>
                  </div>

                  {/* Options Stack Grid layout */}
                  <div className={`rounded-3xl border divide-y overflow-hidden ${
                    isDark ? 'bg-zinc-900/40 border-zinc-800 divide-zinc-800' : 'bg-white border-zinc-200 divide-slate-100 shadow-sm'
                  }`}>
                    
                    <div 
                      onClick={handleOpenEditProfile}
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-500/5 transition-all text-xs ${
                        isDark ? 'text-zinc-350' : 'text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-zinc-500" />
                        <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>Edit Profil</span>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-zinc-500" />
                    </div>

                    <div 
                      onClick={() => setShowPanduan(true)}
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-500/5 transition-all text-xs ${
                        isDark ? 'text-zinc-350' : 'text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-4 h-4 text-zinc-500" />
                        <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-800'} whitespace-nowrap`}>Panduan Penggunaan</span>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-zinc-500" />
                    </div>

                    <div 
                      onClick={toggleThemeMode}
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-500/5 transition-all text-xs ${
                        isDark ? 'text-zinc-350' : 'text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isDark ? <Moon className="w-4 h-4 text-zinc-500" /> : <Sun className="w-4 h-4 text-zinc-500" />}
                        <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>Tema Tampilan</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-500 capitalize">{theme === 'dark' ? 'Gelap' : 'Terang'}</span>
                    </div>

                    <div 
                      onClick={() => setShowLogoutConfirm(true)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-red-500/5 transition-all text-xs"
                    >
                      <div className="flex items-center space-x-3 text-red-500">
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">Keluar Akun</span>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-red-500" />
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Bottom Tab Bar navigation layout */}
            <div className={`absolute bottom-0 inset-x-0 h-16 border-t flex items-center justify-around z-40 select-none ${
              isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-white border-zinc-100/80 shadow-lg'
            }`}>
              
              {/* Tab: Home */}
              <button
                onClick={() => { setActiveTab(0); setActiveChatPartner(null); }}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                  activeTab === 0 
                    ? 'text-blue-500 scale-105' 
                    : 'text-zinc-500 hover:text-zinc-600 hover:scale-[1.02]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Shield className={`w-5 h-5 ${activeTab === 0 ? 'fill-blue-500/10' : ''}`} />
                </div>
                <span className="text-[9px] font-semibold tracking-wider font-sans mt-0.5">Home</span>
              </button>

              {/* Tab: Lists */}
              <button
                onClick={() => { setActiveTab(1); setActiveChatPartner(null); }}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                  activeTab === 1 
                    ? 'text-blue-500 scale-105' 
                    : 'text-zinc-500 hover:text-zinc-600 hover:scale-[1.02]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <FileText className={`w-5 h-5 ${activeTab === 1 ? 'fill-blue-500/10' : ''}`} />
                </div>
                <span className="text-[9px] font-semibold tracking-wider font-sans mt-0.5">Riwayat</span>
              </button>

              {/* Central high-voltage Floating Action Button (FAB) (Page 3/6 bottom layouts) */}
              <div className="relative -top-3 scale-110">
                {session.role === 'admin' ? (
                  // Admin FAB (+ Icon): Opens registration section in administrative homepage
                  <button
                    onClick={() => {
                      setActiveTab(0);
                      handleRandomizeAccountDraft();
                      triggerToast('Sandi acak di-generate! Pembuatan akun dibuka.');
                      setTimeout(() => {
                        const accEl = document.getElementById('section-buat-akun-siswa');
                        accEl?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 hover:bg-blue-700 active:scale-95 transition-all select-none"
                    aria-label="Buat Akun Siswa"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                ) : (
                  // Student FAB (Warning/SOS Icon): Opens Emergency prompt instantly from anywhere!
                  <button
                    onClick={() => setShowPanicConfirm(true)}
                    className="w-12 h-12 rounded-full bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center hover:scale-110 hover:bg-red-700 active:scale-95 transition-all animate-pulse"
                    aria-label="Panic Button"
                  >
                    <AlertTriangle className="w-5.5 h-5.5 text-white" />
                  </button>
                )}
              </div>

              {/* Tab: Chat */}
              <button
                onClick={() => { setActiveTab(2); }}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                  activeTab === 2 
                    ? 'text-blue-500 scale-105' 
                    : 'text-zinc-500 hover:text-zinc-600 hover:scale-[1.02]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <MessageSquare className={`w-5 h-5 ${activeTab === 2 ? 'fill-blue-500/10' : ''}`} />
                </div>
                <span className="text-[9px] font-semibold tracking-wider font-sans mt-0.5">Chat</span>
              </button>

              {/* Tab: Profile */}
              <button
                onClick={() => { setActiveTab(3); setActiveChatPartner(null); }}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                  activeTab === 3 
                    ? 'text-blue-500 scale-105' 
                    : 'text-zinc-500 hover:text-zinc-600 hover:scale-[1.02]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <User className={`w-5 h-5 ${activeTab === 3 ? 'fill-blue-500/10' : ''}`} />
                </div>
                <span className="text-[9px] font-semibold tracking-wider font-sans mt-0.5">Profil</span>
              </button>

            </div>

            {/* ==================== SCREEN OVERLAYS & MODALS ==================== */}

            {/* 1. CHAT ROOM OVERLAY (Full View, Page 4 right screen) */}
            <AnimatePresence>
              {activeChatPartner && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                  className={`absolute inset-0 z-50 flex flex-col h-full ${
                    isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'
                  }`}
                >
                  {/* Chat header bar */}
                  <div className={`p-4 border-b flex items-center space-x-3 shrink-0 ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <button 
                      onClick={() => setActiveChatPartner(null)}
                      className="text-zinc-500 hover:text-zinc-700 focus:outline-none"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                      {activeChatPartner.avatar}
                    </div>

                    <div className="text-left flex-1 min-w-0">
                      <h3 className="text-xs font-bold leading-none truncate">{activeChatPartner.nama}</h3>
                      <p className="text-[10px] text-zinc-500 mt-1 pl-0.5 truncate uppercase tracking-widest font-sans font-bold">
                        {activeChatPartner.role === 'admin' ? 'Administrator' : activeChatPartner.kelas || 'Siswa'}
                      </p>
                    </div>
                  </div>

                  {/* Chat message body list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col">
                    {messages
                      .filter(
                        (m) =>
                          (m.pengirimId === session.id && m.penerimaId === activeChatPartner.id) ||
                          (m.pengirimId === activeChatPartner.id && m.penerimaId === session.id)
                      )
                      .map((msg) => {
                        const isSelf = msg.pengirimId === session.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-xs relative text-left ${
                              isSelf
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : isDark
                                  ? 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800'
                                  : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-200'
                            }`}>
                              <p className="leading-relaxed whitespace-pre-line tracking-wide">{msg.teks}</p>
                              <span className={`text-[9px] font-mono block text-right mt-1 opacity-60 ${isSelf ? 'text-blue-100' : 'text-zinc-400'}`}>
                                {msg.tanggal}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Bottom input typing box bar (Page 4 visual) */}
                  <form onSubmit={handleSendDirectMessage} className={`p-3.5 border-t shrink-0 flex items-center space-x-2 ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    
                    <button
                      type="button"
                      onClick={() => triggerToast('Dukungan pengunggahan bukti dokumen diaktifkan saat ini.')}
                      className="p-2 text-zinc-500 hover:text-zinc-600 hover:scale-105 transition-all"
                    >
                      <Paperclip className="w-4.5 h-4.5" />
                    </button>

                    <input
                      type="text"
                      placeholder="Ketik balasan..."
                      value={chatInputValue}
                      onChange={(e) => setChatInputValue(e.target.value)}
                      className={`flex-1 px-4 py-2.5 rounded-full text-xs border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' 
                          : 'bg-slate-100 border-slate-200 text-zinc-900'
                      }`}
                    />

                    <button
                      type="submit"
                      className="p-2 border-0 bg-blue-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow shadow-blue-500/10 flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 ml-0.5" />
                    </button>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. OVERLAY MODAL: CASE TRIAGE FOR ADMINS (Page 5 left screen) */}
            <AnimatePresence>
              {selectedReportForTriage && (
                <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4 select-none">
                  
                  {/* Backdrop Closer */}
                  <div className="absolute inset-0 cursor-default" onClick={() => setSelectedReportForTriage(null)} />

                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className={`w-full max-w-sm md:max-w-md rounded-[2.5rem] p-6 border relative z-10 text-left ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
                        Tinjau Kasus
                      </h3>
                      <button 
                        onClick={() => setSelectedReportForTriage(null)}
                        className="p-1 text-zinc-500 hover:text-zinc-700"
                      >
                        <X className="w-5 h-5 focus:outline-none" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveTriage} className="space-y-4">
                      {/* Informasi Pelapor card with direct Chat Pelapor button */}
                      {(() => {
                        const pelaporUser = users.find((u) => u.id === selectedReportForTriage.pelaporId);
                        return (
                          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-zinc-100'
                          }`}>
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                {pelaporUser?.avatar || (selectedReportForTriage.isAnonim ? 'A' : selectedReportForTriage.pelaporNama.charAt(0).toUpperCase())}
                              </div>
                              <div className="text-left min-w-0">
                                <span className="text-[9px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block leading-none">Pelapor</span>
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate mt-1">
                                  {selectedReportForTriage.isAnonim ? 'Anonim' : selectedReportForTriage.pelaporNama}
                                </span>
                                {selectedReportForTriage.isAnonim && pelaporUser && (
                                  <span className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 block mt-0.5 italic truncate">
                                    Akun: {pelaporUser.nama} ({selectedReportForTriage.pelaporKelas || 'Siswa'})
                                  </span>
                                )}
                                {!selectedReportForTriage.isAnonim && selectedReportForTriage.pelaporKelas && (
                                  <span className="text-[9px] font-bold text-blue-500 block mt-0.5">
                                    {selectedReportForTriage.pelaporKelas}
                                  </span>
                                )}
                              </div>
                            </div>

                            {pelaporUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveChatPartner(pelaporUser);
                                  setActiveTab(2);
                                  setSelectedReportForTriage(null);
                                  triggerToast(`Membuka obrolan dengan ${selectedReportForTriage.isAnonim ? 'Pelapor Anonim' : pelaporUser.nama}...`);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold flex items-center space-x-1 transition-all shrink-0 cursor-pointer shadow shadow-blue-500/10"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Chat Pelapor</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-1 block">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Deskripsi Lengkap</label>
                        <div className={`p-3 rounded-xl text-xs select-text block overflow-y-auto max-h-[90px] border leading-relaxed ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-zinc-100 text-zinc-600'
                        }`}>
                          {selectedReportForTriage.deskripsi}
                        </div>
                      </div>

                      {/* Display custom report meta-fields (Frekuensi and Relasi) if they exist */}
                      {(selectedReportForTriage.frekuensi || selectedReportForTriage.relasi) && (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedReportForTriage.frekuensi && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Frekuensi</label>
                              <div className={`p-2.5 rounded-xl text-xs border ${
                                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-zinc-100 text-zinc-700'
                              }`}>
                                {selectedReportForTriage.frekuensi}
                              </div>
                            </div>
                          )}
                          {selectedReportForTriage.relasi && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Relasi Pelaku</label>
                              <div className={`p-2.5 rounded-xl text-xs border ${
                                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-zinc-100 text-zinc-700'
                              }`}>
                                {selectedReportForTriage.relasi}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Prioritas</label>
                        <select
                          value={triagePrioritas}
                          onChange={(e) => setTriagePrioritas(e.target.value as any)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="Tinggi">🔴 Tinggi</option>
                          <option value="Sedang">🟡 Sedang</option>
                          <option value="Rendah">🔵 Rendah</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Status</label>
                        <select
                          value={triageStatus}
                          onChange={(e) => setTriageStatus(e.target.value as any)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="Baru">⚪ Baru</option>
                          <option value="Proses">🔵 Proses</option>
                          <option value="Selesai">🟢 Selesai</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Catatan Penanganan</label>
                        <textarea
                          placeholder="Berikan tindak lanjut kasus oleh Admin..."
                          value={triageCatatan}
                          onChange={(e) => setTriageCatatan(e.target.value)}
                          rows={3}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900 shadow-inner'
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-medium py-3 rounded-2xl text-xs hover:bg-blue-700 transition-all mt-4 inline-block shadow-lg shadow-blue-500/10 cursor-pointer text-center"
                      >
                        Simpan Perubahan
                      </button>
                    </form>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

            {/* 3. OVERLAY MODAL: PANIC BUTTON EMERGENCY TRIGGER CONFIRMATION (Page 6 middle screen) */}
            <AnimatePresence>
              {showPanicConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 select-none animate-fade-in">
                  
                  {/* Backdrop Closer */}
                  <div className="absolute inset-0" onClick={() => setShowPanicConfirm(false)} />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-xs rounded-[2.2rem] p-6 border relative z-10 text-center ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3.5">
                      <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
                    </div>

                    <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      Kirim Darurat?
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2.5 max-w-full leading-relaxed pl-1">
                      Apakah Anda butuh bantuan fisik segera? Panggilan darurat menyiagakan Tim Admin sekolah sekarang juga.
                    </p>

                    <div className="flex space-x-2 pt-5">
                      <button
                        onClick={() => setShowPanicConfirm(false)}
                        className={`flex-1 py-3 rounded-2xl text-xs font-semibold border transition-all ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-zinc-700'
                        }`}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSendPanicAlert}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-2xl text-xs transition-all shadow-lg shadow-red-500/15"
                      >
                        Kirim Bantuan
                      </button>
                    </div>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

            {/* 4. OVERLAY SHEET: STUDENT QUICK REPORT DIALOG (Laporan Cepat) */}
            <AnimatePresence>
              {showLaporCepat && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-4 select-none animate-fade-in">
                  
                  <div className="absolute inset-0" onClick={() => setShowLaporCepat(false)} />

                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className={`w-full max-w-sm rounded-[2.5rem] p-6 border relative z-10 text-left ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-blue-500">
                          Laporan Cepat
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Laporkan perundungan dalam &lt;60 detik</p>
                      </div>
                      <button 
                        onClick={() => setShowLaporCepat(false)}
                        className="p-1 text-zinc-500 hover:text-zinc-700 focus:outline-none"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitLaporCepat} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Lokasi Kejadian</label>
                        <input
                          type="text"
                          placeholder="misal: Kantin, Ruang Kelas 10A, Toilet Lt.2"
                          value={formCepatLokasi}
                          onChange={(e) => setFormCepatLokasi(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900 shadow-inner'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Isi Laporan / Kejadian</label>
                        <textarea
                          placeholder="Ceritakan singkat kronologi kejadian..."
                          value={formCepatDeskripsi}
                          onChange={(e) => setFormCepatDeskripsi(e.target.value)}
                          rows={3}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900 shadow-inner'
                          }`}
                        />
                      </div>

                      {/* Anonim block toggle code */}
                      <div className="flex items-center justify-between p-3.5 bg-blue-500/5 rounded-2xl border border-blue-500/10 mb-4 select-none">
                        <div className="text-left">
                          <h4 className="text-xs font-semibold text-blue-500">Lapor Secara Anonim</h4>
                          <p className="text-[9px] text-zinc-500 mt-0.5">Nama Anda tidak akan diungkap sistem.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formCepatIsAnonim}
                          onChange={(e) => setFormCepatIsAnonim(e.target.checked)}
                          className="w-4.5 h-4.5 text-blue-600 rounded bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                        />
                      </div>

                      {/* Security basic mathematics verification */}
                      <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-zinc-150'}`}>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Verifikasi Keamanan</label>
                          <span className="text-[9px] font-semibold text-blue-500">Hitung Matematika</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-3">
                          <div className={`px-3 py-2 rounded-xl text-xs font-bold font-mono tracking-wider shrink-0 ${
                            isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                          }`}>
                            {mathNum1} {mathOp} {mathNum2} =
                          </div>
                          <input
                            type="number"
                            required
                            placeholder="Jawaban"
                            value={mathUserAnswer}
                            onChange={(e) => setMathUserAnswer(e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs border font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-center transition-all ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-inner'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-medium py-3 rounded-2xl text-xs hover:bg-blue-700 transition-all inline-block shadow-lg shadow-blue-500/10 cursor-pointer text-center"
                      >
                        Kirim Laporan
                      </button>
                    </form>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

            {/* 5. OVERLAY SHEET: STUDENT DETAILED REPORT DIALOG (Laporan Lengkap) */}
            <AnimatePresence>
              {showLaporLengkap && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-4 select-none animate-fade-in">
                  
                  <div className="absolute inset-0" onClick={() => setShowLaporLengkap(false)} />

                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className={`w-full max-w-sm rounded-[2.5rem] p-6 border relative z-10 text-left ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-blue-500">
                          Laporan Lengkap
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Ceritakan secara kronologis & terarah</p>
                      </div>
                      <button 
                        onClick={() => setShowLaporLengkap(false)}
                        className="p-1 text-zinc-500 hover:text-zinc-700 focus:outline-none"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitLaporLengkap} className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Kategori Perundungan</label>
                        <select
                          value={formLengkapJenis}
                          onChange={(e) => setFormLengkapJenis(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="Bullying Verbal">🗣️ Bullying Verbal (Ejekan/Cercaan)</option>
                          <option value="Bullying Fisik">👊 Bullying Fisik (Kekerasan)</option>
                          <option value="Cyber Bullying">📱 Cyber Bullying (Sosial Media)</option>
                          <option value="Bullying Sosial">👥 Bullying Sosial (Pengucilan)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Lokasi Kejadian</label>
                        <input
                          type="text"
                          placeholder="misal: Kelas 10A, Lapangan Belakang, Toilet Lt.2"
                          value={formLengkapLokasi}
                          onChange={(e) => setFormLengkapLokasi(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900 shadow-inner'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Frekuensi Kejadian</label>
                        <select
                          value={formLengkapFrekuensi}
                          onChange={(e) => setFormLengkapFrekuensi(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="Satu Kali">1️⃣ Baru pertama kali terjadi</option>
                          <option value="Beberapa Kali (2-5 kali)">🔄 Beberapa kali terjadi (2-5 kali)</option>
                          <option value="Sering (>5 kali)">⚠️ Sering terjadi (lebih dari 5 kali)</option>
                          <option value="Setiap Hari">📅 Hampir setiap hari terjadi</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Relasi dengan Pelaku</label>
                        <select
                          value={formLengkapRelasi}
                          onChange={(e) => setFormLengkapRelasi(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="Teman Sekelas">🏫 Teman Sekelas</option>
                          <option value="Teman Beda Kelas">👥 Teman Beda Kelas</option>
                          <option value="Kakak Kelas">🎓 Kakak Kelas (Senior)</option>
                          <option value="Adik Kelas">👶 Adik Kelas (Junior)</option>
                          <option value="Guru / Staf Sekolah">👨‍🏫 Guru / Staf Sekolah</option>
                          <option value="Lainnya / Tidak Dikenal">❓ Lainnya / Orang Luar / Tidak Dikenal</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block pl-0.5">Kronologi Kejadian</label>
                        <textarea
                          placeholder="Silakan menceritakan kronologis secara meluas dan urut sejelas mungkin..."
                          value={formLengkapDeskripsi}
                          onChange={(e) => setFormLengkapDeskripsi(e.target.value)}
                          rows={4}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900 shadow-inner'
                          }`}
                        />
                      </div>

                      {/* Anonim block toggle code */}
                      <div className="flex items-center justify-between p-3.5 bg-blue-500/5 rounded-2xl border border-blue-500/10 select-none">
                        <div className="text-left">
                          <h4 className="text-xs font-semibold text-blue-500">Lapor Secara Anonim</h4>
                          <p className="text-[9px] text-zinc-500 mt-0.5">Identitas asli Anda tersembunyi sepenuhnya.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formLengkapIsAnonim}
                          onChange={(e) => setFormLengkapIsAnonim(e.target.checked)}
                          className="w-4.5 h-4.5 text-blue-600 rounded bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                        />
                      </div>

                      {/* Security basic mathematics verification */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-zinc-150'}`}>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Verifikasi Keamanan</label>
                          <span className="text-[9px] font-semibold text-blue-500">Hitung Matematika</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-3">
                          <div className={`px-3 py-2 rounded-xl text-xs font-bold font-mono tracking-wider shrink-0 ${
                            isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                          }`}>
                            {mathNum1} {mathOp} {mathNum2} =
                          </div>
                          <input
                            type="number"
                            required
                            placeholder="Jawaban"
                            value={mathUserAnswer}
                            onChange={(e) => setMathUserAnswer(e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs border font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-center transition-all ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-inner'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-medium py-3 rounded-2xl text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 cursor-pointer text-center"
                      >
                        Kirim Laporan
                      </button>
                    </form>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

            {/* 6. OVERLAY MODAL: PANDUAN SPEAKUP - HELP GUIDES (Page 4 middle screen) */}
            <AnimatePresence>
              {showPanduan && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 select-none animate-fade-in">
                  
                  <div className="absolute inset-0" onClick={() => setShowPanduan(false)} />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-sm rounded-[2.5rem] p-6 border relative z-10 text-left flex flex-col max-h-[90%] overflow-hidden ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                          Panduan SpeakUp
                        </h3>
                      </div>
                      <button 
                        onClick={() => setShowPanduan(false)}
                        className="p-1 text-zinc-500 hover:text-zinc-700 focus:outline-none"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-4">
                      
                      {session.role === 'admin' ? (
                        <>
                          {/* Admin Help Panels */}
                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 truncate mr-1.5" />
                              TINJAU KASUS (Triage)
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Buka tab Riwayat. Klik pada laporan masuk untuk mengubah <strong>Prioritas, Status (Proses/Selesai)</strong>, dan memberikan catatan penanganan dari sekolah.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-blue-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 truncate mr-1.5" />
                              PEMBUATAN AKUN
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Tekan tombol plus (+) bulat di tengah bawah untuk membuat akun resmi siswa (permanen) baru. Catat informasinya untuk diserahkan ke murid pelapor.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-green-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 truncate mr-1.5" />
                              KONSELING AMAN
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Gunakan tab Chat untuk menghubungi pelapor atau saksi secara langsung. Kerahasiaan dijamin dalam sistem terenkripsi lokal dan Anda dapat bertukar lampiran berkas bukti.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Student Help Panels */}
                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-red-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 truncate mr-1.5" />
                              PANIC BUTTON
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Tekan tombol merah besar di menu Home hanya saat Anda dalam bahaya fisik. Sistem akan mengirim sinyal darurat ke seluruh jajaran keamanan dan Admin sekolah.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 truncate mr-1.5" />
                              LAPORAN CEPAT
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Gunakan untuk melaporkan kejadian secara kilat (kurang dari 60 detik) dengan mengisi lokasi dan deskripsi singkat dari kejadian perundungan.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-blue-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 truncate mr-1.5" />
                              LAPORAN LENGKAP
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Gunakan untuk menceritakan kejadian secara kronologis, lengkap dengan kategori bullying (Fisik, Verbal, Cyber, Sosial), saksi, pelaku, hingga lampiran bukti.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
                            <h4 className="text-xs font-black text-green-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 truncate mr-1.5" />
                              MODE ANONIM
                            </h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Jika Anda takut identitas diketahui, centang <strong>Lapor Anonim</strong> pada form laporan. Nama Anda akan disembunyikan seluruhnya dari mata guru maupun siswa lain.
                            </p>
                          </div>
                        </>
                      )}

                    </div>

                    <button
                      onClick={() => setShowPanduan(false)}
                      className="w-full bg-blue-600 text-white font-medium py-3 rounded-2xl text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 cursor-pointer text-center shrink-0"
                    >
                      Saya Mengerti
                    </button>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

            {/* OVERLAY MODAL: CONFIRM LOGOUT */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 select-none animate-fade-in">
                  
                  {/* Backdrop Closer */}
                  <div className="absolute inset-0 cursor-default" onClick={() => setShowLogoutConfirm(false)} />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className={`w-full max-w-xs rounded-[2.2rem] p-6 border relative z-10 text-center ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-3.5">
                      <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>

                    <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      Keluar dari SpeakUp?
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-full leading-relaxed pl-1">
                      Anda harus memasukkan username dan password kembali untuk mengakses dashboard laporan.
                    </p>

                    <div className="flex space-x-2 pt-5">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className={`flex-1 py-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-zinc-700 hover:bg-slate-100'
                        }`}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-2xl text-xs transition-all shadow-lg shadow-red-500/15 cursor-pointer"
                      >
                        Ya, Keluar
                      </button>
                    </div>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

            {/* OVERLAY MODAL: EDIT PROFILE */}
            <AnimatePresence>
              {showEditProfileModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 select-none animate-fade-in">
                  
                  {/* Backdrop Closer */}
                  <div className="absolute inset-0 cursor-default" onClick={() => setShowEditProfileModal(false)} />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className={`w-full max-w-sm rounded-[2.2rem] p-6 border relative z-10 ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        Edit Profil Pengguna
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setShowEditProfileModal(false)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {/* Avatar Selection section */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                          Pilih Avatar / Emoji
                        </label>
                        
                        {/* Current selected preview */}
                        <div className="flex items-center space-x-3 mb-2.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                            {editProfileAvatar}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-blue-500">Pratinjau Avatar</span>
                            <div className="text-[11px] text-zinc-500 font-mono">Aktif: {editProfileAvatar}</div>
                          </div>
                        </div>

                        {/* List of elegant emoji avatars scrollable */}
                        <div className="grid grid-cols-6 gap-2 max-h-24 overflow-y-auto p-1 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950">
                          {['🧑‍🎓', '👩‍🎓', '👨‍🎓', '🧑‍🏫', '👩‍🏫', '👮', '👤', '🦁', '🦊', '🐱', '🐶', '🐯', '🐼', '🐨', '🦋', '⚽', '🎒', '📚', '🍕', '🎨', '🚀', '🌟', '🤖', '💡'].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setEditProfileAvatar(em)}
                              className={`p-1 text-lg rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
                                editProfileAvatar === em ? 'bg-blue-600/10 border-blue-500/30 scale-110 shadow-sm border' : 'border border-transparent'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name input */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={editProfileNama}
                          onChange={(e) => setEditProfileNama(e.target.value)}
                          placeholder="Masukkan nama lengkap"
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                          }`}
                          required
                          maxLength={50}
                        />
                      </div>

                      {/* Class input — only if role is 'siswa' */}
                      {session && session.role === 'siswa' && (
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                            Kelas Siswa
                          </label>
                          <select
                            value={editProfileKelas}
                            onChange={(e) => setEditProfileKelas(e.target.value)}
                            className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-zinc-200 text-zinc-900'
                            }`}
                          >
                            {classList.map((cls) => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex space-x-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowEditProfileModal(false)}
                          className={`flex-1 py-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-zinc-700 hover:bg-slate-100'
                          }`}
                          disabled={isSavingProfile}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/15 cursor-pointer flex items-center justify-center space-x-1.5"
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? (
                            <span>Menyimpan...</span>
                          ) : (
                            <span>Simpan</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>

                </div>
              )}
            </AnimatePresence>

          </div>
        )}

      </div>

    </div>
  );
}
