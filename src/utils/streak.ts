import { UserProfile } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns effective display streak based on last practice date.
 * If user hasn't practiced today or yesterday, streak has broken (0).
 */
export function getEffectiveStreak(user: UserProfile): {
  streak: number;
  practicedToday: boolean;
  lastPracticeDate: string | null;
} {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const lastDate = user.lastPracticeDate || null;
  const rawStreak = user.streakCount || 0;

  if (!lastDate) {
    return { streak: 0, practicedToday: false, lastPracticeDate: null };
  }

  if (lastDate === today) {
    return { streak: Math.max(1, rawStreak), practicedToday: true, lastPracticeDate: lastDate };
  }

  if (lastDate === yesterday) {
    return { streak: rawStreak, practicedToday: false, lastPracticeDate: lastDate };
  }

  // Older than yesterday => streak reset
  return { streak: 0, practicedToday: false, lastPracticeDate: lastDate };
}

/**
 * Calculates updated user object with updated practice streak.
 */
export function recordPracticeActivity(user: UserProfile): UserProfile {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const { streak: currentEffective, practicedToday } = getEffectiveStreak(user);

  let newStreak = currentEffective;
  if (practicedToday) {
    // Already recorded for today
    newStreak = Math.max(1, currentEffective);
  } else {
    // Extend streak or start a new 1-day streak
    newStreak = currentEffective > 0 ? currentEffective + 1 : 1;
  }

  const existingHistory = user.streakHistory || [];
  const updatedHistory = Array.from(new Set([...existingHistory, today])).sort();

  return {
    ...user,
    streakCount: newStreak,
    lastPracticeDate: today,
    streakHistory: updatedHistory,
  };
}

export interface DayStreakStatus {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  isPracticed: boolean;
  isPast: boolean;
}

export function getLast7DaysStreakStatus(user: UserProfile): DayStreakStatus[] {
  const todayStr = getTodayDateString();
  const historySet = new Set(user.streakHistory || []);
  if (user.lastPracticeDate) {
    historySet.add(user.lastPracticeDate);
  }

  const days: DayStreakStatus[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const isToday = dateStr === todayStr;
    const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isPracticed = historySet.has(dateStr);

    days.push({
      dateStr,
      dayName,
      dayNum,
      isToday,
      isPracticed,
      isPast,
    });
  }

  return days;
}
