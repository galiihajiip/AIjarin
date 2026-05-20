import { createClient } from '@/lib/supabase/server';
import type { JsonValue } from '@/types';
import { MisiType, UserRole } from '@/types';

export type MissionPlayerData = {
  misiId: string;
  misiNama: string;
  misiTipe: MisiType;
  xpReward: number;
  timeLimitSeconds: number | null;
  levelNama: string;
  levelNomor: number;
  storyText: string;
  kontenJson: JsonValue;
  totalSoal: number;
};

type MisiRow = {
  id: string;
  nama: string;
  tipe: string;
  xp_reward: number | null;
  time_limit_seconds: number | null;
  konten_json: JsonValue;
  cerita_cutscene: string | null;
  levels:
    | { nomor: number; nama: string }
    | { nomor: number; nama: string }[]
    | null;
};

function isMisiType(value: string): value is MisiType {
  return Object.values(MisiType).includes(value as MisiType);
}

function getLevelMeta(levels: MisiRow['levels']): {
  nomor: number;
  nama: string;
} {
  const level = Array.isArray(levels) ? levels[0] : levels;
  return {
    nomor: level?.nomor ?? 1,
    nama: level?.nama ?? 'Level SIGMA',
  };
}

function getStoryText(misi: {
  cerita_cutscene: string | null;
  konten_json: JsonValue;
}): string {
  if (misi.cerita_cutscene?.trim()) {
    return misi.cerita_cutscene.trim();
  }

  if (misi.konten_json && typeof misi.konten_json === 'object') {
    const content = misi.konten_json as Record<string, JsonValue>;
    if (typeof content.konteks === 'string' && content.konteks.trim()) {
      return content.konteks.trim();
    }
    if (typeof content.instruksi === 'string' && content.instruksi.trim()) {
      return content.instruksi.trim();
    }
  }

  return 'Baca konteks misi dengan teliti sebelum mulai menjawab ya, Agen!';
}

export async function fetchMissionForPlayer(
  misiId: string
): Promise<MissionPlayerData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== UserRole.Siswa) {
    return null;
  }

  const { data: progress } = await supabase
    .from('siswa_progress')
    .select('status')
    .eq('siswa_id', user.id)
    .eq('misi_id', misiId)
    .maybeSingle();

  if (progress?.status === 'locked') {
    return null;
  }

  const { data: misi, error: misiError } = await supabase
    .from('misi')
    .select(
      `
      id,
      nama,
      tipe,
      xp_reward,
      time_limit_seconds,
      konten_json,
      cerita_cutscene,
      levels ( nomor, nama )
    `
    )
    .eq('id', misiId)
    .single<MisiRow>();

  if (misiError || !misi || !isMisiType(misi.tipe)) {
    return null;
  }

  const { count: soalCount } = await supabase
    .from('soal')
    .select('id', { count: 'exact', head: true })
    .eq('misi_id', misiId);

  const level = getLevelMeta(misi.levels);

  return {
    misiId: misi.id,
    misiNama: misi.nama,
    misiTipe: misi.tipe,
    xpReward: misi.xp_reward ?? 0,
    timeLimitSeconds: misi.time_limit_seconds,
    levelNama: level.nama,
    levelNomor: level.nomor,
    storyText: getStoryText(misi),
    kontenJson: misi.konten_json,
    totalSoal: soalCount && soalCount > 0 ? soalCount : 1,
  };
}
