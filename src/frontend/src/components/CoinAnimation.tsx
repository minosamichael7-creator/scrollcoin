/**
 * CoinAnimation — the milestone coin-earning popup.
 *
 * Renders a centered, ephemeral gold-coin celebration when a scroll milestone
 * is hit. Uses the `coin-pop` keyframe for the bounce-in and a short auto
 * dismiss. The popup is purely presentational (`role="status"` via the
 * semantic `<output>` element per biome's useSemanticElements rule) and
 * announces the awarded amount to assistive tech.
 *
 * Honors `prefers-reduced-motion` by skipping the bounce transform.
 */
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
import { useEffect } from "react";

export interface CoinAnimationProps {
  /** Coins awarded for this milestone. `null` hides the popup. */
  amount: bigint | null;
  /** Optional milestone number for the caption, e.g. `5n` for "5-card milestone". */
  milestone?: bigint | null;
  /** Called when the auto-dismiss timer fires. */
  onDismiss: () => void;
  /** How long the popup stays visible, in ms. Defaults to 2200ms. */
  durationMs?: number;
}

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function CoinAnimation({
  amount,
  milestone,
  onDismiss,
  durationMs = 2200,
}: CoinAnimationProps) {
  const visible = amount !== null && amount > 0n;

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [visible, onDismiss, durationMs]);

  if (!visible) return null;

  const milestoneLabel =
    milestone !== null && milestone !== undefined && milestone > 0n
      ? `${formatCoins(milestone)}-card milestone`
      : "Milestone";

  return (
    <output
      data-ocid="coin_animation"
      aria-live="assertive"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center px-4",
      )}
    >
      <div
        role="presentation"
        className={cn(
          "flex flex-col items-center gap-2 rounded-3xl border border-primary/40",
          "bg-card/95 px-6 py-5 shadow-coin backdrop-blur-md",
          "motion-safe:animate-coin-pop",
        )}
      >
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            "gradient-coin shadow-coin motion-safe:animate-coin-float",
          )}
        >
          <Coins
            className="h-7 w-7 text-primary-foreground"
            strokeWidth={2.5}
          />
        </span>
        <span className="font-display text-2xl font-bold text-gradient-gold">
          +{formatCoins(amount as bigint)}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {milestoneLabel} earned
        </span>
      </div>
    </output>
  );
}

export default CoinAnimation;
