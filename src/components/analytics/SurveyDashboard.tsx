'use client';

import { useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Info, ShieldCheck, TrendingDown, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SurveyDimensionScore = {
  id: string;
  label: string;
  preScore: number;
  postScore: number;
};

export type StudentSurveyTrajectory = {
  studentId: string;
  studentName: string;
  preScores: Record<string, number>;
  postScores: Record<string, number>;
  preAnxietyIndex?: number | null;
  postAnxietyIndex?: number | null;
};

type SurveyDashboardProps = {
  dimensions: SurveyDimensionScore[];
  students: StudentSurveyTrajectory[];
  classPreAnxietyIndex?: number | null;
  classPostAnxietyIndex?: number | null;
  confidenceLevel?: string;
  className?: string;
};

type RadarPoint = {
  dimension: string;
  pre: number;
  post: number;
};

function clampLikert(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}

function getAverageAnxiety(
  students: StudentSurveyTrajectory[],
  key: 'preAnxietyIndex' | 'postAnxietyIndex'
): number | null {
  const values = students
    .map((student) => student[key])
    .filter((value): value is number => typeof value === 'number');

  return values.length > 0 ? average(values) : null;
}

function getAnxietyDelta(
  preIndex: number | null,
  postIndex: number | null
): number {
  if (preIndex == null || postIndex == null || preIndex <= 0) return 0;
  return ((preIndex - postIndex) / preIndex) * 100;
}

function buildStudentRadarData(
  dimensions: SurveyDimensionScore[],
  student: StudentSurveyTrajectory | undefined
): RadarPoint[] {
  if (!student) return [];

  return dimensions.map((dimension) => ({
    dimension: dimension.label,
    pre: clampLikert(student.preScores[dimension.id] ?? 0),
    post: clampLikert(student.postScores[dimension.id] ?? 0),
  }));
}

function SurveyRadarChart({ data }: { data: RadarPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50 text-sm text-slate-500">
        Belum ada data survei untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#cbd5e1', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
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
          <Radar
            name="Pre"
            dataKey="pre"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.22}
          />
          <Radar
            name="Post"
            dataKey="post"
            stroke="#22d3ee"
            fill="#22d3ee"
            fillOpacity={0.28}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SurveyDashboard({
  dimensions,
  students,
  classPreAnxietyIndex,
  classPostAnxietyIndex,
  confidenceLevel = '95%',
  className,
}: SurveyDashboardProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.studentId ?? ''
  );
  const selectedStudent = students.find(
    (student) => student.studentId === selectedStudentId
  );
  const classRadarData = useMemo(
    () =>
      dimensions.map((dimension) => ({
        dimension: dimension.label,
        pre: clampLikert(dimension.preScore),
        post: clampLikert(dimension.postScore),
      })),
    [dimensions]
  );
  const studentRadarData = useMemo(
    () => buildStudentRadarData(dimensions, selectedStudent),
    [dimensions, selectedStudent]
  );

  const preIndex =
    classPreAnxietyIndex ?? getAverageAnxiety(students, 'preAnxietyIndex');
  const postIndex =
    classPostAnxietyIndex ?? getAverageAnxiety(students, 'postAnxietyIndex');
  const anxietyDrop = getAnxietyDelta(preIndex, postIndex);
  const dropLabel = anxietyDrop >= 0 ? 'turun' : 'naik';

  return (
    <section className={cn('space-y-4', className)}>
      <Card className="border-emerald-400/30 bg-emerald-400/10 text-white">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-400/15 p-2 text-emerald-300">
              <TrendingDown className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Progress Kecemasan
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Indeks Kecemasan Kelas {dropLabel} {formatPercent(anxietyDrop)}{' '}
                setelah menggunakan AIjarin
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Pre: {preIndex?.toFixed(2) ?? '-'} · Post:{' '}
                {postIndex?.toFixed(2) ?? '-'}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
          >
            {students.length.toLocaleString('id-ID')} responden
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-slate-700 bg-slate-900/70 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-sigma-cyan" aria-hidden />
              Perbandingan Kelas: Pre vs Post
            </CardTitle>
            <p className="text-sm text-slate-500">
              Rata-rata skor Likert 1-5 untuk lima dimensi survei.
            </p>
          </CardHeader>
          <CardContent>
            <SurveyRadarChart data={classRadarData} />
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/70 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-sigma-gold" aria-hidden />
              Drill Down Siswa
            </CardTitle>
            <p className="text-sm text-slate-500">
              Pilih siswa untuk melihat trajectory survei individual.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {students.length > 0 ? (
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sigma-cyan"
              >
                {students.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.studentName}
                  </option>
                ))}
              </select>
            ) : null}

            <SurveyRadarChart data={studentRadarData} />

            {selectedStudent ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">Pre Anxiety Index</p>
                  <p className="mt-1 text-xl font-bold text-sigma-gold">
                    {selectedStudent.preAnxietyIndex?.toFixed(2) ?? '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">Post Anxiety Index</p>
                  <p className="mt-1 text-xl font-bold text-sigma-cyan">
                    {selectedStudent.postAnxietyIndex?.toFixed(2) ?? '-'}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-700 bg-slate-900/70 text-white">
        <CardContent className="flex flex-col gap-3 p-5 text-sm text-slate-400 md:flex-row md:items-start">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-sigma-cyan"
            aria-hidden
          />
          <p>
            Catatan statistik: sample size {students.length} siswa, confidence
            level {confidenceLevel}. Dashboard ini bersifat indikatif untuk
            pemantauan kelas, bukan kesimpulan kausal formal. Interpretasi tetap
            perlu mempertimbangkan konteks kelas, kehadiran, dan kualitas
            respons survei.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
