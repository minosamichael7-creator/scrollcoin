/**
 * FeedPage — the endless reward feed.
 *
 * Mobile-first vertical scroll of curated content cards fetched through
 * `getFeedContent` with infinite-scroll pagination. Every 5 cards viewed
 * triggers a scroll milestone via `recordScrollMilestone`, which awards coins
 * and fires the `CoinAnimation` popup. A sticky `DailyGoalBar` at the top
 * fills as coins are earned. Cards expand into an in-place detail view.
 *
 * Guests (not signed in) see a preview of the first page with a sign-in
 * prompt overlay; milestones are only recorded for signed-in users.
 */
import CoinAnimation from "@/components/CoinAnimation";
import DailyGoalBar from "@/components/DailyGoalBar";
import FeedCard from "@/components/FeedCard";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useFeedContent, useRecordScrollMilestone } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FeedContent } from "@/types/rewards";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  Film,
  LineChart,
  LogIn,
  Package,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 5n;
const MILESTONE_EVERY = 5n;

/**
 * Category filter chips shown above the feed. "All" returns unfiltered
 * content; the rest map 1:1 to backend `FeedContent.category` values. The
 * finance chip is surfaced explicitly (per the finance-news requirement) and
 * shares the same backend category as the dedicated Finance tab, so filtering
 * to Finance here shows the same items.
 */
type CategoryChip = {
  value: string;
  label: string;
  icon: typeof LineChart;
};

const CATEGORY_CHIPS: CategoryChip[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "finance", label: "Finance", icon: LineChart },
  { value: "reels", label: "Reels", icon: Film },
  { value: "shop", label: "Shop", icon: Package },
  { value: "ainews", label: "AI News", icon: Bot },
  { value: "learn", label: "Learn", icon: BookOpen },
  { value: "self-improvement", label: "Self-Improvement", icon: Sparkles },
  { value: "fun-facts", label: "Fun Facts", icon: Sparkles },
  { value: "productivity", label: "Productivity", icon: Sparkles },
  { value: "wellness", label: "Wellness", icon: Sparkles },
  { value: "nature", label: "Nature", icon: Sparkles },
  { value: "psychology", label: "Psychology", icon: Sparkles },
  { value: "learning", label: "Learning", icon: Sparkles },
];

const VALID_CATEGORIES = new Set(CATEGORY_CHIPS.map((c) => c.value));

/** Normalize a raw URL search value into a known category or "all". */
function normalizeCategory(raw: unknown): string {
  if (typeof raw === "string" && VALID_CATEGORIES.has(raw)) return raw;
  return "all";
}

/** A stable session id for grouping this feed scroll session's milestones. */
function useSessionId(): bigint {
  const ref = useRef<bigint>(0n);
  if (ref.current === 0n) {
    ref.current = BigInt(Date.now());
  }
  return ref.current;
}

export function FeedPage() {
  const { isSignedIn, signIn, isLoggingIn } = useAuth();
  const { refresh: refreshCoins } = useCoins();
  const sessionId = useSessionId();

  // Category filter persisted in the URL hash (#/?category=finance) so it
  // survives refresh and can be shared. `strict: false` reads the full
  // search object without requiring route-level validateSearch.
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const category = normalizeCategory(search.category);

  const setCategory = useCallback(
    (next: string) => {
      navigate({
        to: "/",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          category: next === "all" ? undefined : next,
        }),
      });
    },
    [navigate],
  );

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
  // useFeedContent hook is called at the top level of a child FeedPageRow
  // component (one per page) to satisfy the Rules of Hooks.
  const [pageData, setPageData] = useState<
    Record<
      string,
      { data?: FeedContent[]; isLoading: boolean; isFetching: boolean }
    >
  >({});

  // Reset pagination + scroll tracking whenever the category changes so the
  // feed re-fetches from offset 0 for the new filter and milestones restart.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on category change; body does not read category
  useEffect(() => {
    setPages([0n]);
    setPageData({});
    setHasMore(true);
    setExpandedId(null);
    reachedMilestoneRef.current = 0n;
    viewedCountRef.current = 0;
    loadingMoreRef.current = false;
  }, [category]);

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
    <div data-ocid="page.feed" className="flex flex-col gap-3 pb-4">
      <DailyGoalBar />

      <CategoryFilter value={category} onChange={setCategory} />

      {/* Guest preview banner — only when not signed in. */}
      {!isSignedIn && (
        <GuestPreview isLoggingIn={isLoggingIn} onSignIn={signIn} />
      )}

      {/* Expanded detail view takes over the feed area. */}
      {expanded ? (
        <FeedDetail item={expanded} onClose={() => setExpandedId(null)} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Mount one FeedPageRow per requested page so useFeedContent runs
              at the top level of a child component (Rules of Hooks). Rows
              report their data/loading state up via reportPage and render
              nothing visible themselves. */}
          {pages.map((offset) => (
            <FeedPageRow
              key={offset.toString()}
              offset={offset}
              pageSize={PAGE_SIZE}
              category={category}
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
          {anyPageLoading && items.length === 0 && <FeedSkeletons />}

          {/* Sentinel + load-more indicator. */}
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
          {anyPageFetching && items.length > 0 && (
            <div
              data-ocid="feed.loading_more"
              className="flex items-center justify-center py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Loading more…
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div
              data-ocid="feed.end"
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
 * FeedPageRow — mounts a single page's `useFeedContent` query at the top
 * level of a child component (one per requested page offset) and reports the
 * query state up to the parent. Renders nothing visible; the parent
 * accumulates the reported data into the `items` list and renders the cards.
 *
 * Extracting this component keeps the `useFeedContent` hook call at the top
 * level of a component instead of inside `pages.map()`, satisfying the
 * Rules of Hooks / `useHookAtTopLevel` lint rule.
 */
function FeedPageRow({
  offset,
  pageSize,
  category,
  onReport,
}: {
  offset: bigint;
  pageSize: bigint;
  category: string;
  onReport: (
    offset: bigint,
    data: { data?: FeedContent[]; isLoading: boolean; isFetching: boolean },
  ) => void;
}) {
  const query = useFeedContent(offset, pageSize, category);
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
 * CategoryFilter — sticky horizontal chip row that narrows the feed to a
 * single category. The active chip uses the gold primary surface; inactive
 * chips use the card surface with a border. Selection is owned by the parent
 * (URL-persisted) and reported up via `onChange`.
 */
function CategoryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      data-ocid="feed.filter"
      className={cn(
        "sticky top-0 z-20 -mx-1 flex gap-2 overflow-x-auto px-1 py-2",
        "bg-background/95 backdrop-blur-md",
      )}
    >
      {CATEGORY_CHIPS.map((chip) => {
        const Icon = chip.icon;
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            data-ocid={`feed.filter.chip.${chip.value}`}
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5",
              "text-xs font-semibold transition-smooth",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-subtle"
                : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {chip.label}
          </button>
        );
      })}
    </div>
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
      data-ocid="feed.guest_preview"
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
        data-ocid="feed.guest_preview.sign_in"
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

/** Expanded detail view for a single feed card. */
function FeedDetail({
  item,
  onClose,
}: {
  item: FeedContent;
  onClose: () => void;
}) {
  return (
    <article
      data-ocid="feed.detail"
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
          data-ocid="feed.detail.close"
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

/** Layout-matched loading skeletons for the first feed page. */
function FeedSkeletons() {
  return (
    <div
      data-ocid="feed.loading_state"
      className="flex flex-col gap-3"
      aria-label="Loading feed"
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

export default FeedPage;
