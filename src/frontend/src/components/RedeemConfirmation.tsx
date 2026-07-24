import { cn } from "@/lib/utils";
/**
 * RedeemConfirmation — animated post-redemption success panel.
 *
 * Shown at the top of the Redeem page after a successful redemption. Renders a
 * gold coin burst, the reward title, the deducted amount, and the new balance,
 * then auto-dismisses after a few seconds (parent-owned timeout) or via the
 * explicit dismiss button. Honors `prefers-reduced-motion`.
 */
import type { Redemption, RewardItem } from "@/types/rewards";
import { Check, Coins, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export interface RedeemConfirmationProps {
  /** The reward that was just redeemed (for title + price). */
  reward: RewardItem;
  /** The redemption record returned by the backend. */
  redemption: Redemption;
  /** The user's updated coin balance after deduction. */
  newBalance: bigint;
  /** Dismiss the confirmation panel. */
  onDismiss: () => void;
}

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function RedeemConfirmation({
  reward,
  redemption,
  newBalance,
  onDismiss,
}: RedeemConfirmationProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      data-ocid="redeem.confirmation"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-success/40",
        "bg-gradient-to-br from-success/15 via-card to-card shadow-elevated",
      )}
    >
      {/* Coin burst accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full gradient-coin blur-xl opacity-60"
        />
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="absolute -left-4 bottom-2 h-16 w-16 rounded-full gradient-coin blur-lg opacity-40"
        />
      </div>

      <div className="relative flex items-start gap-3 p-4">
        {/* Success check badge */}
        <motion.div
          initial={reduceMotion ? false : { scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            "bg-success text-success-foreground shadow-coin",
          )}
        >
          <Check className="h-6 w-6" strokeWidth={3} />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-foreground">
            Reward redeemed!
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {reward.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1 text-foreground">
              <Coins className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
              <span className="font-mono font-semibold tabular-nums">
                −{formatCoins(redemption.coinsDeducted)}
              </span>
              <span className="text-muted-foreground">spent</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="text-muted-foreground/70">Balance:</span>
              <span className="font-mono font-semibold tabular-nums text-primary">
                {formatCoins(newBalance)}
              </span>
            </span>
          </div>

          <p
            className={cn(
              "mt-1.5 text-[11px] font-medium uppercase tracking-wide",
              redemption.status === "fulfilled"
                ? "text-success"
                : "text-warning",
            )}
          >
            Status: {redemption.status}
          </p>
        </div>

        <button
          type="button"
          data-ocid="redeem.confirmation.dismiss"
          aria-label="Dismiss confirmation"
          onClick={onDismiss}
          className={cn(
            "shrink-0 rounded-full p-1.5 text-muted-foreground",
            "transition-smooth hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default RedeemConfirmation;
