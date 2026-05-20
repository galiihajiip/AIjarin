import Link from 'next/link';
import { ArrowRight, Bot, Trophy, Zap } from 'lucide-react';

import { SigmaLogo } from '@/components/auth/SigmaLogo';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sigma-navy text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-sigma-cyan/30 bg-sigma-cyan/10 px-4 py-2 text-sm text-sigma-cyan">
              <SigmaLogo size={28} />
              Preview Frontend AIjarin
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Belajar coding sebagai{' '}
              <span className="text-sigma-cyan">Agen SIGMA</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              AIjarin adalah LMS gamified untuk siswa jalur afirmasi. Kamu
              menyelesaikan misi, mengumpulkan XP, dan mengalahkan ERROR-X
              sambil belajar logika komputasi.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90"
              >
                <Link href="/login">
                  Lihat Login
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-600 bg-slate-900/60 text-white hover:bg-slate-800"
              >
                <Link href="/register">Lihat Register</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Mode preview memakai env placeholder. Fitur login, dashboard, dan
              misi penuh tetap butuh Supabase lokal/cloud.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-2xl">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sigma-gold">
                Mission Interface
              </p>
              <h2 className="mt-2 text-2xl font-bold">Rekrut SIGMA</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Komponen misi sudah disiapkan untuk drag-drop, fill-blank,
                pilihan ganda, dan code typing.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  {
                    icon: Zap,
                    title: 'Misi Interaktif',
                    text: 'Drag & drop, input dinamis, dan editor kode.',
                  },
                  {
                    icon: Bot,
                    title: 'Tutor AI',
                    text: 'Slot chatbot tutor tersedia di mission player.',
                  },
                  {
                    icon: Trophy,
                    title: 'Gamifikasi',
                    text: 'XP, badge, streak, dan leaderboard.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                  >
                    <item.icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-sigma-cyan"
                      aria-hidden
                    />
                    <div>
                      <p className="font-semibold text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
