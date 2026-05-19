import Link from 'next/link';

import { SigmaLogo } from '@/components/auth/SigmaLogo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sigma-navy px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="group flex flex-col items-center gap-3">
          <SigmaLogo
            size={56}
            className="drop-shadow-[0_0_12px_rgba(6,182,212,0.45)] transition-transform group-hover:scale-105"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sigma-cyan">
              AIjarin
            </p>
            <h1 className="text-2xl font-bold text-white">Agen SIGMA</h1>
            <p className="mt-1 text-sm text-slate-400">
              Belajar Sambil Bertualang
            </p>
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-md border-slate-700/60 bg-slate-900/80 text-slate-100 shadow-glow backdrop-blur-sm">
        <CardHeader className="sr-only">
          <CardTitle>Autentikasi AIjarin</CardTitle>
          <CardDescription>
            Masuk atau daftar sebagai Agen SIGMA
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
