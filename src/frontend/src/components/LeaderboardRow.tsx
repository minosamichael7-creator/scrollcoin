import { cn } from "@/lib/utils";
/**
 * LeaderboardRow — a single ranked entry in the weekly earnings leaderboard.
 *
 * Shows the rank number, username, and weekly earnings. The current user's
 * row is highlighted in gold (primary) with a subtle coin glow and a "You"
 * pill so they can find themselves instantly in a long list. Top-three ranks
 * get a medal-style rank badge; the rest use a plain numeric badge.
 */
import type { LeaderboardEntry } from "@/types/rewards";
import { Coins } from "lucide-react";

/** Format a bigint coin amount with locale grouping. */
function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

/** Convert a 1-based bigint rank to a display number. */
function toDisplayRank(rank: bigint): number {
  return Number(rank);
}

/** Medal styling per top-three rank. */
function rankBadgeClass(displayRank: number): string {
  if (displayRank === 1) {
    return "bg-primary text-primary-foreground shadow-coin border-primary";
  }
  if (displayRank === 2) {
    return "bg-primary/70 text-primary-foreground border-primary/60";
  }
  if (displayRank === 3) {
    return "bg-primary/40 text-primary-foreground border-primary/30";
  }
  return "bg-muted text-muted-foreground border-border";
}

/** Medal glyph for the top three; plain number for the rest. */
function rankLabel(displayRank: number): string {
  if (displayRank === 1) return "1";
  if (displayRank === 2) return "2";
  if (displayRank === 3) return "3";
  return String(displayRank);
}

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  /** True when this row belongs to the signed-in caller. */
  isCurrentUser: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const displayRank = toDisplayRank(entry.rank);
  const isTopThree = displayRank <= 3;

  return (
    <li
      data-ocid={`leaderboard.row.${displayRank}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5",
        "transition-smooth",
        isCurrentUser
          ? "border-primary/50 bg-primary/10 shadow-coin"
          : "border-border bg-card hover:bg-muted/50",
      )}
      aria-current={isCurrentUser ? "true" : undefined}
    >
      {/* Rank badge */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
          "font-display text-sm font-bold tabular-nums",
          rankBadgeClass(displayRank),
        )}
        aria-label={`Rank ${displayRank}`}
      >
        {rankLabel(displayRank)}
      </div>

      {/* Username + You pill */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate font-display text-sm font-semibold",
              isCurrentUser ? "text-primary" : "text-foreground",
            )}
          >
            {entry.username}
          </p>
          {isCurrentUser && (
            <span
              className={cn(
                "shrink-0 rounded-full bg-primary px-2 py-0.5",
                "text-[10px] font-bold uppercase tracking-wider text-primary-foreground",
              )}
            >
              You
            </span>
          )}
        </div>
        {isTopThree && (
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {displayRank === 1
              ? "Top earner this week"
              : displayRank === 2
                ? "Runner-up"
                : "On the podium"}
          </p>
        )}
      </div>

      {/* Weekly earnings */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Coins
          className={cn(
            "h-4 w-4",
            isCurrentUser ? "text-primary" : "text-muted-foreground",
          )}
          strokeWidth={2.5}
        />
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            isCurrentUser ? "text-primary" : "text-foreground",
          )}
        >
          {formatCoins(entry.weeklyEarnings)}
        </span>
      </div>
    </li>
  );
}

export default LeaderboardRow;
