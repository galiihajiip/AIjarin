import { notFound, redirect } from 'next/navigation';
import {
  Award,
  Bot,
  Send,
  Sparkles,
  Timer,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/server';
import { MisiStatus, UserRole } from '@/types';
import { cn } from '@/lib/utils';

type PageProps = {
  params: Promise<{ siswaId: string }>;
};

type GuruProfileRow = {
  role: string;
  sekolah_id: string | null;
};

type StudentProfileRow = {
  id: string;
  nama_lengkap: string;
  kelas: string | null;
  sekolah_id: string | null;
  avatar_url: string | null;
};

type StatsRow = {
  total_xp: number | null;
  current_level: number | null;
  current_streak: number | null;
  total_misi_completed: number | null;
};

type ProgressRow = {
  status: string | null;
  attempts: number | null;
  best_score: number | null;
  time_spent_seconds: number | null;
  completed_at: string | null;
  misi:
    | {
        id: string;
        nama: string;
        urutan: number;
        levels:
          | { nomor: number; nama: string }
          | { nomor: number; nama: string }[]
          | null;
      }
    | {
        id: string;
        nama: string;
        urutan: number;
        levels:
          | { nomor: number; nama: string }
          | { nomor: number; nama: string }[]
          | null;
      }[]
    | null;
};

type NGainRow = {
  skor_pretest: number | null;
  skor_posttest: number | null;
  ngain: number | null;
  kategori: string | null;
  calculated_at: string | null;
  levels:
    | { nomor: number; nama: string }
    | { nomor: number; nama: string }[]
    | null;
};

type ChatbotLogRow = {
  pesan_siswa: string;
  respons_ai: string;
  tokens_used: number | null;
  created_at: string | null;
  misi: { nama: string } | { nama: string }[] | null;
};

type RecommendationRow = {
  weak_concept: string;
  reason: string | null;
  is_completed: boolean | null;
  created_at: string | null;
  misi: { nama: string } | { nama: string }[] | null;
};

type SurveyRow = {
  survey_type: string;
  anxiety_index: number | null;
  submitted_at: string | null;
  responses_json: unknown;
};

function getOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
}

function getLevelName(
  levels:
    | { nomor: number; nama: string }
    | { nomor: number; nama: string }[]
    | null
): string {
  const level = getOne(levels);
  return level ? `Level ${level.nomor} · ${level.nama}` : 'Level SIGMA';
}

function getMission(row: ProgressRow) {
  return getOne(row.misi);
}

function getMissionName(
  value: { nama: string } | { nama: string }[] | null
): string {
  return getOne(value)?.nama ?? 'Misi AIjarin';
}

function scoreTone(score: number | null): string {
  if (score == null) return 'text-slate-500';
  if (score >= 80) return 'text-emerald-300';
  if (score >= 70) return 'text-sigma-gold';
  return 'text-rose-300';
}

function categoryTone(category: string | null): string {
  if (category === 'tinggi') return 'border-emerald-400/40 text-emerald-300';
  if (category === 'sedang') return 'border-sigma-gold/40 text-sigma-gold';
  return 'border-rose-400/40 text-rose-300';
}

export default async function GuruStudentDetailPage({ params }: PageProps) {
  const { siswaId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/guru/siswa/${siswaId}`);
  }

  const { data: guru } = await supabase
    .from('profiles')
    .select('role, sekolah_id')
    .eq('id', user.id)
    .single<GuruProfileRow>();

  if (
    !guru ||
    (guru.role !== UserRole.Guru && guru.role !== UserRole.TutorSebaya)
  ) {
    redirect(`/login?redirect=/guru/siswa/${siswaId}`);
  }

  const { data: student } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, kelas, sekolah_id, avatar_url')
    .eq('id', siswaId)
    .single<StudentProfileRow>();

  if (!student || !guru.sekolah_id || student.sekolah_id !== guru.sekolah_id) {
    notFound();
  }

  const [
    { data: stats },
    { data: progressRows },
    { data: ngainRows },
    { data: chatbotRows },
    { data: recommendations },
    { data: surveys },
    { count: missionCount },
  ] = await Promise.all([
    supabase
      .from('siswa_stats')
      .select('total_xp, current_level, current_streak, total_misi_completed')
      .eq('siswa_id', siswaId)
      .maybeSingle<StatsRow>(),
    supabase
      .from('siswa_progress')
      .select(
        'status, attempts, best_score, time_spent_seconds, completed_at, misi(id, nama, urutan, levels(nomor, nama))'
      )
      .eq('siswa_id', siswaId)
      .order('completed_at', { ascending: true, nullsFirst: false })
      .returns<ProgressRow[]>(),
    supabase
      .from('ngain_scores')
      .select(
        'skor_pretest, skor_posttest, ngain, kategori, calculated_at, levels(nomor, nama)'
      )
      .eq('siswa_id', siswaId)
      .order('calculated_at', { ascending: true })
      .returns<NGainRow[]>(),
    supabase
      .from('chatbot_logs')
      .select('pesan_siswa, respons_ai, tokens_used, created_at, misi(nama)')
      .eq('siswa_id', siswaId)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<ChatbotLogRow[]>(),
    supabase
      .from('adaptive_recommendations')
      .select(
        'weak_concept, reason, is_completed, created_at, misi:recommended_misi_id(nama)'
      )
      .eq('siswa_id', siswaId)
      .order('created_at', { ascending: false })
      .returns<RecommendationRow[]>(),
    supabase
      .from('survey_responses')
      .select('survey_type, anxiety_index, submitted_at, responses_json')
      .eq('siswa_id', siswaId)
      .order('submitted_at', { ascending: true })
      .returns<SurveyRow[]>(),
    supabase.from('misi').select('id', { count: 'exact', head: true }),
  ]);

  const completedCount = stats?.total_misi_completed ?? 0;
  const levelProgress =
    missionCount && missionCount > 0
      ? Math.round((completedCount / missionCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-sigma-cyan/40 bg-sigma-cyan/10">
              <UserRound className="h-8 w-8 text-sigma-cyan" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
                Detail Siswa
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                {student.nama_lengkap}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {student.kelas ?? 'Kelas belum diisi'}
              </p>
            </div>
          </div>

          <Button className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 lg:w-auto">
            <Send className="h-4 w-4" aria-hidden />
            Kirim Pesan Motivasi
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatPill
            icon={Award}
            label="Total XP"
            value={stats?.total_xp ?? 0}
          />
          <StatPill
            icon={Sparkles}
            label="Streak"
            value={`${stats?.current_streak ?? 0} hari`}
          />
          <StatPill
            icon={TrendingUp}
            label="Level"
            value={stats?.current_level ?? 1}
          />
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs text-slate-500">Level progress</p>
            <p className="mt-1 text-lg font-bold text-white">
              {levelProgress}%
            </p>
            <Progress
              value={levelProgress}
              className="mt-2 h-2 bg-slate-800 [&>div]:bg-sigma-cyan"
            />
          </div>
        </div>
      </section>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-1">
          {[
            'Progress',
            'N-Gain',
            'Chatbot History',
            'Recommendations',
            'Survey',
          ].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase().replace(/\s+/g, '-')}
              className="data-[state=active]:bg-sigma-cyan data-[state=active]:text-sigma-navy"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="progress">
          <Card className="border-slate-700 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle>Timeline Misi Selesai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(progressRows ?? []).length === 0 ? (
                <EmptyState text="Belum ada progress misi." />
              ) : (
                (progressRows ?? []).map((row) => {
                  const mission = getMission(row);
                  return (
                    <div
                      key={`${mission?.id ?? 'unknown'}-${row.completed_at}`}
                      className="relative rounded-2xl border border-slate-800 bg-slate-950/50 p-4 pl-10"
                    >
                      <span
                        className={cn(
                          'absolute left-4 top-5 h-3 w-3 rounded-full',
                          row.status === MisiStatus.Completed
                            ? 'bg-emerald-400'
                            : 'bg-sigma-gold'
                        )}
                      />
                      <p className="text-sm font-semibold text-white">
                        {mission?.nama ?? 'Misi AIjarin'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {getLevelName(mission?.levels ?? null)} ·{' '}
                        {formatDate(row.completed_at)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className={scoreTone(row.best_score)}
                        >
                          Skor {row.best_score ?? '-'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          {row.attempts ?? 0} attempts
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          <Timer className="mr-1 h-3 w-3" aria-hidden />
                          {formatDuration(row.time_spent_seconds)}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n-gain">
          <Card className="border-slate-700 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle>N-Gain Siswa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(ngainRows ?? []).length === 0 ? (
                <EmptyState text="Belum ada hasil N-Gain." />
              ) : (
                (ngainRows ?? []).map((row) => (
                  <div
                    key={`${getLevelName(row.levels)}-${row.calculated_at}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">
                        {getLevelName(row.levels)}
                      </p>
                      <Badge
                        variant="outline"
                        className={categoryTone(row.kategori)}
                      >
                        {row.kategori ?? 'belum ada'}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <ScoreBar
                        label="Pre-test"
                        value={row.skor_pretest ?? 0}
                      />
                      <ScoreBar
                        label="Post-test"
                        value={row.skor_posttest ?? 0}
                      />
                      <ScoreBar
                        label="N-Gain"
                        value={Math.round((row.ngain ?? 0) * 100)}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot-history">
          <Card className="border-slate-700 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle>Chatbot History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(chatbotRows ?? []).length === 0 ? (
                <EmptyState text="Belum ada riwayat chatbot." />
              ) : (
                (chatbotRows ?? []).map((row, index) => (
                  <div
                    key={`${row.created_at}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Bot
                        className="h-3.5 w-3.5 text-sigma-cyan"
                        aria-hidden
                      />
                      {getMissionName(row.misi)} · {formatDate(row.created_at)}{' '}
                      · {row.tokens_used ?? 0} token
                    </div>
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-white">Siswa:</span>{' '}
                      {row.pesan_siswa}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      <span className="font-semibold text-sigma-cyan">
                        SIGMA-Bot:
                      </span>{' '}
                      {row.respons_ai}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card className="border-slate-700 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle>Adaptive Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recommendations ?? []).length === 0 ? (
                <EmptyState text="Belum ada rekomendasi adaptif." />
              ) : (
                (recommendations ?? []).map((row, index) => (
                  <div
                    key={`${row.weak_concept}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-sigma-cyan/40 text-sigma-cyan"
                      >
                        {row.weak_concept}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          row.is_completed
                            ? 'border-emerald-400/40 text-emerald-300'
                            : 'border-sigma-gold/40 text-sigma-gold'
                        }
                      >
                        {row.is_completed ? 'Selesai' : 'Aktif'}
                      </Badge>
                    </div>
                    <p className="mt-3 font-semibold text-white">
                      {getMissionName(row.misi)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {row.reason ??
                        'Latihan tambahan yang direkomendasikan SIGMA-Bot.'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="survey">
          <Card className="border-slate-700 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle>Survey Trajectory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(surveys ?? []).length === 0 ? (
                <EmptyState text="Belum ada data survei." />
              ) : (
                (surveys ?? []).map((row, index) => (
                  <div
                    key={`${row.survey_type}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">
                        {row.survey_type}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-sigma-cyan/40 text-sigma-cyan"
                      >
                        Anxiety {row.anxiety_index?.toFixed(2) ?? '-'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(row.submitted_at)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" aria-hidden />
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Progress
        value={value}
        className="h-2 bg-slate-800 [&>div]:bg-sigma-cyan"
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
