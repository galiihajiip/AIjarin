// @ts-expect-error Deno resolves remote imports for Supabase Edge Functions.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type MissionRow = {
  id: string;
  level_id: string;
  urutan: number;
  nama: string;
  tipe: string;
  konten_json: JsonValue;
  xp_reward: number | null;
  is_boss_challenge: boolean | null;
};

type ProgressRow = {
  misi_id: string;
  status: string | null;
  attempts: number | null;
  best_score: number | null;
  completed_at: string | null;
  misi: MissionRow | MissionRow[] | null;
};

type ChatbotLogRow = {
  misi_id: string | null;
};

type Recommendation = {
  weak_concept: string;
  recommended_misi_id: string;
  reason: string;
};

type AdaptiveRequest = {
  siswaId?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function readConcepts(kontenJson: JsonValue): string[] {
  const data = getRecord(kontenJson);
  const concepts = data?.concepts;

  if (!Array.isArray(concepts)) {
    return [];
  }

  return concepts
    .filter((concept): concept is string => typeof concept === 'string')
    .map((concept) => concept.trim().toLowerCase())
    .filter(Boolean);
}

function getMission(row: ProgressRow): MissionRow | null {
  if (Array.isArray(row.misi)) {
    return row.misi[0] ?? null;
  }

  return row.misi;
}

function getWeakProgressRows(rows: ProgressRow[]): ProgressRow[] {
  return rows.filter((row) => {
    const bestScore = row.best_score ?? 0;
    const attempts = row.attempts ?? 0;

    return bestScore < 70 || attempts >= 3;
  });
}

function countByMission(logs: ChatbotLogRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const log of logs) {
    if (!log.misi_id) continue;
    counts.set(log.misi_id, (counts.get(log.misi_id) ?? 0) + 1);
  }

  return counts;
}

function hasAnyConcept(mission: MissionRow, concepts: Set<string>): boolean {
  return readConcepts(mission.konten_json).some((concept) =>
    concepts.has(concept)
  );
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: 'Supabase Edge Function env belum lengkap.' },
      500
    );
  }

  let payload: AdaptiveRequest;

  try {
    payload = (await request.json()) as AdaptiveRequest;
  } catch {
    return jsonResponse({ error: 'Payload tidak valid.' }, 400);
  }

  if (!payload.siswaId) {
    return jsonResponse({ error: 'siswaId wajib diisi.' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const siswaId = payload.siswaId;

  const { data: recentProgress, error: progressError } = await supabase
    .from('siswa_progress')
    .select(
      `
      misi_id,
      status,
      attempts,
      best_score,
      completed_at,
      misi (
        id,
        level_id,
        urutan,
        nama,
        tipe,
        konten_json,
        xp_reward,
        is_boss_challenge
      )
    `
    )
    .eq('siswa_id', siswaId)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(5);

  if (progressError) {
    return jsonResponse(
      { error: `Gagal membaca progres siswa: ${progressError.message}` },
      500
    );
  }

  const { data: chatbotLogs, error: chatError } = await supabase
    .from('chatbot_logs')
    .select('misi_id')
    .eq('siswa_id', siswaId)
    .not('misi_id', 'is', null)
    .limit(200);

  if (chatError) {
    return jsonResponse(
      { error: `Gagal membaca log chatbot: ${chatError.message}` },
      500
    );
  }

  const weakRows = getWeakProgressRows((recentProgress ?? []) as ProgressRow[]);
  const chatCounts = countByMission((chatbotLogs ?? []) as ChatbotLogRow[]);
  const chatWeakMissionIds = Array.from(chatCounts.entries())
    .filter(([, count]) => count > 3)
    .map(([misiId]) => misiId);

  const weakMissionMap = new Map<string, MissionRow>();

  for (const row of weakRows) {
    const mission = getMission(row);
    if (mission) {
      weakMissionMap.set(mission.id, mission);
    }
  }

  if (chatWeakMissionIds.length > 0) {
    const { data: chatWeakMissions, error: chatMissionError } = await supabase
      .from('misi')
      .select(
        'id, level_id, urutan, nama, tipe, konten_json, xp_reward, is_boss_challenge'
      )
      .in('id', chatWeakMissionIds);

    if (chatMissionError) {
      return jsonResponse(
        {
          error: `Gagal membaca misi dari log chatbot: ${chatMissionError.message}`,
        },
        500
      );
    }

    for (const mission of (chatWeakMissions ?? []) as MissionRow[]) {
      weakMissionMap.set(mission.id, mission);
    }
  }

  const weakConcepts = new Set<string>();
  const reasonsByConcept = new Map<string, string>();

  for (const mission of Array.from(weakMissionMap.values())) {
    const concepts = readConcepts(mission.konten_json);

    for (const concept of concepts) {
      weakConcepts.add(concept);
      if (!reasonsByConcept.has(concept)) {
        const chatCount = chatCounts.get(mission.id) ?? 0;
        reasonsByConcept.set(
          concept,
          chatCount > 3
            ? `Kamu sering meminta bantuan pada misi "${mission.nama}", jadi konsep ${concept} perlu latihan tambahan.`
            : `Skor atau percobaan pada misi "${mission.nama}" menunjukkan konsep ${concept} perlu diperkuat.`
        );
      }
    }
  }

  if (weakConcepts.size === 0) {
    return jsonResponse({ recommendations: [] });
  }

  const { data: completedRows, error: completedError } = await supabase
    .from('siswa_progress')
    .select('misi_id')
    .eq('siswa_id', siswaId)
    .eq('status', 'completed');

  if (completedError) {
    return jsonResponse(
      { error: `Gagal membaca misi selesai: ${completedError.message}` },
      500
    );
  }

  const completedMissionIds = new Set(
    (completedRows ?? []).map((row: { misi_id: string }) => row.misi_id)
  );

  const { data: candidateMissions, error: candidateError } = await supabase
    .from('misi')
    .select(
      'id, level_id, urutan, nama, tipe, konten_json, xp_reward, is_boss_challenge'
    )
    .eq('is_assessment', false)
    .order('xp_reward', { ascending: true })
    .order('urutan', { ascending: true });

  if (candidateError) {
    return jsonResponse(
      { error: `Gagal mencari rekomendasi misi: ${candidateError.message}` },
      500
    );
  }

  const recommendations: Recommendation[] = [];

  for (const concept of Array.from(weakConcepts)) {
    const conceptSet = new Set([concept]);
    const recommendation = ((candidateMissions ?? []) as MissionRow[]).find(
      (mission) =>
        !completedMissionIds.has(mission.id) &&
        !weakMissionMap.has(mission.id) &&
        mission.is_boss_challenge !== true &&
        hasAnyConcept(mission, conceptSet)
    );

    if (!recommendation) continue;

    recommendations.push({
      weak_concept: concept,
      recommended_misi_id: recommendation.id,
      reason:
        reasonsByConcept.get(concept) ??
        `Latihan tambahan untuk memperkuat konsep ${concept}.`,
    });
  }

  if (recommendations.length === 0) {
    return jsonResponse({ recommendations: [] });
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('adaptive_recommendations')
    .select('weak_concept, recommended_misi_id')
    .eq('siswa_id', siswaId)
    .eq('is_completed', false);

  if (existingError) {
    return jsonResponse(
      { error: `Gagal membaca rekomendasi aktif: ${existingError.message}` },
      500
    );
  }

  const existingKeys = new Set(
    (existingRows ?? []).map(
      (row: { weak_concept: string; recommended_misi_id: string | null }) =>
        `${row.weak_concept}:${row.recommended_misi_id}`
    )
  );

  const rowsToInsert = recommendations
    .filter(
      (recommendation) =>
        !existingKeys.has(
          `${recommendation.weak_concept}:${recommendation.recommended_misi_id}`
        )
    )
    .map((recommendation) => ({
      siswa_id: siswaId,
      ...recommendation,
    }));

  if (rowsToInsert.length === 0) {
    return jsonResponse({ recommendations: [] });
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from('adaptive_recommendations')
    .insert(rowsToInsert)
    .select('id, weak_concept, recommended_misi_id, reason, created_at');

  if (insertError) {
    return jsonResponse(
      { error: `Gagal menyimpan rekomendasi: ${insertError.message}` },
      500
    );
  }

  return jsonResponse({ recommendations: insertedRows ?? [] });
});
