import { getAssessmentType } from '@/lib/missions/assessment-flow';
import { createClient } from '@/lib/supabase/server';
import type { JsonValue } from '@/types';
import { MisiStatus } from '@/types';

export type MissionProgressionEntry = {
  misiId: string;
  levelId: string;
  levelNomor: number;
  levelNama: string;
  urutan: number;
  nama: string;
  status: MisiStatus;
  isAssessment: boolean;
  assessmentType: 'pretest' | 'posttest' | null;
};

export type LevelProgressionEntry = {
  levelId: string;
  levelNomor: number;
  levelNama: string;
  unlocked: boolean;
  posttestCompleted: boolean;
  pretestCompleted: boolean;
  missions: MissionProgressionEntry[];
};

export type ProgressionMap = {
  siswaId: string;
  levels: LevelProgressionEntry[];
  missionsById: Record<string, MissionProgressionEntry>;
  /** Flat list of every mission with computed status (for lists / maps). */
  missions: MissionProgressionEntry[];
};

type LevelRow = {
  id: string;
  nomor: number;
  nama: string;
};

type MissionRow = {
  id: string;
  level_id: string;
  urutan: number;
  nama: string;
  is_assessment: boolean | null;
  konten_json: JsonValue;
};

type ProgressRow = {
  misi_id: string;
  status: string | null;
};

type AssessmentLevelRow = {
  level_id: string;
};

export type ProgressionDataset = {
  levels: LevelRow[];
  missions: MissionRow[];
  progressRows: ProgressRow[];
  pretestLevelIds: string[];
  posttestLevelIds: string[];
};

function normalizeProgressStatus(
  status: string | null | undefined
): MisiStatus | null {
  if (!status) return null;

  switch (status) {
    case MisiStatus.Completed:
    case MisiStatus.InProgress:
    case MisiStatus.Available:
    case MisiStatus.Locked:
      return status;
    default:
      return null;
  }
}

function isMissionCompleted(
  mission: MissionRow,
  progressByMissionId: Map<string, MisiStatus | null>,
  pretestLevelIds: Set<string>,
  posttestLevelIds: Set<string>
): boolean {
  const stored = progressByMissionId.get(mission.id);
  if (stored === MisiStatus.Completed) {
    return true;
  }

  const assessmentType = getAssessmentType(mission.konten_json);
  if (assessmentType === 'pretest') {
    return pretestLevelIds.has(mission.level_id);
  }

  if (assessmentType === 'posttest') {
    return posttestLevelIds.has(mission.level_id);
  }

  return false;
}

function isLevelUnlocked(
  levelNomor: number,
  levels: LevelRow[],
  posttestLevelIds: Set<string>
): boolean {
  if (levelNomor <= 1) {
    return true;
  }

  const previousLevel = levels.find((level) => level.nomor === levelNomor - 1);
  if (!previousLevel) {
    return false;
  }

  return posttestLevelIds.has(previousLevel.id);
}

function resolveMissionStatus(
  mission: MissionRow,
  level: LevelRow,
  levelUnlocked: boolean,
  previousMissionCompleted: boolean,
  progressByMissionId: Map<string, MisiStatus | null>,
  pretestLevelIds: Set<string>,
  posttestLevelIds: Set<string>
): MissionProgressionEntry {
  const assessmentType = getAssessmentType(mission.konten_json);
  const stored = progressByMissionId.get(mission.id) ?? null;
  const completed = isMissionCompleted(
    mission,
    progressByMissionId,
    pretestLevelIds,
    posttestLevelIds
  );

  let status = MisiStatus.Locked;

  const sequenceUnlocked = levelUnlocked && previousMissionCompleted;

  if (sequenceUnlocked) {
    if (completed) {
      status = MisiStatus.Completed;
    } else if (stored === MisiStatus.InProgress) {
      status = MisiStatus.InProgress;
    } else {
      status = MisiStatus.Available;
    }
  }

  return {
    misiId: mission.id,
    levelId: level.id,
    levelNomor: level.nomor,
    levelNama: level.nama,
    urutan: mission.urutan,
    nama: mission.nama,
    status,
    isAssessment: mission.is_assessment === true,
    assessmentType,
  };
}

/**
 * Builds a full progression map from curriculum + progress snapshots.
 * Pure function — safe to unit test without Supabase.
 */
export function buildProgressionMap(
  siswaId: string,
  dataset: ProgressionDataset
): ProgressionMap {
  const levels = [...dataset.levels].sort((a, b) => a.nomor - b.nomor);
  const pretestLevelIds = new Set(dataset.pretestLevelIds);
  const posttestLevelIds = new Set(dataset.posttestLevelIds);

  const progressByMissionId = new Map<string, MisiStatus | null>();
  for (const row of dataset.progressRows) {
    progressByMissionId.set(row.misi_id, normalizeProgressStatus(row.status));
  }

  const missionsByLevel = new Map<string, MissionRow[]>();
  for (const mission of dataset.missions) {
    const bucket = missionsByLevel.get(mission.level_id) ?? [];
    bucket.push(mission);
    missionsByLevel.set(mission.level_id, bucket);
  }

  missionsByLevel.forEach((missions) => {
    missions.sort((a, b) => a.urutan - b.urutan);
  });

  const levelEntries: LevelProgressionEntry[] = [];
  const missionsById: Record<string, MissionProgressionEntry> = {};
  const missions: MissionProgressionEntry[] = [];

  for (const level of levels) {
    const levelMissions = missionsByLevel.get(level.id) ?? [];
    const levelUnlocked = isLevelUnlocked(
      level.nomor,
      levels,
      posttestLevelIds
    );

    const missionEntries: MissionProgressionEntry[] = [];

    for (let index = 0; index < levelMissions.length; index++) {
      const mission = levelMissions[index];
      const previousMissionCompleted =
        index === 0
          ? true
          : isMissionCompleted(
              levelMissions[index - 1],
              progressByMissionId,
              pretestLevelIds,
              posttestLevelIds
            );

      const entry = resolveMissionStatus(
        mission,
        level,
        levelUnlocked,
        previousMissionCompleted,
        progressByMissionId,
        pretestLevelIds,
        posttestLevelIds
      );

      missionEntries.push(entry);
      missionsById[mission.id] = entry;
      missions.push(entry);
    }

    levelEntries.push({
      levelId: level.id,
      levelNomor: level.nomor,
      levelNama: level.nama,
      unlocked: levelUnlocked,
      posttestCompleted: posttestLevelIds.has(level.id),
      pretestCompleted: pretestLevelIds.has(level.id),
      missions: missionEntries,
    });
  }

  return {
    siswaId,
    levels: levelEntries,
    missionsById,
    missions,
  };
}

/**
 * Returns the computed progression map for a student.
 * Mission N+1 is available only after mission N (by urutan) is completed.
 * Level N+1's first mission is available only after level N post-test is completed.
 */
export async function getUnlockedMissions(
  siswaId: string
): Promise<ProgressionMap> {
  const supabase = createClient();

  const [
    { data: levels, error: levelsError },
    { data: missions, error: missionsError },
    { data: progressRows, error: progressError },
    { data: pretestRows, error: pretestError },
    { data: posttestRows, error: posttestError },
  ] = await Promise.all([
    supabase
      .from('levels')
      .select('id, nomor, nama')
      .eq('is_active', true)
      .order('nomor', { ascending: true })
      .returns<LevelRow[]>(),
    supabase
      .from('misi')
      .select('id, level_id, urutan, nama, is_assessment, konten_json')
      .order('urutan', { ascending: true })
      .returns<MissionRow[]>(),
    supabase
      .from('siswa_progress')
      .select('misi_id, status')
      .eq('siswa_id', siswaId)
      .returns<ProgressRow[]>(),
    supabase
      .from('pretest_results')
      .select('level_id')
      .eq('siswa_id', siswaId)
      .returns<AssessmentLevelRow[]>(),
    supabase
      .from('posttest_results')
      .select('level_id')
      .eq('siswa_id', siswaId)
      .returns<AssessmentLevelRow[]>(),
  ]);

  const error =
    levelsError?.message ??
    missionsError?.message ??
    progressError?.message ??
    pretestError?.message ??
    posttestError?.message;

  if (error) {
    throw new Error(`Gagal memuat progresi misi: ${error}`);
  }

  return buildProgressionMap(siswaId, {
    levels: levels ?? [],
    missions: missions ?? [],
    progressRows: progressRows ?? [],
    pretestLevelIds: (pretestRows ?? []).map((row) => row.level_id),
    posttestLevelIds: (posttestRows ?? []).map((row) => row.level_id),
  });
}

/** Missions that are not locked under strict linear progression rules. */
export function getPlayableMissions(
  map: ProgressionMap
): MissionProgressionEntry[] {
  return map.missions.filter((mission) => mission.status !== MisiStatus.Locked);
}
