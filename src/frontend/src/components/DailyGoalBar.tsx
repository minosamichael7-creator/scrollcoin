/**
 * DailyGoalBar — sticky daily-coin-earning progress bar.
 *
 * Sits at the top of the feed and fills toward the daily target as coins are
 * earned. The fill uses the gold gradient with a shimmer sweep while the goal
 * is incomplete, and switches to the success green once `completed`. Shows a
 * compact "earned / target" caption and a goal-complete badge.
 *
 * Renders a skeleton while the daily goal is loading and a zeroed bar for
 * guests (no actor) so the layout never shifts.
 */
import { useDailyGoal } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Target } from "lucide-react";

/**
 * Convert the current UTC date to the backend's yyyymmdd `Date` format
 * (year*10000 + month*100 + day). The backend `getDailyGoal` expects this
 * integer, not a nanosecond timestamp.
 */
function todayYyyymmdd(): bigint {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  return BigInt(y * 10000 + m * 100 + d);
}

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export interface DailyGoalBarProps {
  /** Optional className override for layout embedding. */
  className?: string;
}

export function DailyGoalBar({ className }: DailyGoalBarProps) {
  const { data, isLoading } = useDailyGoal(todayYyyymmdd());

  const earned = data?.earnedCoins ?? 0n;
  const target = data?.targetCoins ?? 0n;
  const completed = data?.completed ?? false;

  const pct =
    target > 0n
      ? Math.min(100, Math.round((Number(earned) / Number(target)) * 100))
      : 0;

  return (
    <section
      data-ocid="daily_goal_bar"
      aria-label="Daily earning goal"
      className={cn(
        "sticky top-0 z-30 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur-md",
        "shadow-subtle",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {completed ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-success"
              strokeWidth={2.5}
            />
          ) : (
            <Target
              className="h-4 w-4 shrink-0 text-primary"
              strokeWidth={2.5}
            />
          )}
          <span className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {completed ? "Daily goal complete" : "Daily goal"}
          </span>
        </div>

        <span
          className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            completed ? "text-success" : "text-primary",
          )}
        >
          {isLoading ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <>
              {formatCoins(earned)}
              <span className="text-muted-foreground">
                {" "}
                / {formatCoins(target)}
              </span>
            </>
          )}
        </span>
      </div>

      {/* Track */}
      <div
        className={cn(
          "mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted",
        )}
        role="progressbar"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Daily goal progress"
      >
        <div
          data-ocid="daily_goal_bar.fill"
          className={cn(
            "h-full rounded-full transition-bounce",
            completed
              ? "bg-success"
              : "gradient-primary motion-safe:animate-progress-shimmer",
          )}
          style={{
            width: `${pct}%`,
            backgroundSize: completed ? undefined : "200% 100%",
          }}
        />
      </div>
    </section>
  );
}

export default DailyGoalBar;
