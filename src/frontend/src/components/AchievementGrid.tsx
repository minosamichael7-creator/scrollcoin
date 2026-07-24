import { cn } from "@/lib/utils";
/**
 * AchievementGrid — grid of achievement badges showing unlocked and locked
 * milestones.
 *
 * Unlocked badges render in full color with a gold ring and a checkmark.
 * Locked badges are desaturated (grayscale) with the threshold shown so users
 * know exactly how far away the next reward is. The grid is mobile-first:
 * two columns on small screens, three on wider ones within the max-w-md shell.
 */
import type { Achievement, UserProfile } from "@/types/rewards";
import { Check, Lock } from "lucide-react";

/** Format a bigint threshold with locale grouping. */
function formatThreshold(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

/** Determine whether an achievement is unlocked for a profile. */
function isUnlocked(
  achievement: Achievement,
  profile: UserProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return profile.achievements.some((id) => id === achievement.id);
}

export interface AchievementGridProps {
  /** All achievement definitions from the backend. */
  achievements: Achievement[] | undefined;
  /** The signed-in user's profile (used to determine unlocked state). */
  profile: UserProfile | null | undefined;
  /** True while the achievements query is loading. */
  isLoading?: boolean;
}

export function AchievementGrid({
  achievements,
  profile,
  isLoading,
}: AchievementGridProps) {
  if (isLoading) {
    return (
      <section data-ocid="achievements" className="space-y-3">
        <h2 className="font-display text-base font-bold text-foreground">
          Achievements
        </h2>
        <div
          data-ocid="achievements.loading_state"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          aria-label="Loading achievements"
        >
          {[
            "achievement-skeleton-0",
            "achievement-skeleton-1",
            "achievement-skeleton-2",
            "achievement-skeleton-3",
            "achievement-skeleton-4",
            "achievement-skeleton-5",
          ].map((skeletonKey) => (
            <div
              key={skeletonKey}
              className="h-32 animate-pulse rounded-2xl border border-border bg-muted/50"
            />
          ))}
        </div>
      </section>
    );
  }

  const list = achievements ?? [];
  const unlockedCount = list.filter((a) => isUnlocked(a, profile)).length;

  if (list.length === 0) {
    return (
      <section data-ocid="achievements" className="space-y-3">
        <h2 className="font-display text-base font-bold text-foreground">
          Achievements
        </h2>
        <div
          data-ocid="achievements.empty_state"
          className="rounded-2xl border border-border bg-card p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            No achievements available yet. Keep earning to unlock milestones.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-ocid="achievements" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-foreground">
          Achievements
        </h2>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-primary">
          {unlockedCount}/{list.length}
        </span>
      </div>

      <ul
        data-ocid="achievements.grid"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {list.map((achievement, index) => {
          const unlocked = isUnlocked(achievement, profile);
          return (
            <li
              key={achievement.id.toString()}
              data-ocid={`achievements.item.${index + 1}`}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center",
                "transition-smooth",
                unlocked
                  ? "border-primary/40 bg-primary/5 shadow-coin"
                  : "border-border bg-card",
              )}
              aria-label={`${achievement.title}: ${unlocked ? "unlocked" : "locked"}`}
            >
              {/* Badge icon */}
              <div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-full border-2",
                  unlocked
                    ? "border-primary bg-primary/15"
                    : "border-border bg-muted grayscale",
                )}
              >
                <span
                  className={cn(
                    "text-2xl leading-none",
                    unlocked ? "" : "opacity-50",
                  )}
                  aria-hidden
                >
                  {achievement.icon || "🏆"}
                </span>
                {unlocked && (
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center",
                      "rounded-full border-2 border-card bg-primary text-primary-foreground",
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                {!unlocked && (
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center",
                      "rounded-full border-2 border-card bg-muted text-muted-foreground",
                    )}
                  >
                    <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </span>
                )}
              </div>

              {/* Title + description */}
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate font-display text-xs font-semibold",
                    unlocked ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {achievement.title}
                </p>
                <p
                  className={cn(
                    "mt-0.5 line-clamp-2 text-[10px] leading-tight",
                    unlocked
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70",
                  )}
                >
                  {achievement.description}
                </p>
              </div>

              {/* Threshold / status footer */}
              <div className="mt-auto w-full">
                {unlocked ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full",
                      "bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success",
                    )}
                  >
                    Unlocked
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full",
                      "bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground",
                    )}
                  >
                    {formatThreshold(achievement.unlockedThreshold)} coins
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default AchievementGrid;
