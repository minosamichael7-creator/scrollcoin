/**
 * AINewsPage — the dedicated AI-industry news feed.
 *
 * Mirrors the FeedPage's endless-scroll behavior but narrows the content to
 * the `ainews` category only (curated AI-industry news cards). Reuses the
 * same infinite-scroll pagination (PAGE_SIZE=5), milestone tracking every 5
 * cards via `recordScrollMilestone`, the `CoinAnimation` popup, the guest
 * preview overlay, the expandable card detail view, and the per-page
 * `AINewsPageRow` child (one per requested page) to satisfy the Rules of
 * Hooks.
 *
 * Unlike FeedPage, this page always shows AI news content, so there are no
 * category filter chips. The `DailyGoalBar` still tracks coin progress and
 * the same `FeedCard` component renders the ainews badge (Bot icon with the
 * sky-blue ainews tint).
 *
 * AI news bodies follow the convention `"<source> - <read-time>"` followed
 * by the article snippet. The source (before the ` - ` separator) and the
 * read-time estimate (after the separator) are parsed out and surfaced as a
 * source badge and read-time chip on each card and in the detail view. The
 * detail view also lists related AI news cards (other items from the same
 * feed) so readers can keep exploring.
 */
import CoinAnimation from "@/components/CoinAnimation";
import DailyGoalBar from "@/components/DailyGoalBar";
import FeedCard from "@/components/FeedCard";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useFeedContent, useRecordScrollMilestone } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FeedContent } from "@/types/rewards";
import { ArrowUpRight, Bot, Clock, LogIn, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 5n;
const MILESTONE_EVERY = 5n;
/** This page always filters to the ainews category. */
const CATEGORY = "ainews";

/** A stable session id for grouping this feed scroll session's milestones. */
function useSessionId(): bigint {
  const ref = useRef<bigint>(0n);
  if (ref.current === 0n) {
    ref.current = BigInt(Date.now());
  }
  return ref.current;
}

/**
 * Parse the source name from an AI news body. The source is the text before
 * the first ` - ` separator (e.g. "TechCrunch - 3 min read" → "TechCrunch").
 * Falls back to "AI News" when no separator is present.
 */
function parseSource(body: string): string {
  const sep = body.indexOf(" - ");
  if (sep === -1) return "AI News";
  return body.slice(0, sep).trim() || "AI News";
}

/**
 * Parse the read-time estimate from an AI news body. The read-time is the
 * text after the first ` - ` separator up to the end of that line (e.g.
 * "TechCrunch - 3 min read" → "3 min read"). Falls back to "" when absent.
 */
function parseReadTime(body: string): string {
  const sep = body.indexOf(" - ");
  if (sep === -1) return "";
  const after = body.slice(sep + 3);
  // The read-time is the leading run up to the first newline (the snippet
  // follows on subsequent lines or after the same line).
  const newlineIdx = after.indexOf("\n");
  const candidate = (
    newlineIdx === -1 ? after : after.slice(0, newlineIdx)
  ).trim();
  return candidate;
}

/**
 * Parse the article snippet from an AI news body. The snippet is everything
 * after the source/read-time prefix line. If the body has no ` - ` separator
 * the whole body is treated as the snippet.
 */
function parseSnippet(body: string): string {
  const sep = body.indexOf(" - ");
  if (sep === -1) return body.trim();
  const after = body.slice(sep + 3);
  const newlineIdx = after.indexOf("\n");
  if (newlineIdx === -1) return "";
  return after.slice(newlineIdx + 1).trim();
}

export function AINewsPage() {
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
  // useFeedContent hook is called at the top level of a child AINewsPageRow
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

  // Related AI news: other items from the same feed, excluding the expanded
  // card, capped at 4 for the detail view's "related" rail.
  const related = useMemo(() => {
    if (!expanded) return [];
    return items.filter((i) => i.id !== expanded.id).slice(0, 4);
  }, [items, expanded]);

  const handleExpand = useCallback((item: FeedContent) => {
    setExpandedId(item.id);
  }, []);

  return (
    <div data-ocid="page.ainews" className="flex flex-col gap-3 pb-4">
      <DailyGoalBar />

      <AINewsHeader />

      {/* Guest preview banner — only when not signed in. */}
      {!isSignedIn && (
        <GuestPreview isLoggingIn={isLoggingIn} onSignIn={signIn} />
      )}

      {/* Expanded detail view takes over the feed area. */}
      {expanded ? (
        <AINewsDetail
          item={expanded}
          related={related}
          onClose={() => setExpandedId(null)}
          onOpenRelated={handleExpand}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Mount one AINewsPageRow per requested page so useFeedContent runs
              at the top level of a child component (Rules of Hooks). Rows
              report their data/loading state up via reportPage and render
              nothing visible themselves. */}
          {pages.map((offset) => (
            <AINewsPageRow
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
          {anyPageLoading && items.length === 0 && <AINewsSkeletons />}

          {/* Sentinel + load-more indicator. */}
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
          {anyPageFetching && items.length > 0 && (
            <div
              data-ocid="ainews.loading_more"
              className="flex items-center justify-center py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Loading more…
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div
              data-ocid="ainews.end"
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
 * AINewsPageRow — mounts a single page's `useFeedContent` query at the top
 * level of a child component (one per requested page offset) and reports the
 * query state up to the parent. Renders nothing visible; the parent
 * accumulates the reported data into the `items` list and renders the cards.
 *
 * The category is hardcoded to "ainews" so the backend narrows the slice to
 * AI-industry news content only.
 */
function AINewsPageRow({
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
 * AINewsHeader — a compact page header distinguishing the AI news feed from
 * the main feed. Uses the sky-blue ainews accent and the Bot icon to signal
 * the AI-tools and earning-opportunities focus.
 */
function AINewsHeader() {
  return (
    <header
      data-ocid="ainews.header"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[color:var(--ainews)]/30",
        "bg-[color:var(--ainews)]/10 px-4 py-3",
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          "bg-[color:var(--ainews)]/15 text-[color:var(--ainews)]",
        )}
      >
        <Bot className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-lg font-bold leading-tight text-foreground">
          AI News
        </h1>
        <p className="text-xs text-muted-foreground">
          AI tools, breakthroughs & earning opportunities · earn coins as you
          scroll
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
      data-ocid="ainews.guest_preview"
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
        data-ocid="ainews.guest_preview.sign_in"
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

/**
 * AINewsDetail — expanded detail view for a single AI news card.
 *
 * Shows the full article body, the parsed source badge, the parsed read-time
 * estimate, and a "Related AI News" rail of other items from the same feed so
 * readers can keep exploring without returning to the list.
 */
function AINewsDetail({
  item,
  related,
  onClose,
  onOpenRelated,
}: {
  item: FeedContent;
  related: FeedContent[];
  onClose: () => void;
  onOpenRelated: (item: FeedContent) => void;
}) {
  const source = parseSource(item.body);
  const readTime = parseReadTime(item.body);
  const snippet = parseSnippet(item.body);

  return (
    <article
      data-ocid="ainews.detail"
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
          data-ocid="ainews.detail.close"
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
        {/* Source badge — top-left, sky-blue ainews tint. */}
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full",
            "border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
            "text-[color:var(--ainews)]",
          )}
        >
          <Bot className="h-3 w-3" strokeWidth={2.5} />
          {source}
        </span>
      </div>
      <div className="p-4">
        <h2 className="font-display text-xl font-bold leading-tight text-foreground">
          {item.title}
        </h2>

        {/* Source + read-time meta row. */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-[color:var(--ainews)]/30",
              "bg-[color:var(--ainews)]/10 px-2.5 py-1 font-semibold",
              "text-[color:var(--ainews)]",
            )}
          >
            <Bot className="h-3 w-3" strokeWidth={2.5} />
            {source}
          </span>
          {readTime && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border/60",
                "bg-muted px-2.5 py-1 font-semibold text-muted-foreground",
              )}
            >
              <Clock className="h-3 w-3" strokeWidth={2.5} />
              {readTime}
            </span>
          )}
        </div>

        {/* Full article body. */}
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {item.body}
        </p>

        {/* Pure snippet echo (in case the body's snippet line is buried). */}
        {snippet && (
          <p className="mt-3 border-l-2 border-[color:var(--ainews)]/40 pl-3 text-sm italic leading-relaxed text-muted-foreground">
            {snippet}
          </p>
        )}

        {/* Related AI News rail. */}
        {related.length > 0 && (
          <section className="mt-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Related AI News
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              {related.map((rel, i) => {
                const relSource = parseSource(rel.body);
                const relReadTime = parseReadTime(rel.body);
                return (
                  <button
                    key={rel.id.toString()}
                    type="button"
                    data-ocid={`ainews.detail.related.${i + 1}`}
                    onClick={() => onOpenRelated(rel)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 text-left",
                      "transition-smooth hover:border-[color:var(--ainews)]/40 hover:bg-muted",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        "bg-[color:var(--ainews)]/10 text-[color:var(--ainews)]",
                      )}
                    >
                      <Bot className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-foreground">
                        {rel.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {relSource}
                        {relReadTime ? ` · ${relReadTime}` : ""}
                      </p>
                    </div>
                    <ArrowUpRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground",
                        "transition-smooth group-hover:text-[color:var(--ainews)]",
                      )}
                      strokeWidth={2.5}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

/** Layout-matched loading skeletons for the first AI news page. */
function AINewsSkeletons() {
  return (
    <div
      data-ocid="ainews.loading_state"
      className="flex flex-col gap-3"
      aria-label="Loading AI news feed"
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

export default AINewsPage;
