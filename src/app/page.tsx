import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-sigma-cyan">
        Badan Siber Nasional
      </p>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        Selamat datang, calon Agen SIGMA
      </h1>
      <p className="text-slate-300 leading-relaxed">
        Virus ERROR-X mengancam kota. Kamu direkrut untuk mempelajari logika
        komputasi, menyelesaikan misi, dan melindungi dunia digital — dimulai
        dari SMA Negeri 20 Surabaya.
      </p>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/login"
          className="rounded-lg bg-sigma-cyan px-6 py-3 font-semibold text-sigma-navy transition hover:brightness-110"
        >
          Mulai misi
        </Link>
        <span className="rounded-lg border border-slate-600 px-6 py-3 text-slate-400">
          Guru & Admin — segera hadir
        </span>
      </div>
      <p className="text-xs text-slate-500">AIjarin v1.0.0 · Jalur Afirmasi</p>
    </main>
  );
}
