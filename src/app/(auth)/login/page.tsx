import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <h1 className="text-2xl font-bold">Masuk ke Markas SIGMA</h1>
      <p className="text-sm text-slate-400">
        Halaman login akan terhubung ke Supabase Auth pada fase berikutnya.
      </p>
      <Link
        href="/"
        className="inline-block text-sigma-cyan hover:underline"
      >
        ← Kembali
      </Link>
    </div>
  );
}
