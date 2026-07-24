/**
 * ShopPage — the coin shop.
 *
 * Mobile-first 2-column grid of products fetched through `getProducts` with
 * infinite-scroll pagination (mirrors FeedPage's page-array + sentinel
 * pattern). Each card shows the product image, title, coin price, and a
 * Redeem button. Tapping a card opens an inline detail view with a larger
 * image, the full description, and a confirm Redeem button.
 *
 * The Redeem button calls `useRedeemProduct`. On success a gold success toast
 * fires and the wallet query invalidates so the balance header updates
 * immediately. When the balance is below the price the button is disabled
 * with a "Need X more coins" hint. The shop tint (emerald) accents the cards
 * and the Redeem button; the Redeem button uses the `card-press` animation
 * for tactile feedback.
 */
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useProducts, useRedeemProduct } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/rewards";
import {
  Check,
  Coins,
  Loader2,
  Lock,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 5n;

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

/**
 * ShopPageRow — mounts a single page's `useProducts` query at the top level
 * of a child component (one per requested page offset) and reports the query
 * state up to the parent. Renders nothing visible; the parent accumulates the
 * reported data into the `items` list and renders the cards. Extracted so the
 * `useProducts` hook call stays at the top level of a component instead of
 * inside `pages.map()`, satisfying the Rules of Hooks.
 */
function ShopPageRow({
  offset,
  pageSize,
  onReport,
}: {
  offset: bigint;
  pageSize: bigint;
  onReport: (
    offset: bigint,
    data: { data?: Product[]; isLoading: boolean; isFetching: boolean },
  ) => void;
}) {
  const query = useProducts(offset, pageSize);
  useEffect(() => {
    onReport(offset, {
      data: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
    });
  }, [offset, onReport, query.data, query.isLoading, query.isFetching]);
  return null;
}

/** Coin balance summary card at the top of the shop, shop-tinted. */
function BalanceSummary({
  totalCoins,
  isLoading,
}: {
  totalCoins: bigint;
  isLoading: boolean;
}) {
  return (
    <section
      data-ocid="shop.balance_summary"
      aria-label="Your coin balance"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-shop/30",
        "bg-gradient-to-br from-shop/15 via-card to-card p-4 shadow-coin",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full gradient-shop opacity-25 blur-2xl"
      />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            "gradient-shop shadow-coin",
          )}
        >
          <Coins className="h-6 w-6 text-shop-foreground" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Your balance
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-shop">
            {isLoading ? "—" : formatCoins(totalCoins)}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Layout-matched loading skeletons for the first product page. */
function ShopSkeletons() {
  return (
    <div
      data-ocid="shop.loading_state"
      className="grid grid-cols-2 gap-3"
      aria-label="Loading products"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-square w-full animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-9 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A single product card in the 2-column grid. */
function ProductCard({
  product,
  index,
  balance,
  isRedeeming,
  isRedeemed,
  onRedeem,
  onOpen,
}: {
  product: Product;
  index: number;
  balance: bigint;
  isRedeeming: boolean;
  isRedeemed: boolean;
  onRedeem: (product: Product) => void;
  onOpen: (product: Product) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const affordable = balance >= product.priceCoins;
  const disabled = isRedeeming || isRedeemed || !affordable;

  return (
    <article
      data-ocid={`shop.card.${index}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border",
        "border-border bg-card shadow-subtle transition-smooth",
        "hover:border-shop/40 hover:shadow-elevated",
        "focus-within:border-shop/40 focus-within:shadow-elevated",
      )}
    >
      {/* Image zone — tap to open detail view. */}
      <button
        type="button"
        data-ocid={`shop.card.image.${index}`}
        onClick={() => onOpen(product)}
        aria-label={`View ${product.title} details`}
        className="relative aspect-square w-full overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop"
      >
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-smooth",
              "group-hover:scale-[1.03]",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
            <ShoppingBag
              className="h-10 w-10 text-muted-foreground/60"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Category pill */}
        <span
          className={cn(
            "absolute left-2.5 top-2.5 rounded-full border px-2 py-0.5",
            "text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm",
            "border-shop/30 bg-shop/15 text-shop",
          )}
        >
          {product.category}
        </span>

        {/* Coin price badge */}
        <div
          className={cn(
            "absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full",
            "border border-shop/40 bg-background/85 px-2 py-0.5 backdrop-blur-md",
            "shadow-coin",
          )}
        >
          <Coins className="h-3 w-3 text-shop" strokeWidth={2.5} />
          <span className="font-mono text-[11px] font-bold tabular-nums text-shop">
            {formatCoins(product.priceCoins)}
          </span>
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold leading-tight text-foreground line-clamp-1">
            {product.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        </div>

        <div className="mt-auto">
          {isRedeemed ? (
            <div
              data-ocid={`shop.redeemed.${index}`}
              className={cn(
                "flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl",
                "bg-shop/15 text-shop border border-shop/30",
                "font-semibold text-xs",
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Redeemed
            </div>
          ) : (
            <button
              type="button"
              data-ocid={`shop.redeem_button.${index}`}
              onClick={() => onRedeem(product)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-label={
                affordable
                  ? `Redeem ${product.title} for ${formatCoins(product.priceCoins)} coins`
                  : `Not enough coins to redeem ${product.title}. Need ${formatCoins(product.priceCoins)} coins.`
              }
              className={cn(
                "flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl",
                "font-semibold text-xs transition-press",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop",
                affordable && !isRedeeming
                  ? "gradient-shop text-shop-foreground shadow-coin hover:opacity-90 active:animate-card-press"
                  : "bg-secondary text-muted-foreground border border-border",
                isRedeeming && "opacity-70",
              )}
            >
              {isRedeeming ? (
                <>
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    strokeWidth={2.5}
                  />
                  Redeeming…
                </>
              ) : affordable ? (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Redeem
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Need {formatCoins(product.priceCoins - balance)} more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Inline expanded detail view for a single product. */
function ProductDetail({
  product,
  balance,
  isRedeeming,
  isRedeemed,
  onRedeem,
  onClose,
}: {
  product: Product;
  balance: bigint;
  isRedeeming: boolean;
  isRedeemed: boolean;
  onRedeem: (product: Product) => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const affordable = balance >= product.priceCoins;
  const disabled = isRedeeming || isRedeemed || !affordable;

  return (
    <motion.article
      data-ocid="shop.detail"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-shop/30 bg-card shadow-elevated"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
            <ShoppingBag
              className="h-12 w-12 text-muted-foreground/60"
              strokeWidth={1.5}
            />
          </div>
        )}
        <button
          type="button"
          data-ocid="shop.detail.close"
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
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full",
            "border border-shop/30 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-shop backdrop-blur-md",
          )}
        >
          {product.category}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold leading-tight text-foreground">
            {product.title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>

        {/* Price + balance row */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-shop/20 bg-shop/5 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                "gradient-shop shadow-coin",
              )}
            >
              <Coins
                className="h-4 w-4 text-shop-foreground"
                strokeWidth={2.5}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Price
              </p>
              <p className="font-mono text-lg font-bold tabular-nums text-shop">
                {formatCoins(product.priceCoins)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Your balance
            </p>
            <p
              className={cn(
                "font-mono text-sm font-semibold tabular-nums",
                affordable ? "text-foreground" : "text-destructive",
              )}
            >
              {formatCoins(balance)}
            </p>
          </div>
        </div>

        {/* Confirm Redeem button */}
        {isRedeemed ? (
          <div
            data-ocid="shop.detail.redeemed"
            className={cn(
              "flex min-h-[48px] items-center justify-center gap-2 rounded-xl",
              "bg-shop/15 text-shop border border-shop/30",
              "font-semibold text-sm",
            )}
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Redeemed
          </div>
        ) : (
          <button
            type="button"
            data-ocid="shop.detail.redeem_button"
            onClick={() => onRedeem(product)}
            disabled={disabled}
            aria-disabled={disabled}
            aria-label={
              affordable
                ? `Confirm redeem ${product.title} for ${formatCoins(product.priceCoins)} coins`
                : `Not enough coins to redeem ${product.title}. Need ${formatCoins(product.priceCoins)} coins.`
            }
            className={cn(
              "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl",
              "font-semibold text-sm transition-press",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop",
              affordable && !isRedeeming
                ? "gradient-shop text-shop-foreground shadow-coin hover:opacity-90 active:animate-card-press"
                : "bg-secondary text-muted-foreground border border-border",
              isRedeeming && "opacity-70",
            )}
          >
            {isRedeeming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Redeeming…
              </>
            ) : affordable ? (
              <>
                <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
                Confirm Redeem · {formatCoins(product.priceCoins)} coins
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" strokeWidth={2.5} />
                Need {formatCoins(product.priceCoins - balance)} more coins
              </>
            )}
          </button>
        )}
      </div>
    </motion.article>
  );
}

export function ShopPage() {
  const { isSignedIn } = useAuth();
  const { totalCoins, isLoading: balanceLoading } = useCoins();
  const redeemMutation = useRedeemProduct();

  // Infinite-scroll pagination: fetch pages on demand and accumulate.
  const [pages, setPages] = useState<bigint[]>([0n]);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<Set<string>>(new Set());
  const [redeemingId, setRedeemingId] = useState<bigint | null>(null);

  // Sentinel observer for infinite scroll.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  // Per-page query state, reported up by ShopPageRow children.
  const [pageData, setPageData] = useState<
    Record<
      string,
      { data?: Product[]; isLoading: boolean; isFetching: boolean }
    >
  >({});

  const reportPage = useCallback(
    (
      offset: bigint,
      data: { data?: Product[]; isLoading: boolean; isFetching: boolean },
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
    const all: Product[] = [];
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

  const expanded = useMemo(
    () => items.find((i) => i.id === expandedId) ?? null,
    [items, expandedId],
  );

  const handleRedeem = useCallback(
    async (product: Product) => {
      if (!isSignedIn) {
        toast.error("Sign in to redeem", {
          description: "You need an account to spend your coins.",
          duration: 5000,
        });
        return;
      }
      setRedeemingId(product.id);
      try {
        await redeemMutation.mutateAsync(product.id);
        setRedeemedIds((prev) => {
          const next = new Set(prev);
          next.add(product.id.toString());
          return next;
        });
        toast.success("Product redeemed!", {
          description: `${product.title} — ${formatCoins(product.priceCoins)} coins spent.`,
          icon: <Sparkles className="h-4 w-4" />,
          duration: 5000,
        });
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Redemption failed.";
        const isInsufficient = /insufficient/i.test(raw);
        toast.error(isInsufficient ? "Not enough coins" : "Redemption failed", {
          description: isInsufficient
            ? `You need ${formatCoins(product.priceCoins - totalCoins)} more coins to redeem ${product.title}.`
            : raw,
          duration: 5000,
        });
      } finally {
        setRedeemingId(null);
      }
    },
    [isSignedIn, redeemMutation, totalCoins],
  );

  const isRedeemingFor = (id: bigint) =>
    redeemingId === id && redeemMutation.isPending;
  const isRedeemed = (id: bigint) => redeemedIds.has(id.toString());

  return (
    <section data-ocid="page.shop" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Shop
        </h1>
        <p className="text-sm text-muted-foreground">
          Spend your coins on rewards, perks, and bonuses.
        </p>
      </header>

      <BalanceSummary totalCoins={totalCoins} isLoading={balanceLoading} />

      {/* Expanded detail view takes over the grid area. */}
      <AnimatePresence mode="wait">
        {expanded ? (
          <ProductDetail
            key={`detail-${expanded.id.toString()}`}
            product={expanded}
            balance={totalCoins}
            isRedeeming={isRedeemingFor(expanded.id)}
            isRedeemed={isRedeemed(expanded.id)}
            onRedeem={handleRedeem}
            onClose={() => setExpandedId(null)}
          />
        ) : (
          <motion.div
            key="grid"
            initial={false}
            className="flex flex-col gap-3"
          >
            {/* Mount one ShopPageRow per requested page so useProducts runs
                at the top level of a child component (Rules of Hooks). */}
            {pages.map((offset) => (
              <ShopPageRow
                key={offset.toString()}
                offset={offset}
                pageSize={PAGE_SIZE}
                onReport={reportPage}
              />
            ))}

            {anyPageLoading && items.length === 0 ? (
              <ShopSkeletons />
            ) : (
              <ul
                data-ocid="shop.list"
                className="grid grid-cols-2 gap-3"
                aria-label="Available products"
              >
                {items.map((product, i) => (
                  <li key={product.id.toString()} className="min-w-0">
                    <ProductCard
                      product={product}
                      index={i + 1}
                      balance={totalCoins}
                      isRedeeming={isRedeemingFor(product.id)}
                      isRedeemed={isRedeemed(product.id)}
                      onRedeem={handleRedeem}
                      onOpen={(p) => setExpandedId(p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* Sentinel + load-more indicator. */}
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
            {anyPageFetching && items.length > 0 && (
              <div
                data-ocid="shop.loading_more"
                className="flex items-center justify-center py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Loading more…
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <div
                data-ocid="shop.end"
                className="py-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                You've seen every product · earn more coins to unlock the rest
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {redeemMutation.isPending && (
        <div
          data-ocid="shop.pending_indicator"
          className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing redemption…
        </div>
      )}
    </section>
  );
}

export default ShopPage;
