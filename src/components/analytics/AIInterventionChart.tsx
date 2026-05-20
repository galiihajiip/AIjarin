'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bot, Lightbulb, MessageCircle, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AIUsagePoint = {
  label: string;
  sessions: number;
};

export type MissionInterventionPoint = {
  missionId: string;
  missionName: string;
  levelNomor?: number;
  sessions: number;
};

export type StudentInterventionRow = {
  studentId: string;
  studentName: string;
  totalSessions: number;
  mostAskedTopics: string[];
};

type AIInterventionChartProps = {
  usageOverTime: AIUsagePoint[];
  missionUsage: MissionInterventionPoint[];
  studentBreakdown: StudentInterventionRow[];
  className?: string;
};

function formatTopics(topics: string[]): string {
  if (topics.length === 0) return '-';
  return topics.slice(0, 3).join(', ');
}

function getLevelThreePattern(
  missionUsage: MissionInterventionPoint[],
  studentBreakdown: StudentInterventionRow[]
): string {
  const levelThreeHotspot = missionUsage
    .filter((mission) => mission.levelNomor === 3)
    .sort((a, b) => b.sessions - a.sessions)[0];

  if (levelThreeHotspot) {
    return `banyak bertanya pada ${levelThreeHotspot.missionName}`;
  }

  const topicCounts = new Map<string, number>();
  studentBreakdown.forEach((student) => {
    student.mostAskedTopics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    });
  });

  const topTopic = Array.from(topicCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return topTopic
    ? `sering bingung pada topik ${topTopic}`
    : 'butuh scaffolding tambahan';
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-8 text-center text-sm text-slate-500">
      Belum ada data intervensi AI untuk ditampilkan.
    </div>
  );
}

export function AIInterventionChart({
  usageOverTime,
  missionUsage,
  studentBreakdown,
  className,
}: AIInterventionChartProps) {
  const topMissions = [...missionUsage]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);
  const topStudents = [...studentBreakdown]
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 8);
  const totalSessions = usageOverTime.reduce(
    (sum, point) => sum + point.sessions,
    0
  );
  const insightPattern = getLevelThreePattern(missionUsage, studentBreakdown);

  return (
    <section className={cn('space-y-4', className)}>
      <Card className="border-sigma-cyan/30 bg-sigma-cyan/10 text-white">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-sigma-cyan/15 p-2 text-sigma-cyan">
              <Lightbulb className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
                Insight Intervensi AI
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Siswa yang sering menggunakan chatbot pada Level 3 menunjukkan
                pola {insightPattern}. Pertimbangkan review tambahan.
              </h2>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-sigma-gold/40 bg-sigma-gold/10 text-sigma-gold"
          >
            {totalSessions.toLocaleString('id-ID')} sesi chatbot
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-700 bg-slate-900/70 text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Chatbot Usage Over Time</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Frekuensi bantuan SIGMA-Bot per hari atau per minggu.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-sigma-cyan" aria-hidden />
          </CardHeader>
          <CardContent>
            {usageOverTime.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageOverTime}>
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#020617',
                        border: '1px solid #334155',
                        borderRadius: 12,
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#67e8f9' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      name="Sesi chatbot"
                      stroke="#22d3ee"
                      strokeWidth={3}
                      dot={{ fill: '#22d3ee', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/70 text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Invokasi per Misi</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Misi dengan kebutuhan bantuan AI paling tinggi.
              </p>
            </div>
            <Bot className="h-5 w-5 text-sigma-gold" aria-hidden />
          </CardHeader>
          <CardContent>
            {topMissions.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMissions} layout="vertical">
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="missionName"
                      width={120}
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#020617',
                        border: '1px solid #334155',
                        borderRadius: 12,
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#facc15' }}
                    />
                    <Bar
                      dataKey="sessions"
                      name="Sesi chatbot"
                      fill="#facc15"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-700 bg-slate-900/70 text-white">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Breakdown per Siswa</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Siswa dengan frekuensi bantuan tertinggi dan topik yang paling
              sering ditanyakan.
            </p>
          </div>
          <MessageCircle className="h-5 w-5 text-sigma-cyan" aria-hidden />
        </CardHeader>
        <CardContent>
          {topStudents.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student name</th>
                    <th className="px-4 py-3 font-semibold">
                      Total chatbot sessions
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Most asked topics
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {topStudents.map((student) => (
                    <tr key={student.studentId} className="bg-slate-950/40">
                      <td className="px-4 py-3 font-medium text-slate-100">
                        {student.studentName}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-sigma-cyan">
                        {student.totalSessions.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatTopics(student.mostAskedTopics)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
