'use client';

import Link from 'next/link';

import { SigmaLogo } from '@/components/auth/SigmaLogo';
import { LogoutButton } from '@/components/shared/LogoutButton';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { profile, isLoading } = useAuth();

  return (
    <header className="border-b border-slate-700/60 bg-sigma-navy/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white transition-opacity hover:opacity-90"
        >
          <SigmaLogo size={32} />
          <span className="font-semibold tracking-tight">AIjarin</span>
        </Link>

        <div className="flex items-center gap-3">
          {!isLoading && profile ? (
            <span className="hidden max-w-[12rem] truncate text-sm text-slate-300 sm:inline">
              {profile.nama_lengkap}
            </span>
          ) : null}
          <LogoutButton
            variant="ghost"
            size="sm"
            className="text-slate-200 hover:bg-slate-800 hover:text-white"
          />
        </div>
      </div>
    </header>
  );
}
