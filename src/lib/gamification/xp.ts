export const XP_MULTIPLIERS = {
  first_attempt: 1.0,
  second_attempt: 0.75,
  third_attempt_plus: 0.5,
  perfect_score: 1.5, // Bonus for 100%
  speed_bonus: 1.25, // Completed in < 50% of time limit
} as const;

/** Cumulative XP required to reach each SIGMA agent level (index 0 = level 1). */
export const XP_LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000] as const;

function getAttemptMultiplier(attempt: number): number {
  if (attempt <= 1) {
    return XP_MULTIPLIERS.first_attempt;
  }
  if (attempt === 2) {
    return XP_MULTIPLIERS.second_attempt;
  }
  return XP_MULTIPLIERS.third_attempt_plus;
}

function qualifiesForSpeedBonus(
  timeTaken?: number,
  timeLimit?: number
): boolean {
  if (timeTaken == null || timeLimit == null || timeLimit <= 0) {
    return false;
  }
  return timeTaken >= 0 && timeTaken < timeLimit * 0.5;
}

/**
 * Computes XP earned for a mission attempt.
 * Base reward is scaled by score (0–100), attempt decay, and optional bonuses.
 */
export function calculateXP(
  baseXP: number,
  attempt: number,
  score: number,
  timeTaken?: number,
  timeLimit?: number
): number {
  if (baseXP <= 0 || score <= 0 || attempt < 1) {
    return 0;
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  let xp = baseXP * (normalizedScore / 100) * getAttemptMultiplier(attempt);

  if (normalizedScore === 100) {
    xp *= XP_MULTIPLIERS.perfect_score;
  }

  if (qualifiesForSpeedBonus(timeTaken, timeLimit)) {
    xp *= XP_MULTIPLIERS.speed_bonus;
  }

  return Math.round(xp);
}

/**
 * Maps lifetime XP to SIGMA agent level (1–7) using {@link XP_LEVEL_THRESHOLDS}.
 */
export function calculateLevelFromXP(totalXP: number): number {
  const safeTotal = Math.max(0, totalXP);

  for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeTotal >= XP_LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }

  return 1;
}

export type XpProgressInfo = {
  level: number;
  currentXp: number;
  levelFloorXp: number;
  nextLevelXp: number | null;
  xpNeededForNextLevel: number;
  progressPercent: number;
};

/** XP progress within the current agent level band (for UI bars). */
export function getXpProgress(totalXP: number): XpProgressInfo {
  const currentXp = Math.max(0, totalXP);
  const level = calculateLevelFromXP(currentXp);
  const maxLevel = XP_LEVEL_THRESHOLDS.length;
  const levelFloorXp = XP_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = level < maxLevel ? XP_LEVEL_THRESHOLDS[level] : null;

  if (nextLevelXp == null) {
    return {
      level,
      currentXp,
      levelFloorXp,
      nextLevelXp: null,
      xpNeededForNextLevel: 0,
      progressPercent: 100,
    };
  }

  const span = nextLevelXp - levelFloorXp;
  const xpInBand = currentXp - levelFloorXp;
  const progressPercent =
    span > 0 ? Math.min(100, Math.max(0, (xpInBand / span) * 100)) : 0;

  return {
    level,
    currentXp,
    levelFloorXp,
    nextLevelXp,
    xpNeededForNextLevel: Math.max(0, nextLevelXp - currentXp),
    progressPercent,
  };
}
