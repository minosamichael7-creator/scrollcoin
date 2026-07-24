/**
 * WalletPage — the user's coin wallet.
 *
 * Composition (top to bottom, mobile-first single column):
 *   1. Hero balance card — total coin balance with coin icon, the focal point.
 *   2. Stat grid — today's earnings (gold) and lifetime earnings (gold).
 *   3. Streak badge — daily streak count with flame + freeze indicator.
 *   4. Daily goal card — completion state with progress bar and reward bonus.
 *   5. Earnings history — timestamped coin award entries.
 *
 * All data flows through the shared React Query hooks (useCoins, useStreak,
 * useEarningsHistory, useDailyGoal) so guests see a stable zero-state shell
 * and signed-in users see live backend data.
 */
import EarningsHistoryList from "@/components/EarningsHistoryList";
import StatCard from "@/components/StatCard";
import StreakBadge from "@/components/StreakBadge";
import { useCoins } from "@/hooks/useCoins";
import { useStreak } from "@/hooks/useStreak";
import { useDailyGoal, useEarningsHistory } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Coins,
  Flame,
  Gift,
  TrendingUp,
  Wallet,
} from "lucide-react";

/**
 * Convert the current UTC date to the backend's yyyymmdd `Date` format
 * (year*10000 + month*100 + day). The backend `getDailyGoal` expects this
 * integer, not a nanosecond timestamp.
 */
function todayYyyymmdd(): bigint {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  return BigInt(y * 10000 + m * 100 + d);
}

/** Format a bigint coin amount with grouping. */
function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

function BalanceHero({
  totalCoins,
  isLoading,
}: {
  totalCoins: bigint;
  isLoading: boolean;
}) {
  return (
    <section
      data-ocid="wallet.balance_hero"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/30 p-5",
        "bg-gradient-to-br from-primary/15 via-card to-card shadow-coin",
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary animate-coin-float"
          aria-hidden="true"
        >
          <Coins className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total balance
          </p>
          <p
            className={cn(
              "font-mono text-4xl font-bold leading-none tabular-nums",
              isLoading ? "text-muted-foreground" : "text-gradient-gold",
            )}
          >
            {isLoading ? "—" : formatCoins(totalCoins)}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            coins
          </p>
        </div>
      </div>
    </section>
  );
}

function DailyGoalCard({
  earned,
  target,
  completed,
  isLoading,
}: {
  earned: bigint;
  target: bigint;
  completed: boolean;
  isLoading: boolean;
}) {
  const earnedNum = Number(earned);
  const targetNum = Number(target);
  const pct =
    targetNum > 0
      ? Math.min(100, Math.round((earnedNum / targetNum) * 100))
      : 0;
  const bonus = targetNum > 0 ? Math.max(0, targetNum - earnedNum) : 0n;

  return (
    <section
      data-ocid="wallet.daily_goal"
      className={cn(
        "rounded-2xl border p-4 transition-smooth",
        completed
          ? "border-success/30 bg-success/10 shadow-subtle"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
              completed
                ? "border-success/30 bg-success/15 text-success"
                : "border-border bg-muted text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {completed ? (
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Gift className="h-4 w-4" strokeWidth={2.5} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Daily goal</p>
            <p className="text-xs text-muted-foreground">
              {completed
                ? "Completed — bonus coins unlocked!"
                : `Earn ${formatCoins(BigInt(bonus))} more to unlock the bonus`}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-sm font-bold tabular-nums",
            completed ? "text-success" : "text-muted-foreground",
          )}
        >
          {isLoading ? "—" : `${pct}%`}
        </span>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        tabIndex={0}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily goal progress"
      >
        <div
          data-ocid="wallet.daily_goal.progress"
          className={cn(
            "h-full rounded-full transition-smooth",
            completed
              ? "bg-success"
              : "bg-gradient-to-r from-primary to-primary/70",
          )}
          style={{ width: `${isLoading ? 0 : pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          {isLoading ? "—" : `${formatCoins(earned)} / ${formatCoins(target)}`}
        </span>
        {completed && (
          <span
            data-ocid="wallet.daily_goal.bonus"
            className="flex items-center gap-1 font-semibold text-success"
          >
            <Gift className="h-3 w-3" strokeWidth={2.5} />
            Bonus claimed
          </span>
        )}
      </div>
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  ocid,
}: {
  icon: typeof Flame;
  title: string;
  ocid: string;
}) {
  return (
    <div data-ocid={ocid} className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
        {title}
      </h2>
    </div>
  );
}

export function WalletPage() {
  const {
    totalCoins,
    todayEarnings,
    lifetimeEarnings,
    isLoading: coinsLoading,
  } = useCoins();
  const {
    streakCount,
    streakFreezeCount,
    isLoading: streakLoading,
  } = useStreak();
  const earnings = useEarningsHistory();
  const goal = useDailyGoal(todayYyyymmdd());

  const goalData = goal.data;
  const earned = goalData?.earnedCoins ?? 0n;
  const target = goalData?.targetCoins ?? 0n;
  const completed = goalData?.completed ?? false;
  const goalLoading = goal.isLoading && !goalData;

  const earningsLoading = earnings.isLoading && !earnings.data;

  return (
    <div data-ocid="page.wallet" className="flex flex-col gap-5 pb-2">
      <BalanceHero totalCoins={totalCoins} isLoading={coinsLoading} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          ocid="wallet.stat.today"
          label="Today"
          value={formatCoins(todayEarnings)}
          unit="coins"
          icon={TrendingUp}
          accent="gold"
          isLoading={coinsLoading}
        />
        <StatCard
          ocid="wallet.stat.lifetime"
          label="Lifetime"
          value={formatCoins(lifetimeEarnings)}
          unit="coins"
          icon={Wallet}
          accent="gold"
          isLoading={coinsLoading}
        />
      </div>

      <StreakBadge
        streakCount={streakCount}
        streakFreezeCount={streakFreezeCount}
        isLoading={streakLoading}
      />

      <DailyGoalCard
        earned={earned}
        target={target}
        completed={completed}
        isLoading={goalLoading}
      />

      <div className="flex flex-col gap-2">
        <SectionHeader
          icon={Flame}
          title="Earnings history"
          ocid="wallet.earnings_header"
        />
        <EarningsHistoryList
          awards={earnings.data ?? []}
          isLoading={earningsLoading}
        />
      </div>
    </div>
  );
}

export default WalletPage;
