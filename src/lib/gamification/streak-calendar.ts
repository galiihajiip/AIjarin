import { addDays, format, parseISO } from 'date-fns';

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

const WEEKDAY_LABELS = [
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
  'Min',
] as const;

export type StreakWeekDay = {
  date: string;
  label: (typeof WEEKDAY_LABELS)[number];
  isActive: boolean;
  isToday: boolean;
};

export function formatCalendarDateInJakarta(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDaysToDateString(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), 'yyyy-MM-dd');
}

function getMondayOfWeekJakarta(todayStr: string): string {
  const ref = new Date(`${todayStr}T12:00:00+07:00`);
  const weekday = ref.getDay();
  const diffToMonday = weekday === 0 ? 6 : weekday - 1;
  return addDaysToDateString(todayStr, -diffToMonday);
}

/** Dates (yyyy-MM-dd) that count toward the current streak window. */
export function getActiveStreakDates(
  currentStreak: number,
  lastActiveDate: string | null
): Set<string> {
  const active = new Set<string>();

  if (!lastActiveDate || currentStreak <= 0) {
    return active;
  }

  for (let offset = 0; offset < currentStreak; offset += 1) {
    active.add(addDaysToDateString(lastActiveDate, -offset));
  }

  return active;
}

export function buildStreakWeekDays(
  currentStreak: number,
  lastActiveDate: string | null,
  referenceDate: Date = new Date()
): StreakWeekDay[] {
  const today = formatCalendarDateInJakarta(referenceDate);
  const monday = getMondayOfWeekJakarta(today);
  const activeDates = getActiveStreakDates(currentStreak, lastActiveDate);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = addDaysToDateString(monday, index);
    return {
      date,
      label,
      isActive: activeDates.has(date),
      isToday: date === today,
    };
  });
}

export function isStreakAtRiskToday(
  currentStreak: number,
  lastActiveDate: string | null,
  referenceDate: Date = new Date()
): boolean {
  if (currentStreak <= 0) {
    return false;
  }

  const today = formatCalendarDateInJakarta(referenceDate);
  return lastActiveDate !== today;
}
