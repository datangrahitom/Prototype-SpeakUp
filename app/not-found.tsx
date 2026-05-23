export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-zinc-900 text-white">
      <h1 className="text-2xl font-bold font-sans tracking-tight">Halaman Tidak Ditemukan</h1>
      <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
        Halaman yang Anda tuju tidak tersedia atau dipindahkan. Silakan kembali ke dasbor utama.
      </p>
    </div>
  );
}
