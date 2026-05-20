import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  MessageCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
};

type NGainRow = {
  ngain: number | null;
  kategori: string | null;
};

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  tone: 'cyan' | 'gold' | 'emerald' | 'rose' | 'violet' | 'amber';
};

function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: SummaryCardProps) {
  const toneClass = {
    cyan: 'bg-sigma-cyan/15 text-sigma-cyan',
    gold: 'bg-sigma-gold/15 text-sigma-gold',
    emerald: 'bg-emerald-400/15 text-emerald-300',
    rose: 'bg-rose-400/15 text-rose-300',
    violet: 'bg-violet-400/15 text-violet-300',
    amber: 'bg-amber-400/15 text-amber-300',
  }[tone];

  return (
    <Card className="border-slate-700 bg-slate-900/70 text-white">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-sm font-medium text-slate-300">
          {title}
        </CardTitle>
        <div className={`rounded-xl p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
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

  const [
    { data: studentStats },
    { data: ngainRows },
    { count: chatbotCount },
    { count: recommendationCount },
    { count: anxietySurveyCount },
  ] =
    studentIds.length > 0
      ? await Promise.all([
          supabase
            .from('siswa_stats')
            .select('total_xp, current_streak')
            .in('siswa_id', studentIds)
            .returns<StatsRow[]>(),
          supabase
            .from('ngain_scores')
            .select('ngain, kategori')
            .in('siswa_id', studentIds)
            .returns<NGainRow[]>(),
          supabase
            .from('chatbot_logs')
            .select('id', { count: 'exact', head: true })
            .in('siswa_id', studentIds),
          supabase
            .from('adaptive_recommendations')
            .select('id', { count: 'exact', head: true })
            .in('siswa_id', studentIds)
            .eq('is_completed', false),
          supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
            .in('siswa_id', studentIds)
            .eq('survey_type', 'anxiety'),
        ])
      : [
          { data: [] as StatsRow[] },
          { data: [] as NGainRow[] },
          { count: 0 },
          { count: 0 },
          { count: 0 },
        ];

  const totalXp = (studentStats ?? []).reduce(
    (sum, row) => sum + (row.total_xp ?? 0),
    0
  );
  const activeStreaks = (studentStats ?? []).filter(
    (row) => (row.current_streak ?? 0) > 0
  ).length;
  const avgNgain = average(
    (ngainRows ?? [])
      .map((row) => row.ngain)
      .filter((value): value is number => typeof value === 'number')
  );
  const lowNgainCount = (ngainRows ?? []).filter(
    (row) => row.kategori === 'rendah'
  ).length;

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Siswa"
          value={formatNumber(studentCount ?? 0)}
          description="Siswa aktif yang terhubung dengan sekolahmu."
          icon={Users}
          tone="cyan"
        />
        <SummaryCard
          title="Total XP Kelas"
          value={formatNumber(totalXp)}
          description="Akumulasi XP dari seluruh siswa di kelas/sekolah."
          icon={TrendingUp}
          tone="gold"
        />
        <SummaryCard
          title="Streak Aktif"
          value={formatNumber(activeStreaks)}
          description="Jumlah siswa yang masih menjaga streak belajar."
          icon={BarChart3}
          tone="emerald"
        />
        <SummaryCard
          title="Rata-rata N-Gain"
          value={avgNgain ? avgNgain.toFixed(2) : '-'}
          description="Gambaran peningkatan belajar setelah post-test."
          icon={Brain}
          tone="violet"
        />
        <SummaryCard
          title="Butuh Intervensi"
          value={formatNumber((recommendationCount ?? 0) + lowNgainCount)}
          description="Rekomendasi aktif dan siswa dengan N-Gain rendah."
          icon={AlertTriangle}
          tone="rose"
        />
        <SummaryCard
          title="Chatbot & Survei"
          value={`${formatNumber(chatbotCount ?? 0)} / ${formatNumber(
            anxietySurveyCount ?? 0
          )}`}
          description="Jumlah log chatbot dan survei kecemasan yang masuk."
          icon={MessageCircle}
          tone="amber"
        />
      </section>

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
