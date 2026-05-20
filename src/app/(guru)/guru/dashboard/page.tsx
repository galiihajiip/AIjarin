import { redirect } from 'next/navigation';

import {
  ClassSummaryCards,
  type ClassSummaryMetric,
} from '@/components/analytics/ClassSummaryCards';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export const metadata = {
  title: 'Dashboard Guru — AIjarin',
  description: 'Ringkasan analitik kelas untuk guru AIjarin',
};

type ProfileRow = {
  role: string;
  sekolah_id: string | null;
};

type StudentRow = {
  id: string;
};

type StatsRow = {
  total_xp: number | null;
  current_streak: number | null;
  last_active_date: string | null;
};

type NGainRow = {
  ngain: number | null;
  kategori: string | null;
  calculated_at: string | null;
};

type ProgressTrendRow = {
  siswa_id: string;
  xp_earned: number | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countByDateRange(rows: StatsRow[], start: Date, end: Date): number {
  const startDate = toDateOnly(start);
  const endDate = toDateOnly(end);

  return rows.filter((row) => {
    if (!row.last_active_date) return false;
    return row.last_active_date >= startDate && row.last_active_date < endDate;
  }).length;
}

function sumXpInRange(
  rows: ProgressTrendRow[],
  start: Date,
  end: Date
): number {
  const startMs = start.getTime();
  const endMs = end.getTime();

  return rows.reduce((sum, row) => {
    if (!row.completed_at) return sum;
    const completedAt = new Date(row.completed_at).getTime();
    if (completedAt < startMs || completedAt >= endMs) return sum;
    return sum + (row.xp_earned ?? 0);
  }, 0);
}

function averageNgainInRange(rows: NGainRow[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();

  return average(
    rows
      .filter((row) => {
        if (!row.calculated_at || typeof row.ngain !== 'number') return false;
        const calculatedAt = new Date(row.calculated_at).getTime();
        return calculatedAt >= startMs && calculatedAt < endMs;
      })
      .map((row) => row.ngain as number)
  );
}

function countStuckRows(rows: ProgressTrendRow[], cutoff: Date): number {
  const cutoffMs = cutoff.getTime();
  const stuckStudentIds = new Set<string>();

  rows.forEach((row) => {
    if (row.status === 'completed' || !row.started_at) return false;
    if (new Date(row.started_at).getTime() <= cutoffMs) {
      stuckStudentIds.add(row.siswa_id);
    }
    return false;
  });

  return stuckStudentIds.size;
}

export default async function GuruDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/guru/dashboard');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, sekolah_id')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (
    profileError ||
    !profile ||
    (profile.role !== UserRole.Guru && profile.role !== UserRole.TutorSebaya)
  ) {
    redirect('/login?redirect=/guru/dashboard');
  }

  if (!profile.sekolah_id) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-10 text-center text-sm text-amber-100">
        Akun guru ini belum terhubung ke sekolah. Hubungi admin untuk
        mengaktifkan dashboard analitik.
      </div>
    );
  }

  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('sekolah_id', profile.sekolah_id)
    .eq('role', UserRole.Siswa)
    .returns<StudentRow[]>();

  const studentIds = (students ?? []).map((student) => student.id);
  const studentCount = studentIds.length;

  const [{ data: studentStats }, { data: ngainRows }, { data: progressRows }] =
    studentIds.length > 0
      ? await Promise.all([
          supabase
            .from('siswa_stats')
            .select('total_xp, current_streak, last_active_date')
            .in('siswa_id', studentIds)
            .returns<StatsRow[]>(),
          supabase
            .from('ngain_scores')
            .select('ngain, kategori, calculated_at')
            .in('siswa_id', studentIds)
            .returns<NGainRow[]>(),
          supabase
            .from('siswa_progress')
            .select('siswa_id, xp_earned, status, started_at, completed_at')
            .in('siswa_id', studentIds)
            .returns<ProgressTrendRow[]>(),
        ])
      : [
          { data: [] as StatsRow[] },
          { data: [] as NGainRow[] },
          { data: [] as ProgressTrendRow[] },
        ];

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(now.getDate() - 10);

  const statsRows = studentStats ?? [];
  const ngainData = ngainRows ?? [];
  const progressData = progressRows ?? [];
  const totalXp = (studentStats ?? []).reduce(
    (sum, row) => sum + (row.total_xp ?? 0),
    0
  );
  const activeStudents = countByDateRange(statsRows, sevenDaysAgo, now);
  const previousActiveStudents = countByDateRange(
    statsRows,
    fourteenDaysAgo,
    sevenDaysAgo
  );
  const averageXp = studentCount > 0 ? totalXp / studentCount : 0;
  const xpLastWeek = sumXpInRange(progressData, sevenDaysAgo, now);
  const xpPreviousWeek = sumXpInRange(
    progressData,
    fourteenDaysAgo,
    sevenDaysAgo
  );
  const avgNgain = average(
    ngainData
      .map((row) => row.ngain)
      .filter((value): value is number => typeof value === 'number')
  );
  const previousAvgNgain =
    averageNgainInRange(ngainData, fourteenDaysAgo, sevenDaysAgo) || avgNgain;
  const stuckMissions = countStuckRows(progressData, threeDaysAgo);
  const previousStuckMissions = countStuckRows(progressData, tenDaysAgo);
  const summaryMetrics: ClassSummaryMetric[] = [
    {
      id: 'active_students',
      title: 'Total Siswa Aktif',
      value: activeStudents,
      previousValue: previousActiveStudents,
      description: 'Siswa dengan aktivitas dalam 7 hari terakhir.',
    },
    {
      id: 'average_xp',
      title: 'Rata-rata XP Kelas',
      value: averageXp,
      previousValue:
        studentCount > 0
          ? (totalXp - xpLastWeek + xpPreviousWeek) / studentCount
          : 0,
      description: 'Rata-rata total XP seluruh siswa di kelas.',
    },
    {
      id: 'average_ngain',
      title: 'Rata-rata N-Gain',
      value: avgNgain,
      previousValue: previousAvgNgain,
      description: 'Rata-rata peningkatan belajar dari hasil N-Gain.',
      format: 'decimal',
    },
    {
      id: 'unfinished_missions',
      title: 'Misi Belum Diselesaikan',
      value: stuckMissions,
      previousValue: previousStuckMissions,
      description: 'Siswa yang tertahan di misi yang sama lebih dari 3 hari.',
      trendDirection: 'lower-is-better',
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
          Ringkasan Kelas
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Analytics Dashboard Guru
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Pantau perkembangan siswa, sinyal bottleneck kognitif, aktivitas
          chatbot, dan kebutuhan intervensi dari satu tempat.
        </p>
      </section>

      <ClassSummaryCards metrics={summaryMetrics} />

      <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">Langkah Berikutnya</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            'Buka Laporan N-Gain untuk melihat level dengan peningkatan rendah.',
            'Cek Bottleneck Kognitif untuk menemukan konsep yang sering gagal.',
            'Gunakan Intervensi AI untuk menyiapkan rekomendasi bantuan siswa.',
          ].map((item) => (
            <p
              key={item}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm leading-relaxed text-slate-400"
            >
              {item}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
