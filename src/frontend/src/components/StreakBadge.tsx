/**
 * StreakBadge — daily streak counter with flame icon and freeze indicator.
 *
 * Shows the current streak count next to a flame icon, plus a small freeze
 * count chip when the user holds streak freezes. An active streak (count > 0)
 * gets the coral accent and a gentle pulse; a zero streak renders a muted
 * shell so the layout never collapses. The freeze chip uses the gold accent
 * so it reads as a premium safety-net, not a warning.
 */
import { cn } from "@/lib/utils";
import { Flame, Snowflake } from "lucide-react";

export interface StreakBadgeProps {
  /** Current consecutive-day streak count. */
  streakCount: bigint;
  /** Number of streak freezes the user holds. */
  streakFreezeCount: bigint;
  /** Deterministic test marker root. */
  ocid?: string;
  /** Render a muted skeleton while loading. */
  isLoading?: boolean;
}

export function StreakBadge({
  streakCount,
  streakFreezeCount,
  ocid = "streak_badge",
  isLoading = false,
}: StreakBadgeProps) {
  const count = Number(streakCount);
  const freezes = Number(streakFreezeCount);
  const hasStreak = count > 0;
  const hasFreezes = freezes > 0;

  return (
    <div
      data-ocid={ocid}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border p-4",
        "transition-smooth",
        hasStreak
          ? "border-accent/30 bg-accent/10 shadow-subtle"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
            hasStreak
              ? "border-accent/30 bg-accent/15 text-accent animate-streak-pulse"
              : "border-border bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          <Flame className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Daily streak
          </p>
          {isLoading ? (
            <p className="font-mono text-2xl font-bold leading-none text-muted-foreground">
              —
            </p>
          ) : (
            <p
              className={cn(
                "font-mono text-2xl font-bold leading-none tabular-nums",
                hasStreak ? "text-accent" : "text-foreground",
              )}
            >
              {count}
              <span className="ml-1 text-sm font-semibold text-muted-foreground">
                {count === 1 ? "day" : "days"}
              </span>
            </p>
          )}
        </div>
      </div>

      <div
        data-ocid={`${ocid}.freeze`}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5",
          "transition-smooth",
          hasFreezes
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground",
        )}
        title={
          hasFreezes
            ? `${freezes} streak freeze${freezes === 1 ? "" : "s"} available`
            : "No streak freezes"
        }
      >
        <Snowflake className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        <span className="font-mono text-xs font-bold tabular-nums">
          {isLoading ? "—" : freezes}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          freeze{freezes === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export default StreakBadge;
