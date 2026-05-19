import Link from 'next/link';

import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold text-white">
          Daftar sebagai Agen SIGMA
        </h2>
        <p className="text-sm text-slate-400">
          Bergabung dengan Satuan Intelijen Generasi Muda Algoritma.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-slate-400">
        Sudah punya akun?{' '}
        <Link
          href="/login"
          className="font-medium text-sigma-cyan hover:underline"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
