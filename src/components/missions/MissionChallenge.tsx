'use client';

import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import { MisiType } from '@/types';
import { cn } from '@/lib/utils';

type MissionChallengeProps = {
  misiTipe: MisiType;
  kontenJson: MissionPlayerData['kontenJson'];
  className?: string;
};

const TYPE_LABELS: Record<MisiType, string> = {
  [MisiType.DragDrop]: 'Seret & Susun',
  [MisiType.FillBlank]: 'Isi Bagian Kosong',
  [MisiType.MultipleChoice]: 'Pilihan Ganda',
  [MisiType.CodeTyping]: 'Ketik Kode',
  [MisiType.Project]: 'Proyek',
};

export function MissionChallenge({
  misiTipe,
  kontenJson,
  className,
}: MissionChallengeProps) {
  const instruksi =
    kontenJson &&
    typeof kontenJson === 'object' &&
    !Array.isArray(kontenJson) &&
    typeof (kontenJson as Record<string, unknown>).instruksi === 'string'
      ? String((kontenJson as Record<string, unknown>).instruksi)
      : null;

  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:min-h-[360px] sm:p-6',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
        {TYPE_LABELS[misiTipe]}
      </p>
      {instruksi ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-200">
          {instruksi}
        </p>
      ) : null}
      <div className="mt-auto flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-950/40 px-4 py-10 text-center">
        <p className="text-sm font-medium text-slate-300">
          Area tantangan misi
        </p>
        <p className="mt-2 max-w-sm text-xs text-slate-500">
          Komponen interaktif untuk tipe{' '}
          <span className="text-slate-300">{misiTipe}</span> akan dimuat di
          tugas berikutnya.
        </p>
      </div>
    </div>
  );
}
