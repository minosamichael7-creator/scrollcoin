/**
 * Streak hook backed by `getStreak`.
 *
 * Returns the user's current streak count, streak-freeze count, and last
 * active date. Guests (no actor) see a zeroed streak so the UI can still
 * render the streak badge shell.
 */
import { useBackend } from "@/hooks/useBackend";
import type { Streak } from "@/types/rewards";
import { useQuery } from "@tanstack/react-query";

export const STREAK_QUERY_KEY = ["streak"] as const;

const ZERO_STREAK: Streak = {
  streakCount: 0n,
  streakFreezeCount: 0n,
  lastActiveDate: 0n,
};

export interface UseStreak {
  streak: Streak;
  streakCount: bigint;
  streakFreezeCount: bigint;
  lastActiveDate: bigint;
  isLoading: boolean;
  isFetching: boolean;
  /** True when the user has an active streak (count > 0). */
  hasActiveStreak: boolean;
}

export function useStreak(): UseStreak {
  const { actor, isFetching } = useBackend();

  const query = useQuery({
    queryKey: STREAK_QUERY_KEY,
    queryFn: async (): Promise<Streak> => {
      if (!actor) return ZERO_STREAK;
      return actor.getStreak();
    },
    enabled: !isFetching,
  });

  const streak = query.data ?? ZERO_STREAK;

  return {
    streak,
    streakCount: streak.streakCount,
    streakFreezeCount: streak.streakFreezeCount,
    lastActiveDate: streak.lastActiveDate,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasActiveStreak: streak.streakCount > 0n,
  };
}
