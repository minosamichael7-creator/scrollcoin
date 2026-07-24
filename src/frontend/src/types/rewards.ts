/**
 * Shared reward-domain types mirroring the backend candid bindings.
 *
 * These re-export the generated candid types so page tasks can import a single
 * curated surface (`@/types/rewards`) instead of reaching into `@/backend`.
 * Page tasks should prefer these aliases; the underlying candid shapes are
 * authoritative and never redefined here.
 */
import type {
  Achievement,
  AchievementId,
  AwardResult,
  CoinAward,
  DailyGoal,
  Date_,
  Ebook,
  FeedContent,
  FeedContentType,
  LeaderboardEntry,
  Lesson,
  LessonDifficulty,
  Product,
  ProductRedemption,
  Redemption,
  RedemptionStatus,
  RewardItem,
  RewardsError,
  Timestamp,
  UserId,
  UserProfile,
  UserRole,
} from "@/backend";

export type {
  Achievement,
  AchievementId,
  AwardResult,
  CoinAward,
  DailyGoal,
  Date_,
  Ebook,
  FeedContent,
  FeedContentType,
  LeaderboardEntry,
  Lesson,
  LessonDifficulty,
  Product,
  ProductRedemption,
  Redemption,
  RedemptionStatus,
  RewardItem,
  RewardsError,
  Timestamp,
  UserId,
  UserProfile,
  UserRole,
};

/** Wallet snapshot returned by `getWallet`. */
export interface Wallet {
  totalCoins: bigint;
  lifetimeEarnings: bigint;
  todayEarnings: bigint;
}

/** Streak snapshot returned by `getStreak`. */
export interface Streak {
  streakCount: bigint;
  streakFreezeCount: bigint;
  lastActiveDate: Date_;
}

/** Convenience: a leaderboard row with a derived display rank. */
export interface RankedLeaderboardEntry extends LeaderboardEntry {
  /** 1-based display rank derived from `rank` bigint. */
  displayRank: number;
}
