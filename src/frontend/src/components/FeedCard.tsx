import { cn } from "@/lib/utils";
/**
 * FeedCard — a single curated content card in the endless feed.
 *
 * Renders the card image, category badge, title, and a clamped body preview.
 * The whole card is a button so it is keyboard-activatable and announces as
 * a single control; clicking it expands the card into a detail view (handled
 * by the parent via `onExpand`). Uses the warm-dark card surface with a
 * subtle shadow that lifts to `shadow-elevated` on hover, matching the
 * DESIGN.md card pattern.
 *
 * Finance cards (`contentType === "finance"`) get a distinct badge with a
 * crypto or forex sub-type icon and color cue, inferred from the title/body
 * keywords (Bitcoin/Ethereum/altcoin → crypto, EUR/USD/GBP/JPY/dollar → forex).
 *
 * The contentTypeMeta switch covers all nine FeedContentType variants:
 * article, image, funfact, finance, reel, product, ainews, ebook, lesson —
 * each with a distinct icon and tint drawn from the design-system tokens.
 */
import type { FeedContent } from "@/types/rewards";
import {
  ArrowUpRight,
  Bitcoin,
  BookOpen,
  Bot,
  DollarSign,
  Film,
  ImageIcon,
  Newspaper,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface FeedCardProps {
  /** The feed item to render. */
  item: FeedContent;
  /** 1-based position in the visible feed, for deterministic markers. */
  index: number;
  /** Open the expanded detail view for this card. */
  onExpand: (item: FeedContent) => void;
}

/** Map a content type to its label, icon, and accent tint. */
function contentTypeMeta(kind: string): {
  label: string;
  Icon: LucideIcon;
  tint: string;
} {
  switch (kind) {
    case "image":
      return { label: "Image", Icon: ImageIcon, tint: "text-accent" };
    case "funfact":
      return { label: "Fun Fact", Icon: Sparkles, tint: "text-warning" };
    case "finance":
      return { label: "Finance", Icon: TrendingUp, tint: "text-primary" };
    case "reel":
      return { label: "Reel", Icon: Film, tint: "text-[color:var(--reel)]" };
    case "product":
      return { label: "Shop", Icon: Package, tint: "text-[color:var(--shop)]" };
    case "ainews":
      return {
        label: "AI News",
        Icon: Bot,
        tint: "text-[color:var(--ainews)]",
      };
    case "ebook":
      return {
        label: "Ebook",
        Icon: BookOpen,
        tint: "text-[color:var(--learn)]",
      };
    case "lesson":
      return {
        label: "Lesson",
        Icon: BookOpen,
        tint: "text-[color:var(--learn)]",
      };
    default:
      return { label: "Article", Icon: Newspaper, tint: "text-primary" };
  }
}

/** Crypto-vs-forex keywords used to infer the finance sub-type. */
const CRYPTO_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "altcoin",
  "crypto",
  "halving",
  "stablecoin",
  "on-chain",
  "staking",
  "layer-2",
  "token",
];
const FOREX_KEYWORDS = [
  "eur/usd",
  "gbp/usd",
  "usd/jpy",
  "forex",
  "dollar",
  "dxy",
  "sterling",
  "euro",
  "yen",
  "central bank",
  "rate decision",
  "safe-haven",
  "risk-on",
  "risk-off",
];

/** Infer the finance sub-type (crypto or forex) from title + body text. */
function financeSubType(item: FeedContent): "crypto" | "forex" {
  const haystack = `${item.title} ${item.body}`.toLowerCase();
  for (const kw of CRYPTO_KEYWORDS) {
    if (haystack.includes(kw)) return "crypto";
  }
  for (const kw of FOREX_KEYWORDS) {
    if (haystack.includes(kw)) return "forex";
  }
  return "crypto";
}

/** Finance sub-type metadata: icon + color cue separating crypto and forex. */
function financeSubMeta(sub: "crypto" | "forex"): {
  label: string;
  Icon: LucideIcon;
  tint: string;
} {
  if (sub === "forex") {
    return { label: "Forex", Icon: DollarSign, tint: "text-accent" };
  }
  return { label: "Crypto", Icon: Bitcoin, tint: "text-primary" };
}

export function FeedCard({ item, index, onExpand }: FeedCardProps) {
  const meta = contentTypeMeta(item.contentType);
  const isFinance = item.contentType === "finance";
  const subMeta = isFinance ? financeSubMeta(financeSubType(item)) : null;

  return (
    <article
      data-ocid={`feed.card.${index}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card",
        "shadow-subtle transition-smooth",
        "hover:-translate-y-0.5 hover:shadow-elevated",
        "focus-within:shadow-elevated",
      )}
    >
      <button
        type="button"
        data-ocid={`feed.card.${index}.open`}
        aria-label={`Open "${item.title}"`}
        onClick={() => onExpand(item)}
        className={cn(
          "block w-full text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {/* Image — covers a 16:9 area, falls back to a muted gradient block. */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              className={cn(
                "h-full w-full object-cover",
                "transition-smooth duration-500 group-hover:scale-[1.03]",
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center gradient-subtle">
              <meta.Icon
                className="h-8 w-8 text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
          )}

          {/* Category badge — top-left pill over the image. */}
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full",
              "border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
              meta.tint,
            )}
          >
            <meta.Icon className="h-3 w-3" strokeWidth={2.5} />
            {item.category || meta.label}
          </span>

          {/* Finance sub-type badge — top-right pill distinguishing crypto/forex. */}
          {subMeta && (
            <span
              data-ocid={`feed.card.${index}.finance_sub`}
              className={cn(
                "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full",
                "border border-border/60 bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md",
                subMeta.tint,
              )}
            >
              <subMeta.Icon className="h-3 w-3" strokeWidth={2.5} />
              {subMeta.label}
            </span>
          )}
        </div>

        {/* Body — title + clamped preview. */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-display text-base font-bold leading-snug text-foreground">
              {item.title}
            </h3>
            <ArrowUpRight
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
                "transition-smooth group-hover:text-primary",
              )}
              strokeWidth={2.5}
            />
          </div>
          {item.body && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}

export default FeedCard;
