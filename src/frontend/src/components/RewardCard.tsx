import { cn } from "@/lib/utils";
/**
 * RewardCard — a single redeemable reward presented as a rounded-2xl card.
 *
 * Composition:
 *   - reward image (with graceful fallback when the URL is empty/broken)
 *   - category pill + coin price badge
 *   - title, description
 *   - redeem button (disabled when balance is below price, while pending,
 *     or for guests) with an inline "redeemed" success state
 *
 * The card is presentational: redemption is delegated to the parent via
 * `onRedeem`. The parent owns the mutation and the success toast so the
 * catalog stays a pure list of cards.
 */
import type { RewardItem } from "@/types/rewards";
import { Check, Coins, Gift, Loader2, Lock } from "lucide-react";
import { useState } from "react";

export interface RewardCardProps {
  /** The reward to render. */
  reward: RewardItem;
  /** 1-based position in the list, for deterministic test markers. */
  index: number;
  /** The user's current coin balance. */
  balance: bigint;
  /** True while this card's redemption mutation is in flight. */
  isRedeeming: boolean;
  /** True after a successful redemption of this specific reward. */
  isRedeemed: boolean;
  /** Invoke the redemption for this reward. */
  onRedeem: (reward: RewardItem) => void;
}

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

function categoryToClass(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("gift") || c.includes("card")) {
    return "bg-primary/15 text-primary border-primary/30";
  }
  if (c.includes("perk") || c.includes("bonus")) {
    return "bg-accent/15 text-accent border-accent/30";
  }
  if (c.includes("goal") || c.includes("achievement")) {
    return "bg-success/15 text-success border-success/30";
  }
  return "bg-secondary text-secondary-foreground border-border";
}

export function RewardCard({
  reward,
  index,
  balance,
  isRedeeming,
  isRedeemed,
  onRedeem,
}: RewardCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const affordable = balance >= reward.coinPrice;
  const disabled = isRedeeming || isRedeemed || !affordable;

  return (
    <article
      data-ocid={`reward.card.${index}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border",
        "border-border bg-card shadow-subtle transition-smooth",
        "hover:border-primary/40 hover:shadow-elevated",
        "focus-within:border-primary/40 focus-within:shadow-elevated",
      )}
    >
      {/* Image zone */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {reward.image && !imageFailed ? (
          <img
            src={reward.image}
            alt={reward.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-smooth",
              "group-hover:scale-[1.03]",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
            <Gift
              className="h-10 w-10 text-muted-foreground/60"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Category pill */}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full border px-2.5 py-1",
            "text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm",
            categoryToClass(reward.category),
          )}
        >
          {reward.category}
        </span>

        {/* Coin price badge */}
        <div
          className={cn(
            "absolute right-3 top-3 flex items-center gap-1 rounded-full",
            "border border-primary/40 bg-background/85 px-2.5 py-1 backdrop-blur-md",
            "shadow-coin",
          )}
        >
          <Coins className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
          <span className="font-mono text-xs font-bold tabular-nums text-primary">
            {formatCoins(reward.coinPrice)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold leading-tight text-foreground">
            {reward.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {reward.description}
          </p>
        </div>

        <div className="mt-auto">
          {isRedeemed ? (
            <div
              data-ocid={`reward.redeemed.${index}`}
              className={cn(
                "flex min-h-[44px] items-center justify-center gap-2 rounded-xl",
                "bg-success/15 text-success border border-success/30",
                "font-semibold text-sm",
              )}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Redeemed
            </div>
          ) : (
            <button
              type="button"
              data-ocid={`reward.redeem_button.${index}`}
              onClick={() => onRedeem(reward)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-label={
                affordable
                  ? `Redeem ${reward.title} for ${formatCoins(reward.coinPrice)} coins`
                  : `Not enough coins to redeem ${reward.title}. Need ${formatCoins(reward.coinPrice)} coins.`
              }
              className={cn(
                "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl",
                "font-semibold text-sm transition-smooth",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                affordable && !isRedeeming
                  ? "gradient-primary text-primary-foreground shadow-coin hover:opacity-90 active:scale-[0.98]"
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
                  <Gift className="h-4 w-4" strokeWidth={2.5} />
                  Redeem for {formatCoins(reward.coinPrice)}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" strokeWidth={2.5} />
                  Need {formatCoins(reward.coinPrice - balance)} more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default RewardCard;
