import Link from 'next/link';
import { ArrowRight, Sparkles, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { MisiStatus } from '@/types';

type AdaptiveRecommendationsProps = {
  siswaId: string;
};

type RecommendationRow = {
  id: string;
  weak_concept: string;
  recommended_misi_id: string | null;
  reason: string | null;
  created_at: string | null;
};

type MissionRow = {
  id: string;
  nama: string;
  level_id: string;
  levels:
    | { nomor: number; nama: string }
    | { nomor: number; nama: string }[]
    | null;
};

type ProgressRow = {
  misi_id: string;
  status: string | null;
};

type RecommendationCard = {
  id: string;
  missionId: string;
  missionName: string;
  levelLabel: string;
  concept: string;
  reason: string;
};

function getLevelLabel(levels: MissionRow['levels']): string {
  const level = Array.isArray(levels) ? levels[0] : levels;
  if (!level) return 'Misi Latihan';

  return `Level ${level.nomor} · ${level.nama}`;
}

function titleCaseConcept(concept: string): string {
  return concept
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function AdaptiveRecommendations({
  siswaId,
}: AdaptiveRecommendationsProps) {
  const supabase = createClient();
  const { data: recommendations, error: recommendationsError } = await supabase
    .from('adaptive_recommendations')
    .select('id, weak_concept, recommended_misi_id, reason, created_at')
    .eq('siswa_id', siswaId)
    .eq('is_completed', false)
    .order('created_at', { ascending: false })
    .limit(8)
    .returns<RecommendationRow[]>();

  if (recommendationsError || !recommendations?.length) {
    return null;
  }

  const missionIds = recommendations
    .map((recommendation) => recommendation.recommended_misi_id)
    .filter((id): id is string => Boolean(id));

  if (missionIds.length === 0) {
    return null;
  }

  const [
    { data: missions, error: missionsError },
    { data: progressRows, error: progressError },
  ] = await Promise.all([
    supabase
      .from('misi')
      .select('id, nama, level_id, levels(nomor, nama)')
      .in('id', missionIds)
      .returns<MissionRow[]>(),
    supabase
      .from('siswa_progress')
      .select('misi_id, status')
      .eq('siswa_id', siswaId)
      .in('misi_id', missionIds)
      .returns<ProgressRow[]>(),
  ]);

  if (missionsError || progressError || !missions?.length) {
    return null;
  }

  const progressByMissionId = new Map(
    (progressRows ?? []).map((row) => [row.misi_id, row.status])
  );
  const completedRecommendationIds = recommendations
    .filter((recommendation) => {
      const missionId = recommendation.recommended_misi_id;
      return missionId
        ? progressByMissionId.get(missionId) === MisiStatus.Completed
        : false;
    })
    .map((recommendation) => recommendation.id);

  if (completedRecommendationIds.length > 0) {
    await supabase
      .from('adaptive_recommendations')
      .update({ is_completed: true })
      .in('id', completedRecommendationIds);
  }

  const missionById = new Map(missions.map((mission) => [mission.id, mission]));
  const cards: RecommendationCard[] = recommendations
    .filter(
      (recommendation) =>
        !completedRecommendationIds.includes(recommendation.id)
    )
    .map((recommendation): RecommendationCard | null => {
      const missionId = recommendation.recommended_misi_id;
      const mission = missionId ? missionById.get(missionId) : null;

      if (!mission || !missionId) return null;

      return {
        id: recommendation.id,
        missionId,
        missionName: mission.nama,
        levelLabel: getLevelLabel(mission.levels),
        concept: titleCaseConcept(recommendation.weak_concept),
        reason:
          recommendation.reason ??
          `SIGMA-Bot melihat kamu perlu latihan tambahan untuk konsep ${recommendation.weak_concept}.`,
      };
    })
    .filter((card): card is RecommendationCard => card !== null)
    .slice(0, 3);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-sigma-cyan/30 bg-sigma-cyan/10 p-4 shadow-2xl shadow-sigma-cyan/5 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sigma-gold/30 bg-sigma-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sigma-gold">
            <Sparkles className="h-4 w-4" aria-hidden />
            Rekomendasi Adaptif
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">
            SIGMA-Bot merekomendasikan untuk kamu 🎯
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Latihan ini dipilih dari pola skor, percobaan, dan bantuan chatbot
            kamu.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.id}
            className="flex h-full flex-col border-slate-700 bg-slate-950/70 text-white"
          >
            <CardHeader className="pb-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="border-sigma-cyan/40 bg-sigma-cyan/10 text-sigma-cyan"
                >
                  {card.concept}
                </Badge>
                <Target className="h-4 w-4 text-sigma-gold" aria-hidden />
              </div>
              <CardDescription className="text-xs text-slate-500">
                {card.levelLabel}
              </CardDescription>
              <CardTitle className="text-base leading-snug text-white">
                {card.missionName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="text-sm leading-relaxed text-slate-400">
                {card.reason}
              </p>
              <Button
                asChild
                className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90"
              >
                <Link href={`/misi/${card.missionId}`}>
                  Kerjakan Sekarang
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
