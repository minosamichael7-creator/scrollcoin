import { cn } from "@/lib/utils";
/**
 * EarningsHistoryList — timestamped coin award entries.
 *
 * Renders the signed-in user's earnings history as a vertical list of
 * timestamped rows: reason, amount (gold, with coin icon), and a relative
 * "time ago" label. Loading shows layout-matched skeletons; an empty
 * history shows a helpful empty state with a clear next step (open the
 * feed to start earning). Each row is indexed for deterministic testing.
 */
import type { CoinAward } from "@/types/rewards";
import { Coins, Sparkles } from "lucide-react";

export interface EarningsHistoryListProps {
  /** Coin awards, newest first (backend order). */
  awards: CoinAward[];
  /** True while the query is loading and no data is cached. */
  isLoading?: boolean;
  /** Deterministic test marker root. */
  ocid?: string;
}

/** Format a bigint coin amount with grouping. */
function formatAmount(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

/** Format a nanosecond timestamp as a relative "time ago" string. */
function timeAgo(timestampNs: bigint): string {
  const ns = Number(timestampNs);
  if (!ns || ns <= 0) return "just now";
  const ms = ns / 1_000_000;
  const diffMs = Date.now() - ms;
  if (diffMs < 0) return "just now";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <li
      data-ocid={`earnings_history.item.${index}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
      aria-hidden="true"
    >
      <span className="h-8 w-8 shrink-0 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <span className="block h-3 w-2/3 rounded bg-muted" />
        <span className="block h-2.5 w-1/4 rounded bg-muted/70" />
      </div>
      <span className="h-4 w-12 rounded bg-muted" />
    </li>
  );
}

function EmptyState({ ocid }: { ocid: string }) {
  return (
    <li
      data-ocid={`${ocid}.empty_state`}
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <div className="space-y-1">
        <p className="font-display text-sm font-bold text-foreground">
          No earnings yet
        </p>
        <p className="text-xs text-muted-foreground">
          Open the feed and scroll to start earning coins. Every milestone
          awards coins straight to your wallet.
        </p>
      </div>
    </li>
  );
}

export function EarningsHistoryList({
  awards,
  isLoading = false,
  ocid = "earnings_history",
}: EarningsHistoryListProps) {
  if (isLoading) {
    return (
      <ul data-ocid={ocid} className="flex flex-col gap-2">
        {[
          "earnings-skeleton-0",
          "earnings-skeleton-1",
          "earnings-skeleton-2",
          "earnings-skeleton-3",
        ].map((skeletonKey, i) => (
          <SkeletonRow key={skeletonKey} index={i} />
        ))}
      </ul>
    );
  }

  if (awards.length === 0) {
    return (
      <ul data-ocid={ocid} className="flex flex-col gap-2">
        <EmptyState ocid={ocid} />
      </ul>
    );
  }

  return (
    <ul data-ocid={ocid} className="flex flex-col gap-2">
      {awards.map((award, index) => (
        <li
          key={award.id.toString()}
          data-ocid={`${ocid}.item.${index + 1}`}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3",
            "transition-smooth hover:border-primary/30",
          )}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
            aria-hidden="true"
          >
            <Coins className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {award.reason}
            </p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(award.timestamp)}
            </p>
          </div>
          <span
            className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary"
            aria-label={`Awarded ${formatAmount(award.amount)} coins`}
          >
            +{formatAmount(award.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default EarningsHistoryList;
