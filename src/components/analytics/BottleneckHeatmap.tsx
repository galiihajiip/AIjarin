'use client';

import { AlertTriangle, Flame, Info, Timer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MisiStatus } from '@/types';
import { cn } from '@/lib/utils';

export type BottleneckStudent = {
  id: string;
  name: string;
};

export type BottleneckMission = {
  id: string;
  name: string;
  levelLabel?: string;
};

export type BottleneckProgress = {
  siswaId: string;
  misiId: string;
  status: MisiStatus | string | null;
  attempts: number | null;
  timeSpentSeconds: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

type BottleneckHeatmapProps = {
  students: BottleneckStudent[];
  missions: BottleneckMission[];
  progress: BottleneckProgress[];
  fastThresholdSeconds?: number;
  abandonedAfterDays?: number;
  className?: string;
};

type CellState = 'completed_fast' | 'multiple_attempts' | 'stuck' | 'abandoned';

type CellMeta = {
  state: CellState;
  label: string;
  className: string;
  failureWeight: number;
};

const CELL_META: Record<CellState, CellMeta> = {
  completed_fast: {
    state: 'completed_fast',
    label: 'Selesai cepat',
    className:
      'border-emerald-400/40 bg-emerald-400/80 text-emerald-950 shadow-emerald-950/30',
    failureWeight: 0,
  },
  multiple_attempts: {
    state: 'multiple_attempts',
    label: 'Banyak percobaan',
    className:
      'border-yellow-300/50 bg-yellow-300/85 text-yellow-950 shadow-yellow-950/30',
    failureWeight: 0.35,
  },
  stuck: {
    state: 'stuck',
    label: 'Tertahan',
    className:
      'border-orange-400/50 bg-orange-400/90 text-orange-950 shadow-orange-950/30',
    failureWeight: 0.7,
  },
  abandoned: {
    state: 'abandoned',
    label: 'Ditinggalkan',
    className: 'border-red-500/50 bg-red-500/90 text-red-950 shadow-red-950/30',
    failureWeight: 1,
  },
};

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '-';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}j ${minutes % 60}m`;
}

function isOlderThan(dateString: string | null | undefined, days: number) {
  if (!dateString) return false;
  const startedAt = new Date(dateString).getTime();
  if (Number.isNaN(startedAt)) return false;

  return Date.now() - startedAt > days * 24 * 60 * 60 * 1000;
}

function getProgressKey(siswaId: string, misiId: string): string {
  return `${siswaId}:${misiId}`;
}

function classifyCell(
  row: BottleneckProgress | undefined,
  fastThresholdSeconds: number,
  abandonedAfterDays: number
): CellMeta {
  if (!row) {
    return CELL_META.abandoned;
  }

  const attempts = row.attempts ?? 0;
  const timeSpentSeconds = row.timeSpentSeconds ?? 0;
  const completed = row.status === MisiStatus.Completed;

  if (completed) {
    if (attempts <= 1 && timeSpentSeconds <= fastThresholdSeconds) {
      return CELL_META.completed_fast;
    }

    return CELL_META.multiple_attempts;
  }

  if (isOlderThan(row.startedAt, abandonedAfterDays)) {
    return CELL_META.abandoned;
  }

  if (attempts >= 3 || row.status === MisiStatus.InProgress) {
    return CELL_META.stuck;
  }

  return CELL_META.abandoned;
}

function getHardestMissions(
  missions: BottleneckMission[],
  students: BottleneckStudent[],
  progressMap: Map<string, BottleneckProgress>,
  fastThresholdSeconds: number,
  abandonedAfterDays: number
) {
  return missions
    .map((mission) => {
      const totalWeight = students.reduce((sum, student) => {
        const cell = classifyCell(
          progressMap.get(getProgressKey(student.id, mission.id)),
          fastThresholdSeconds,
          abandonedAfterDays
        );
        return sum + cell.failureWeight;
      }, 0);

      return {
        mission,
        failureRate:
          students.length > 0
            ? Math.round((totalWeight / students.length) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.failureRate - a.failureRate)
    .slice(0, 3);
}

export function BottleneckHeatmap({
  students,
  missions,
  progress,
  fastThresholdSeconds = 600,
  abandonedAfterDays = 7,
  className,
}: BottleneckHeatmapProps) {
  if (students.length === 0 || missions.length === 0) {
    return null;
  }

  const progressMap = new Map(
    progress.map((row) => [getProgressKey(row.siswaId, row.misiId), row])
  );
  const hardestMissions = getHardestMissions(
    missions,
    students,
    progressMap,
    fastThresholdSeconds,
    abandonedAfterDays
  );
  const topMissionIds = new Set(hardestMissions.map((item) => item.mission.id));

  return (
    <section className={cn('space-y-4', className)}>
      <div className="rounded-3xl border border-orange-400/30 bg-orange-400/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-orange-400/15 p-2 text-orange-300">
              <Flame className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Misi ini paling sulit untuk kelas kamu!
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Diurutkan berdasarkan rata-rata failure rate dari percobaan,
                status tertahan, dan misi yang ditinggalkan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hardestMissions.map((item) => (
              <Badge
                key={item.mission.id}
                variant="outline"
                className="border-orange-300/40 bg-orange-300/10 text-orange-100"
              >
                {item.mission.name} · {item.failureRate}%
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-slate-700 bg-slate-900/70 text-white">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">
                Cognitive Bottleneck Heatmap
              </CardTitle>
              <p className="mt-2 text-sm text-slate-400">
                Baris adalah siswa, kolom adalah misi. Arahkan kursor ke sel
                untuk melihat detail percobaan dan waktu pengerjaan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.values(CELL_META).map((meta) => (
                <span
                  key={meta.state}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-slate-300"
                >
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full border',
                      meta.className
                    )}
                  />
                  {meta.label}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <div
              className="grid min-w-max"
              style={{
                gridTemplateColumns: `minmax(180px, 220px) repeat(${missions.length}, minmax(5rem, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-20 border-b border-r border-slate-800 bg-slate-950 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Siswa / Misi
              </div>
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className={cn(
                    'border-b border-r border-slate-800 bg-slate-950 px-2 py-3 text-center text-xs font-semibold text-slate-300',
                    topMissionIds.has(mission.id) &&
                      'bg-orange-400/10 text-orange-100 ring-1 ring-inset ring-orange-400/30'
                  )}
                >
                  <p className="line-clamp-2">{mission.name}</p>
                  {mission.levelLabel ? (
                    <p className="mt-1 text-[10px] font-normal text-slate-500">
                      {mission.levelLabel}
                    </p>
                  ) : null}
                </div>
              ))}

              {students.map((student) => (
                <div key={student.id} className="contents">
                  <div className="sticky left-0 z-10 border-r border-t border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200">
                    {student.name}
                  </div>
                  {missions.map((mission) => {
                    const row = progressMap.get(
                      getProgressKey(student.id, mission.id)
                    );
                    const cell = classifyCell(
                      row,
                      fastThresholdSeconds,
                      abandonedAfterDays
                    );

                    return (
                      <div
                        key={`${student.id}-${mission.id}`}
                        className="group relative border-r border-t border-slate-800 bg-slate-950 p-2"
                      >
                        <div
                          className={cn(
                            'mx-auto flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-bold shadow-lg transition group-hover:scale-110',
                            cell.className
                          )}
                          aria-label={`${student.name}, ${mission.name}: ${cell.label}`}
                        >
                          {row?.attempts ?? 0}
                        </div>

                        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-950 p-3 text-left text-xs shadow-2xl group-hover:block">
                          <div className="mb-2 flex items-center gap-2 text-sigma-cyan">
                            <Info className="h-3.5 w-3.5" aria-hidden />
                            <span className="font-semibold">{cell.label}</span>
                          </div>
                          <p className="font-semibold text-white">
                            {student.name}
                          </p>
                          <p className="mt-1 text-slate-300">{mission.name}</p>
                          <div className="mt-3 grid gap-1 text-slate-400">
                            <span>Attempts: {row?.attempts ?? 0}</span>
                            <span className="inline-flex items-center gap-1">
                              <Timer className="h-3.5 w-3.5" aria-hidden />
                              Time spent:{' '}
                              {formatDuration(row?.timeSpentSeconds)}
                            </span>
                            <span>Status: {row?.status ?? 'belum mulai'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle
              className="h-3.5 w-3.5 text-orange-300"
              aria-hidden
            />
            Angka di dalam sel menunjukkan jumlah percobaan siswa pada misi
            tersebut.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
