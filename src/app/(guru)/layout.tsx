import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  Brain,
  ClipboardList,
  Home,
  Menu,
  MessageSquareHeart,
  Sparkles,
  Users,
} from 'lucide-react';

import { SigmaLogo } from '@/components/auth/SigmaLogo';
import { LogoutButton } from '@/components/shared/LogoutButton';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

type GuruLayoutProps = {
  children: React.ReactNode;
};

type GuruProfileRow = {
  nama_lengkap: string;
  role: string;
  sekolah_id: string | null;
  sekolah: { nama: string } | { nama: string }[] | null;
};

const NAV_ITEMS = [
  {
    label: 'Ringkasan Kelas',
    href: '/guru/dashboard',
    icon: Home,
  },
  {
    label: 'Daftar Siswa',
    href: '/guru/dashboard/siswa',
    icon: Users,
  },
  {
    label: 'Laporan N-Gain',
    href: '/guru/dashboard/ngain',
    icon: BarChart3,
  },
  {
    label: 'Bottleneck Kognitif',
    href: '/guru/dashboard/bottleneck',
    icon: Brain,
  },
  {
    label: 'Intervensi AI',
    href: '/guru/dashboard/intervensi',
    icon: Sparkles,
  },
  {
    label: 'Survei Kecemasan',
    href: '/guru/dashboard/survei',
    icon: MessageSquareHeart,
  },
] as const;

function getSchoolName(sekolah: GuruProfileRow['sekolah']): string {
  const row = Array.isArray(sekolah) ? sekolah[0] : sekolah;
  return row?.nama ?? 'Sekolah belum terhubung';
}

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      className={cn(
        compact ? 'grid grid-cols-3 gap-1' : 'space-y-1',
        'text-sm'
      )}
      aria-label="Navigasi dashboard guru"
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 font-medium text-slate-300 transition hover:border-sigma-cyan/30 hover:bg-sigma-cyan/10 hover:text-white',
            compact &&
              'flex-col justify-center gap-1 px-2 py-2 text-center text-[11px]'
          )}
        >
          <item.icon
            className={cn('h-4 w-4 text-sigma-cyan', compact && 'h-5 w-5')}
            aria-hidden
          />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default async function GuruLayout({ children }: GuruLayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/guru/dashboard');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nama_lengkap, role, sekolah_id, sekolah(nama)')
    .eq('id', user.id)
    .single<GuruProfileRow>();

  if (
    profileError ||
    !profile ||
    (profile.role !== UserRole.Guru && profile.role !== UserRole.TutorSebaya)
  ) {
    redirect('/login?redirect=/guru/dashboard');
  }

  const schoolName = getSchoolName(profile.sekolah);

  return (
    <div className="min-h-screen bg-sigma-navy text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800 bg-slate-950/80 px-4 py-5 lg:block">
        <Link href="/guru/dashboard" className="flex items-center gap-3 px-2">
          <SigmaLogo size={36} />
          <div>
            <p className="font-semibold tracking-tight">AIjarin Guru</p>
            <p className="text-xs text-slate-500">Analytics Command Center</p>
          </div>
        </Link>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Navigasi
          </p>
          <div className="mt-3">
            <NavigationLinks />
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-sigma-navy/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {schoolName}
              </p>
              <p className="truncate text-xs text-slate-400">
                Guru: {profile.nama_lengkap}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200">
                  <Menu className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Buka navigasi guru</span>
                </summary>
                <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
                  <NavigationLinks />
                </div>
              </details>

              <LogoutButton
                variant="ghost"
                size="sm"
                className="text-slate-200 hover:bg-slate-800 hover:text-white"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-8">
          {children}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur lg:hidden">
        <NavigationLinks compact />
      </div>
    </div>
  );
}
