import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  Flame,
  Lock,
  Map as MapIcon,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { MisiStatus, UserRole } from '@/types';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard Agen — AIjarin',
  description: 'Peta misi belajar SIGMA untuk siswa AIjarin',
};

type ProfileRow = {
  nama_lengkap: string;
  role: string;
};

type StatsRow = {
  total_xp: number | null;
  current_streak: number | null;
};

type LevelRow = {
  id: string;
  nomor: number;
  nama: string;
  tema: string;
  deskripsi: string | null;
};

type MissionRow = {
  id: string;
  level_id: string;
  urutan: number;
};

type ProgressRow = {
  misi_id: string;
  status: string | null;
};

type LevelMapEntry = LevelRow & {
  state: 'completed' | 'current' | 'locked';
  completedMissions: number;
  totalMissions: number;
  href: string | null;
};

const NODE_POSITIONS = [
  { x: 8, y: 30 },
  { x: 22, y: 62 },
  { x: 38, y: 34 },
  { x: 52, y: 68 },
  { x: 67, y: 38 },
  { x: 81, y: 64 },
  { x: 92, y: 28 },
] as const;

const MAP_PATH =
  'M 8 30 C 13 46, 16 58, 22 62 S 32 43, 38 34 S 47 51, 52 68 S 62 50, 67 38 S 76 51, 81 64 S 88 42, 92 28';

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? 'Agen';
}

function buildLevelEntries(
  levels: LevelRow[],
  missions: MissionRow[],
  progressRows: ProgressRow[]
): LevelMapEntry[] {
  const progressByMissionId = new Map(
    progressRows.map((row) => [row.misi_id, row.status])
  );

  let previousLevelCompleted = true;

  return levels.map((level) => {
    const levelMissions = missions
      .filter((mission) => mission.level_id === level.id)
      .sort((a, b) => a.urutan - b.urutan);

    const completedMissions = levelMissions.filter(
      (mission) => progressByMissionId.get(mission.id) === MisiStatus.Completed
    ).length;
    const totalMissions = levelMissions.length;
    const isCompleted = totalMissions > 0 && completedMissions >= totalMissions;
    const hasUnlockedProgress = levelMissions.some((mission) => {
      const status = progressByMissionId.get(mission.id);
      return (
        status === MisiStatus.Available ||
        status === MisiStatus.InProgress ||
        status === MisiStatus.Completed
      );
    });
    const isUnlocked =
      level.nomor === 1 || previousLevelCompleted || hasUnlockedProgress;

    const playableMission =
      levelMissions.find((mission) => {
        const status = progressByMissionId.get(mission.id);
        return status !== MisiStatus.Completed && status !== MisiStatus.Locked;
      }) ?? levelMissions[0];

    const entry: LevelMapEntry = {
      ...level,
      state: isCompleted ? 'completed' : isUnlocked ? 'current' : 'locked',
      completedMissions,
      totalMissions,
      href:
        isUnlocked && playableMission ? `/misi/${playableMission.id}` : null,
    };

    previousLevelCompleted = isCompleted;
    return entry;
  });
}

function LevelNode({
  entry,
  className,
  style,
}: {
  entry: LevelMapEntry;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isCompleted = entry.state === 'completed';
  const isCurrent = entry.state === 'current';
  const isLocked = entry.state === 'locked';

  const content = (
    <div
      className={cn(
        'group relative flex min-h-[9rem] flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left shadow-2xl transition duration-200',
        isCompleted &&
          'border-emerald-400/50 bg-emerald-500/15 shadow-emerald-950/40 hover:border-emerald-300',
        isCurrent &&
          'border-sigma-cyan/70 bg-sigma-cyan/15 shadow-sigma-cyan/20 hover:border-sigma-cyan',
        isLocked &&
          'border-slate-700 bg-slate-900/70 grayscale hover:border-slate-600',
        entry.href && 'hover:-translate-y-1',
        className
      )}
      style={style}
    >
      {isCurrent ? (
        <span className="absolute right-4 top-4 h-3 w-3 rounded-full bg-sigma-cyan">
          <span className="absolute inset-0 animate-ping rounded-full bg-sigma-cyan opacity-75" />
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-black',
            isCompleted &&
              'border-emerald-300/60 bg-emerald-400 text-slate-950',
            isCurrent && 'border-sigma-cyan/60 bg-sigma-cyan text-sigma-navy',
            isLocked && 'border-slate-600 bg-slate-800 text-slate-400'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          ) : isLocked ? (
            <Lock className="h-5 w-5" aria-hidden />
          ) : (
            entry.nomor
          )}
        </div>

        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            isCompleted && 'bg-emerald-400/20 text-emerald-100',
            isCurrent && 'bg-sigma-cyan/20 text-sigma-cyan',
            isLocked && 'bg-slate-800 text-slate-500'
          )}
        >
          {isCompleted ? 'Selesai' : isCurrent ? 'Misi aktif' : 'Terkunci'}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Level {entry.nomor}
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">{entry.nama}</h2>
        <p className="mt-1 text-sm text-slate-400">{entry.tema}</p>
        <p className="mt-3 text-xs text-slate-500">
          {entry.completedMissions}/{entry.totalMissions || 0} misi selesai
        </p>
      </div>
    </div>
  );

  if (!entry.href) {
    return content;
  }

  return (
    <Link href={entry.href} aria-label={`Buka Level ${entry.nomor}`}>
      {content}
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  tone: 'cyan' | 'gold' | 'emerald';
}) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            tone === 'cyan' && 'bg-sigma-cyan/15 text-sigma-cyan',
            tone === 'gold' && 'bg-sigma-gold/15 text-sigma-gold',
            tone === 'emerald' && 'bg-emerald-400/15 text-emerald-300'
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nama_lengkap, role')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (profileError || !profile || profile.role !== UserRole.Siswa) {
    redirect('/login?redirect=/dashboard');
  }

  const [
    { data: stats },
    { data: levels, error: levelsError },
    { data: missions, error: missionsError },
    { data: progressRows },
  ] = await Promise.all([
    supabase
      .from('siswa_stats')
      .select('total_xp, current_streak')
      .eq('siswa_id', user.id)
      .maybeSingle<StatsRow>(),
    supabase
      .from('levels')
      .select('id, nomor, nama, tema, deskripsi')
      .eq('is_active', true)
      .order('nomor', { ascending: true })
      .limit(7)
      .returns<LevelRow[]>(),
    supabase
      .from('misi')
      .select('id, level_id, urutan')
      .order('urutan', { ascending: true })
      .returns<MissionRow[]>(),
    supabase
      .from('siswa_progress')
      .select('misi_id, status')
      .eq('siswa_id', user.id)
      .returns<ProgressRow[]>(),
  ]);

  if (levelsError || missionsError || !levels || !missions) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-8 text-center text-sm text-amber-100">
        Peta misi belum bisa dimuat. Coba refresh halaman ya, Agen.
      </div>
    );
  }

  const entries = buildLevelEntries(levels, missions, progressRows ?? []);
  const currentEntry =
    entries.find((entry) => entry.state === 'current') ??
    entries.find((entry) => entry.state !== 'locked');
  const firstName = getFirstName(profile.nama_lengkap);
  const totalXp = stats?.total_xp ?? 0;
  const currentStreak = stats?.current_streak ?? 0;

  return (
    <div className="space-y-8 pb-10">
      <section className="overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sigma-cyan/30 bg-sigma-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
              <MapIcon className="h-4 w-4" aria-hidden />
              World Map SIGMA
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Agen {firstName}, misi menantimu!
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Ikuti jalur level dari Rekrut SIGMA sampai Direktur SIGMA. Level
              yang terbuka bisa kamu klik untuk lanjut menjalankan misi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
            <StatCard
              icon={Trophy}
              label="Total XP"
              value={totalXp.toLocaleString('id-ID')}
              tone="gold"
            />
            <StatCard
              icon={Flame}
              label="Streak"
              value={`${currentStreak} hari`}
              tone="emerald"
            />
            <StatCard
              icon={Zap}
              label="Level Aktif"
              value={currentEntry ? `${currentEntry.nomor}` : '-'}
              tone="cyan"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700/70 bg-slate-950/60 p-4 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sigma-gold">
              Jalur Misi
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              7 Level Pembelajaran
            </h2>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Sparkles className="h-4 w-4 text-sigma-cyan" aria-hidden />
            Klik node yang sudah terbuka
          </div>
        </div>

        <div className="relative hidden min-h-[34rem] overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-6 md:block">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:42px_42px]" />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={MAP_PATH}
              fill="none"
              stroke="rgba(148, 163, 184, 0.24)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="1 2"
            />
            <path
              d={MAP_PATH}
              fill="none"
              stroke="url(#mapGlow)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="mapGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#facc15" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.45" />
              </linearGradient>
            </defs>
          </svg>

          {entries.map((entry, index) => {
            const position = NODE_POSITIONS[index] ?? NODE_POSITIONS[0];

            return (
              <LevelNode
                key={entry.id}
                entry={entry}
                className="absolute w-56 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              />
            );
          })}
        </div>

        <div className="relative space-y-4 md:hidden">
          <div className="absolute bottom-12 left-6 top-12 w-px bg-slate-700" />
          {entries.map((entry) => (
            <div key={entry.id} className="relative pl-12">
              <span
                className={cn(
                  'absolute left-[1.05rem] top-8 z-10 flex h-4 w-4 items-center justify-center rounded-full border',
                  entry.state === 'completed' &&
                    'border-emerald-300 bg-emerald-400',
                  entry.state === 'current' &&
                    'border-sigma-cyan bg-sigma-cyan shadow-[0_0_18px_rgba(34,211,238,0.8)]',
                  entry.state === 'locked' && 'border-slate-600 bg-slate-800'
                )}
              />
              <LevelNode entry={entry} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden />
          <p className="mt-3 font-semibold text-white">Completed</p>
          <p className="mt-1 text-sm text-slate-400">
            Level berwarna hijau sudah kamu tuntaskan.
          </p>
        </div>
        <div className="rounded-2xl border border-sigma-cyan/30 bg-sigma-cyan/10 p-4">
          <Star className="h-5 w-5 text-sigma-cyan" aria-hidden />
          <p className="mt-3 font-semibold text-white">Current</p>
          <p className="mt-1 text-sm text-slate-400">
            Level bercahaya adalah misi aktifmu sekarang.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <Lock className="h-5 w-5 text-slate-400" aria-hidden />
          <p className="mt-3 font-semibold text-white">Locked</p>
          <p className="mt-1 text-sm text-slate-400">
            Selesaikan level sebelumnya untuk membuka jalur berikutnya.
          </p>
        </div>
      </section>
    </div>
  );
}
