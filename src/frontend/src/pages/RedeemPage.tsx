/**
 * RedeemPage — the rewards catalog.
 *
 * Shows the user's current coin balance at the top, then a responsive grid of
 * RewardCards. Each card's redeem button calls `redeemReward` via the shared
 * `useRedeemReward` mutation. The button is disabled when the balance is below
 * the price (or for guests). On success, a RedeemConfirmation panel slides in
 * at the top and a gold success toast fires; the wallet query invalidates so
 * the balance header updates immediately.
 */
import RedeemConfirmation from "@/components/RedeemConfirmation";
import RewardCard from "@/components/RewardCard";
import { useCoins } from "@/hooks/useCoins";
import { useRedeemReward, useRewards } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Redemption, RewardItem } from "@/types/rewards";
import { Coins, Loader2, PackageOpen, Sparkles } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/** A confirmed redemption paired with its reward, for the confirmation panel. */
interface ConfirmedRedemption {
  reward: RewardItem;
  redemption: Redemption;
}

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

function BalanceSummary({
  totalCoins,
  isLoading,
}: {
  totalCoins: bigint;
  isLoading: boolean;
}) {
  return (
    <section
      data-ocid="redeem.balance_summary"
      aria-label="Your coin balance"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/30",
        "bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-coin",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full gradient-coin opacity-25 blur-2xl"
      />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            "gradient-coin shadow-coin",
          )}
        >
          <Coins
            className="h-6 w-6 text-primary-foreground"
            strokeWidth={2.5}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Your balance
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-primary">
            {isLoading ? "—" : formatCoins(totalCoins)}
          </p>
        </div>
      </div>
    </section>
  );
}

function RewardsSkeleton() {
  return (
    <div
      data-ocid="redeem.loading_state"
      className="grid grid-cols-2 gap-3"
      aria-label="Loading rewards"
    >
      {[
        "reward-skeleton-0",
        "reward-skeleton-1",
        "reward-skeleton-2",
        "reward-skeleton-3",
      ].map((skeletonKey) => (
        <div
          key={skeletonKey}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="mt-3 h-9 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      data-ocid="redeem.empty_state"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <PackageOpen
          className="h-7 w-7 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
      <div>
        <h2 className="font-display text-base font-bold text-foreground">
          No rewards available yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep scrolling the feed to earn coins — new rewards drop here soon.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <output
      data-ocid="redeem.error_state"
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-10 text-center"
    >
      <p className="font-display text-sm font-bold text-destructive">
        Couldn’t load rewards
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </output>
  );
}

export function RedeemPage() {
  const { totalCoins, isLoading: balanceLoading } = useCoins();
  const rewardsQuery = useRewards();
  const redeemMutation = useRedeemReward();

  const [confirmed, setConfirmed] = useState<ConfirmedRedemption | null>(null);
  const [redeemingId, setRedeemingId] = useState<bigint | null>(null);

  const rewards = useMemo(() => rewardsQuery.data ?? [], [rewardsQuery.data]);

  // Auto-dismiss the confirmation panel after 6 seconds.
  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => setConfirmed(null), 6000);
    return () => clearTimeout(timer);
  }, [confirmed]);

  const handleRedeem = async (reward: RewardItem) => {
    setRedeemingId(reward.id);
    try {
      const redemption = await redeemMutation.mutateAsync(reward.id);
      setConfirmed({ reward, redemption });
      toast.success("Reward redeemed!", {
        description: `${reward.title} — ${formatCoins(redemption.coinsDeducted)} coins spent.`,
        icon: <Sparkles className="h-4 w-4" />,
        duration: 5000,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Redemption failed. Try again.";
      toast.error("Redemption failed", {
        description: message,
        duration: 5000,
      });
    } finally {
      setRedeemingId(null);
    }
  };

  const isRedeemingFor = (id: bigint) =>
    redeemingId === id && redeemMutation.isPending;

  return (
    <section data-ocid="page.redeem" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Redeem
        </h1>
        <p className="text-sm text-muted-foreground">
          Spend your coins on gift cards, perks, and bonuses.
        </p>
      </header>

      <BalanceSummary totalCoins={totalCoins} isLoading={balanceLoading} />

      <AnimatePresence mode="wait">
        {confirmed && (
          <RedeemConfirmation
            key={`confirm-${confirmed.redemption.id}`}
            reward={confirmed.reward}
            redemption={confirmed.redemption}
            newBalance={totalCoins}
            onDismiss={() => setConfirmed(null)}
          />
        )}
      </AnimatePresence>

      {rewardsQuery.isLoading ? (
        <RewardsSkeleton />
      ) : rewardsQuery.isError ? (
        <ErrorState
          message={
            rewardsQuery.error instanceof Error
              ? rewardsQuery.error.message
              : "Please try again in a moment."
          }
        />
      ) : rewards.length === 0 ? (
        <EmptyState />
      ) : (
        <ul
          data-ocid="reward.list"
          className="grid grid-cols-2 gap-3"
          aria-label="Available rewards"
        >
          {rewards.map((reward, i) => (
            <li key={reward.id.toString()} className="min-w-0">
              <RewardCard
                reward={reward}
                index={i + 1}
                balance={totalCoins}
                isRedeeming={isRedeemingFor(reward.id)}
                isRedeemed={false}
                onRedeem={handleRedeem}
              />
            </li>
          ))}
        </ul>
      )}

      {redeemMutation.isPending && (
        <div
          data-ocid="redeem.pending_indicator"
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

export default RedeemPage;
