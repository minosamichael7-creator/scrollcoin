/**
 * FinancePage — the dedicated finance news feed.
 *
 * Mirrors the FeedPage's endless-scroll behavior but narrows the content to
 * the `finance` category only (crypto + forex market news). Reuses the same
 * infinite-scroll pagination (PAGE_SIZE=5), milestone tracking every 5 cards
 * via `recordScrollMilestone`, the `CoinAnimation` popup, the guest preview
 * overlay, the expandable card detail view, and the per-page `FinancePageRow`
 * child (one per requested page) to satisfy the Rules of Hooks.
 *
 * Unlike FeedPage, this page always shows finance content, so there are no
 * category filter chips. The `DailyGoalBar` still tracks coin progress and
 * the same `FeedCard` component renders the finance badge with crypto/forex
 * sub-type cues.
 */
import CoinAnimation from "@/components/CoinAnimation";
import DailyGoalBar from "@/components/DailyGoalBar";
import FeedCard from "@/components/FeedCard";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useFeedContent, useRecordScrollMilestone } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FeedContent } from "@/types/rewards";
import { LineChart, LogIn, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 5n;
const MILESTONE_EVERY = 5n;
/** This page always filters to the finance category. */
const CATEGORY = "finance";

/** A stable session id for grouping this feed scroll session's milestones. */
function useSessionId(): bigint {
  const ref = useRef<bigint>(0n);
  if (ref.current === 0n) {
    ref.current = BigInt(Date.now());
  }
  return ref.current;
}

export function FinancePage() {
  const { isSignedIn, signIn, isLoggingIn } = useAuth();
  const { refresh: refreshCoins } = useCoins();
  const sessionId = useSessionId();

  // Infinite-scroll pagination: we fetch pages on demand and accumulate.
  const [pages, setPages] = useState<bigint[]>([0n]);
  const [hasMore, setHasMore] = useState(true);
  const [lastAward, setLastAward] = useState<{
    amount: bigint;
    milestone: bigint;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);

  const recordMilestone = useRecordScrollMilestone();

  // Track the highest milestone reached so we only fire each once.
  const reachedMilestoneRef = useRef<bigint>(0n);

  // Sentinel observer for infinite scroll.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  // Track scroll depth: when the number of viewed cards crosses a multiple
  // of MILESTONE_EVERY, record the milestone (signed-in users only).
  const viewedCountRef = useRef(0);

  // Fetch every requested page in parallel. Each page query is keyed by its
  // offset, so adding a new offset to `pages` triggers a new fetch. The
  // useFeedContent hook is called at the top level of a child FinancePageRow
  // component (one per page) to satisfy the Rules of Hooks.
  const [pageData, setPageData] = useState<
    Record<
      string,
      { data?: FeedContent[]; isLoading: boolean; isFetching: boolean }
    >
  >({});

  const reportPage = useCallback(
    (
      offset: bigint,
      data: { data?: FeedContent[]; isLoading: boolean; isFetching: boolean },
    ) => {
      setPageData((prev) => {
        const key = offset.toString();
        const existing = prev[key];
        if (
          existing &&
          existing.isLoading === data.isLoading &&
          existing.isFetching === data.isFetching &&
          existing.data === data.data
        ) {
          return prev;
        }
        return { ...prev, [key]: data };
      });
    },
    [],
  );

  const items = useMemo(() => {
    const all: FeedContent[] = [];
    for (const offset of pages) {
      const entry = pageData[offset.toString()];
      if (entry?.data) all.push(...entry.data);
    }
    return all;
  }, [pages, pageData]);

  const anyPageLoading = pages.some(
    (offset) => pageData[offset.toString()]?.isLoading,
  );
  const anyPageFetching = pages.some(
    (offset) => pageData[offset.toString()]?.isFetching,
  );

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore || anyPageFetching) return;
    loadingMoreRef.current = true;
    setPages((prev) => {
      const nextOffset = prev[prev.length - 1] + PAGE_SIZE;
      if (prev.includes(nextOffset)) return prev;
      return [...prev, nextOffset];
    });
  }, [hasMore, anyPageFetching]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) loadMore();
        }
      },
      { rootMargin: "400px 0px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  // When a new page resolves, decide whether there is more to load.
  useEffect(() => {
    loadingMoreRef.current = false;
    const lastOffset = pages[pages.length - 1];
    const lastEntry =
      lastOffset !== undefined ? pageData[lastOffset.toString()] : undefined;
    if (lastEntry?.data) {
      setHasMore(lastEntry.data.length === Number(PAGE_SIZE));
    }
  }, [pages, pageData]);

  const checkMilestone = useCallback(
    (viewedIndex: number) => {
      // viewedIndex is 0-based; the count of viewed cards is viewedIndex + 1.
      const viewed = viewedIndex + 1;
      const milestone = BigInt(
        Math.floor(viewed / Number(MILESTONE_EVERY)) * Number(MILESTONE_EVERY),
      );
      if (milestone <= reachedMilestoneRef.current || milestone === 0n) return;
      if (!isSignedIn) return;

      reachedMilestoneRef.current = milestone;
      recordMilestone.mutate(
        { sessionId, milestone },
        {
          onSuccess: (result) => {
            if (result.__kind__ === "ok") {
              setLastAward({
                amount: result.ok.amount,
                milestone,
              });
              refreshCoins();
            }
          },
        },
      );
    },
    [isSignedIn, recordMilestone, sessionId, refreshCoins],
  );

  // Observe each card to count it as "viewed" when it scrolls into view.
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.idx ?? "-1");
          if (idx < 0) continue;
          if (idx + 1 > viewedCountRef.current) {
            viewedCountRef.current = idx + 1;
            checkMilestone(idx);
          }
        }
      },
      { threshold: 0.6 },
    );
    for (const node of cardRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [checkMilestone]);

  const expanded = useMemo(
    () => items.find((i) => i.id === expandedId) ?? null,
    [items, expandedId],
  );

  const handleExpand = useCallback((item: FeedContent) => {
    setExpandedId(item.id);
  }, []);

  return (
    <div data-ocid="page.finance" className="flex flex-col gap-3 pb-4">
      <DailyGoalBar />

      <FinanceHeader />

      {/* Guest preview banner — only when not signed in. */}
      {!isSignedIn && (
        <GuestPreview isLoggingIn={isLoggingIn} onSignIn={signIn} />
      )}

      {/* Expanded detail view takes over the feed area. */}
      {expanded ? (
        <FinanceDetail item={expanded} onClose={() => setExpandedId(null)} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Mount one FinancePageRow per requested page so useFeedContent runs
              at the top level of a child component (Rules of Hooks). Rows
              report their data/loading state up via reportPage and render
              nothing visible themselves. */}
          {pages.map((offset) => (
            <FinancePageRow
              key={offset.toString()}
              offset={offset}
              pageSize={PAGE_SIZE}
              onReport={reportPage}
            />
          ))}

          {items.map((item, i) => (
            <div
              key={item.id.toString()}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              data-idx={i}
            >
              <FeedCard item={item} index={i + 1} onExpand={handleExpand} />
            </div>
          ))}

          {/* Loading skeletons for the first page. */}
          {anyPageLoading && items.length === 0 && <FinanceSkeletons />}

          {/* Sentinel + load-more indicator. */}
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
          {anyPageFetching && items.length > 0 && (
            <div
              data-ocid="finance.loading_more"
              className="flex items-center justify-center py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Loading more…
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div
              data-ocid="finance.end"
              className="py-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              You've reached the end · keep scrolling tomorrow for more coins
            </div>
          )}
        </div>
      )}

      <CoinAnimation
        amount={lastAward?.amount ?? null}
        milestone={lastAward?.milestone ?? null}
        onDismiss={() => setLastAward(null)}
      />
    </div>
  );
}

/**
 * FinancePageRow — mounts a single page's `useFeedContent` query at the top
 * level of a child component (one per requested page offset) and reports the
 * query state up to the parent. Renders nothing visible; the parent
 * accumulates the reported data into the `items` list and renders the cards.
 *
 * The category is hardcoded to "finance" so the backend narrows the slice to
 * finance content (crypto + forex) only.
 */
function FinancePageRow({
  offset,
  pageSize,
  onReport,
}: {
  offset: bigint;
  pageSize: bigint;
  onReport: (
    offset: bigint,
    data: { data?: FeedContent[]; isLoading: boolean; isFetching: boolean },
  ) => void;
}) {
  const query = useFeedContent(offset, pageSize, CATEGORY);
  useEffect(() => {
    onReport(offset, {
      data: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
    });
  }, [offset, onReport, query.data, query.isLoading, query.isFetching]);
  return null;
}

/**
 * FinanceHeader — a compact page header distinguishing the finance feed from
 * the main feed. Uses the gold primary accent and the LineChart icon to
 * signal the crypto + forex market focus.
 */
function FinanceHeader() {
  return (
    <header
      data-ocid="finance.header"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-primary/30",
        "bg-primary/10 px-4 py-3",
      )}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <LineChart className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-lg font-bold leading-tight text-foreground">
          Finance News
        </h1>
        <p className="text-xs text-muted-foreground">
          Crypto & forex market news · earn coins as you scroll
        </p>
      </div>
    </header>
  );
}

/** Guest-mode preview banner prompting sign-in to start earning. */
function GuestPreview({
  isLoggingIn,
  onSignIn,
}: {
  isLoggingIn: boolean;
  onSignIn: () => void;
}) {
  return (
    <output
      data-ocid="finance.guest_preview"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-primary/30",
        "bg-primary/10 px-3.5 py-3",
      )}
    >
      <LogIn className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Preview mode.</span>{" "}
        Sign in to earn coins as you scroll.
      </p>
      <button
        type="button"
        data-ocid="finance.guest_preview.sign_in"
        onClick={onSignIn}
        disabled={isLoggingIn}
        className={cn(
          "shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground",
          "transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50",
        )}
      >
        {isLoggingIn ? "Signing in…" : "Sign in"}
      </button>
    </output>
  );
}

/** Expanded detail view for a single finance card. */
function FinanceDetail({
  item,
  onClose,
}: {
  item: FeedContent;
  onClose: () => void;
}) {
  return (
    <article
      data-ocid="finance.detail"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <button
          type="button"
          data-ocid="finance.detail.close"
          aria-label="Close detail view"
          onClick={onClose}
          className={cn(
            "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full",
            "border border-border/60 bg-background/80 text-foreground backdrop-blur-md",
            "transition-smooth hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur-md">
          {item.category}
        </span>
      </div>
      <div className="p-4">
        <h2 className="font-display text-xl font-bold leading-tight text-foreground">
          {item.title}
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {item.body}
        </p>
      </div>
    </article>
  );
}

/** Layout-matched loading skeletons for the first finance page. */
function FinanceSkeletons() {
  return (
    <div
      data-ocid="finance.loading_state"
      className="flex flex-col gap-3"
      aria-label="Loading finance feed"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
          <div className="p-3.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FinancePage;
