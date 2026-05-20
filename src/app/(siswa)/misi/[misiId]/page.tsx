import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  AssessmentFlow,
  AssessmentGate,
  PosttestLockedGate,
} from '@/components/missions/AssessmentFlow';
import { MissionPlayer } from '@/components/missions/MissionPlayer';
import { Button } from '@/components/ui/button';
import { fetchAssessmentMission } from '@/lib/missions/fetch-assessment-mission';
import {
  assertStudentCanPlayMission,
  getAssessmentGateForMission,
} from '@/lib/missions/fetch-assessment-access';
import { getAssessmentType } from '@/lib/missions/assessment-flow';
import { fetchMissionForPlayer } from '@/lib/missions/fetch-mission-player';
import { createClient } from '@/lib/supabase/server';
import type { JsonValue } from '@/types';

type PageProps = {
  params: Promise<{ misiId: string }>;
};

export default async function MisiPlayerPage({ params }: PageProps) {
  const { misiId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: misiMeta } = await supabase
    .from('misi')
    .select('id, konten_json, levels(nomor, nama)')
    .eq('id', misiId)
    .maybeSingle<{
      id: string;
      konten_json: JsonValue;
      levels:
        | { nomor: number; nama: string }
        | { nomor: number; nama: string }[];
    }>();

  if (!misiMeta) {
    notFound();
  }

  const level = Array.isArray(misiMeta.levels)
    ? misiMeta.levels[0]
    : misiMeta.levels;
  const assessmentType = getAssessmentType(misiMeta.konten_json);

  if (assessmentType) {
    const assessment = await fetchAssessmentMission(misiId);

    if (assessment) {
      return <AssessmentFlow {...assessment} />;
    }

    if (assessmentType === 'posttest') {
      return (
        <PosttestLockedGate
          levelNomor={level?.nomor ?? 1}
          levelNama={level?.nama ?? 'Level SIGMA'}
        />
      );
    }

    notFound();
  }

  const access = await assertStudentCanPlayMission(misiId);

  if (!access.allowed && access.gate?.reason === 'pretest_required') {
    if (access.gate.pretestMisiId) {
      return (
        <AssessmentGate
          levelNomor={access.gate.levelNomor}
          levelNama={access.gate.levelNama}
          pretestMisiId={access.gate.pretestMisiId}
        />
      );
    }
  }

  const data = await fetchMissionForPlayer(misiId);

  if (!data) {
    const gate = await getAssessmentGateForMission(misiId, user.id);

    if (gate?.reason === 'pretest_required' && gate.pretestMisiId) {
      return (
        <AssessmentGate
          levelNomor={gate.levelNomor}
          levelNama={gate.levelNama}
          pretestMisiId={gate.pretestMisiId}
        />
      );
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-xl font-bold text-white">Misi Terkunci</h1>
        <p className="max-w-md text-sm text-slate-400">
          Selesaikan misi sebelumnya dulu ya, Agen. Setiap level SIGMA punya
          urutan yang harus kamu ikuti.
        </p>
        <Button asChild variant="outline" className="border-slate-600">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <MissionPlayer {...data} />;
}
