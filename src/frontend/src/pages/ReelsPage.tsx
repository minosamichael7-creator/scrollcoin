/**
 * ReelsPage — vertical full-viewport short-video-style scroll feed.
 *
 * Mirrors FeedPage's pagination + coin-milestone pattern but renders a
 * TikTok-style snap-scrolling column of 9:16 reel cards. Each card fills the
 * viewport (h-[100dvh]) with the poster image as a background, a bottom
 * gradient overlay for text readability, the reel title, the creator handle
 * parsed from the body (which contains "@creatorname"), a local-state like
 * button, and a top pill tracking progress toward the next coin milestone.
 *
 * Reels are fetched via `useFeedContent` with `category="reels"`. Infinite
 * scroll loads the next page (PAGE_SIZE=5) as the user approaches the bottom.
 * Every 5 reels scrolled triggers `useRecordScrollMilestone` (signed-in users
 * only) and fires the `CoinAnimation` popup, identical to FeedPage.
 *
 * `ReelsPageRow` mounts each page's `useFeedContent` query at the top level
 * of a child component (one per requested page offset) to satisfy the Rules
 * of Hooks; it reports its query state up to the parent and renders nothing
 * visible itself.
 */
import CoinAnimation from "@/components/CoinAnimation";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useFeedContent, useRecordScrollMilestone } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FeedContent } from "@/types/rewards";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 5n;
const MILESTONE_EVERY = 5n;

/** A stable session id for grouping this reels scroll session's milestones. */
function useSessionId(): bigint {
  const ref = useRef<bigint>(0n);
  if (ref.current === 0n) {
    ref.current = BigInt(Date.now());
  }
  return ref.current;
}

/**
 * Parse the creator handle from a reel body. Reel bodies contain an
 * "@creatorname" token; we extract the first one (stripped of leading "@")
 * and fall back to "creator" when none is present.
 */
function parseCreator(body: string): string {
  const match = body.match(/@([A-Za-z0-9_.]+)/);
  return match ? match[1] : "creator";
}

export function ReelsPage() {
  const { isSignedIn } = useAuth();
  const { refresh: refreshCoins } = useCoins();
  const sessionId = useSessionId();

  // Infinite-scroll pagination: we fetch pages on demand and accumulate.
  const [pages, setPages] = useState<bigint[]>([0n]);
  const [hasMore, setHasMore] = useState(true);
  const [lastAward, setLastAward] = useState<{
    amount: bigint;
    milestone: bigint;
  } | null>(null);

  const recordMilestone = useRecordScrollMilestone();

  // Track the highest milestone reached so we only fire each once.
  const reachedMilestoneRef = useRef<bigint>(0n);

  // Sentinel observer for infinite scroll.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  // Track scroll depth: when the number of viewed reels crosses a multiple of
  // MILESTONE_EVERY, record the milestone (signed-in users only).
  const viewedCountRef = useRef(0);

  // Fetch every requested page in parallel. Each page query is keyed by its
  // offset, so adding a new offset to `pages` triggers a new fetch. The
  // useFeedContent hook is called at the top level of a child ReelsPageRow
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
      { rootMargin: "600px 0px 0px 0px" },
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
      // viewedIndex is 0-based; the count of viewed reels is viewedIndex + 1.
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

  // Observe each reel card to count it as "viewed" when it scrolls into view.
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
      // A reel is "viewed" when it dominates the viewport.
      { threshold: 0.6 },
    );
    for (const node of cardRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [checkMilestone]);

  // Progress toward the next milestone, for the top pill indicator.
  const viewedCount = viewedCountRef.current;
  const reelsIntoCurrentMilestone = viewedCount % Number(MILESTONE_EVERY);
  const reelsToNext = Number(MILESTONE_EVERY) - reelsIntoCurrentMilestone;

  return (
    <div
      data-ocid="page.reels"
      className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden bg-black"
    >
      {/* Coin milestone progress pill — top center, above the snap column. */}
      <div
        data-ocid="reels.milestone_pill"
        className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-4"
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60",
            "bg-background/80 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md",
            "text-[color:var(--reel)]",
          )}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--reel)] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--reel)]" />
          </span>
          Next: {reelsToNext}/{Number(MILESTONE_EVERY)} reels
        </span>
      </div>

      {/* Vertical snap-scrolling column of full-viewport reel cards. */}
      <div className="reel-snap h-full w-full overflow-y-auto">
        {/* Mount one ReelsPageRow per requested page so useFeedContent runs at
            the top level of a child component (Rules of Hooks). Rows report
            their data/loading state up via reportPage and render nothing
            visible themselves. */}
        {pages.map((offset) => (
          <ReelsPageRow
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
            <ReelCard item={item} index={i + 1} />
          </div>
        ))}

        {/* Loading skeletons for the first page. */}
        {anyPageLoading && items.length === 0 && <ReelsSkeletons />}

        {/* Sentinel + load-more indicator. */}
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
        {anyPageFetching && items.length > 0 && (
          <div
            data-ocid="reels.loading_more"
            className="flex h-16 items-center justify-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Loading more…
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div
            data-ocid="reels.end"
            className="flex h-24 items-center justify-center px-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            You've reached the end · keep scrolling tomorrow for more coins
          </div>
        )}
      </div>

      <CoinAnimation
        amount={lastAward?.amount ?? null}
        milestone={lastAward?.milestone ?? null}
        onDismiss={() => setLastAward(null)}
      />
    </div>
  );
}

/**
 * ReelsPageRow — mounts a single page's `useFeedContent` query at the top
 * level of a child component (one per requested page offset) and reports the
 * query state up to the parent. Renders nothing visible; the parent
 * accumulates the reported data into the `items` list and renders the reel
 * cards.
 *
 * Extracting this component keeps the `useFeedContent` hook call at the top
 * level of a component instead of inside `pages.map()`, satisfying the
 * Rules of Hooks / `useHookAtTopLevel` lint rule.
 */
function ReelsPageRow({
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
  const query = useFeedContent(offset, pageSize, "reels");
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
 * ReelCard — a single full-viewport reel in the snap-scrolling column.
 *
 * Renders the 9:16 poster image as a background covering the full card, a
 * bottom gradient overlay for text readability, the reel title, the creator
 * handle (parsed from the body's "@creatorname" token), and a like button
 * with local-only state (no backend persistence). The card is a
 * `reel-snap-item` so the snap container locks to it during scroll.
 */
function ReelCard({ item, index }: { item: FeedContent; index: number }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => {
    // Derive a stable-ish base like count from the reel id so the count feels
    // real without backend persistence. Local likes add on top.
    const base = Number(item.id % 999n) + 17;
    return base;
  });

  const creator = parseCreator(item.body);

  const handleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((count) => (next ? count + 1 : count - 1));
      return next;
    });
  }, []);

  return (
    <article
      data-ocid={`reels.card.${index}`}
      className="reel-snap-item relative h-[100dvh] w-full overflow-hidden bg-black"
    >
      {/* 9:16 poster image as background, centered and covering. */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center gradient-reel">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-[color:var(--reel-foreground)]">
            Reel
          </span>
        </div>
      )}

      {/* Bottom gradient overlay for text readability. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/55 to-transparent"
      />

      {/* Right-side action rail: like button. */}
      <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-1">
        <button
          type="button"
          data-ocid={`reels.card.${index}.like`}
          aria-pressed={liked}
          aria-label={liked ? "Unlike reel" : "Like reel"}
          onClick={handleLike}
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-full",
            "border border-white/15 bg-black/40 backdrop-blur-md",
            "transition-bounce hover:bg-black/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Heart
            className={cn(
              "h-6 w-6 transition-smooth",
              liked ? "fill-primary text-primary" : "text-white",
            )}
            strokeWidth={2.5}
          />
        </button>
        <span className="text-xs font-semibold tabular-nums text-white">
          {new Intl.NumberFormat("en-US").format(likeCount)}
        </span>
      </div>

      {/* Bottom-left text overlay: creator handle + title. */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-8 pr-20">
        <p className="font-display text-sm font-bold text-white">@{creator}</p>
        <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-white drop-shadow-md">
          {item.title}
        </h2>
        {item.body && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/85">
            {item.body}
          </p>
        )}
      </div>
    </article>
  );
}

/** Full-viewport loading skeletons for the first reels page. */
function ReelsSkeletons() {
  return (
    <div
      data-ocid="reels.loading_state"
      className="flex h-[100dvh] w-full items-center justify-center"
      aria-label="Loading reels"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/15" />
        <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Loading reels…
        </div>
      </div>
    </div>
  );
}

export default ReelsPage;
