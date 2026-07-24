/**
 * ProfileStats — summary stats grid for the Profile page.
 *
 * Renders a responsive grid of stat cards covering the user's lifetime
 * earning metrics: total coins, lifetime earnings, today's earnings, current
 * streak, streak freezes, and achievements unlocked. Each card pairs a lucide
 * icon with a tabular numeric value and a short label, using the design
 * system's gold/coral/green accent mapping.
 */
import { cn } from "@/lib/utils";
import { Award, Coins, Flame, Gift, Snowflake, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ProfileStat {
  /** Deterministic test marker. */
  ocid: string;
  /** Accessible label, also used as the caption. */
  label: string;
  /** Pre-formatted display value. */
  value: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Tailwind accent token class for the icon tint. */
  accent: string;
  /** Tailwind background tint for the icon chip. */
  chip: string;
}

export interface ProfileStatsProps {
  stats: ProfileStat[];
}

function formatBig(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

/**
 * Build the canonical stat set from a profile + streak snapshot. Exported so
 * the Profile page (and tests) can construct the grid without duplicating
 * the field mapping.
 */
export function buildProfileStats(args: {
  totalCoins: bigint;
  lifetimeEarnings: bigint;
  todayEarnings: bigint;
  streakCount: bigint;
  streakFreezeCount: bigint;
  achievementsUnlocked: number;
  achievementsTotal: number;
}): ProfileStat[] {
  const {
    totalCoins,
    lifetimeEarnings,
    todayEarnings,
    streakCount,
    streakFreezeCount,
    achievementsUnlocked,
    achievementsTotal,
  } = args;

  return [
    {
      ocid: "profile.stat.total_coins",
      label: "Total coins",
      value: formatBig(totalCoins),
      icon: Coins,
      accent: "text-primary",
      chip: "bg-primary/15",
    },
    {
      ocid: "profile.stat.lifetime_earnings",
      label: "Lifetime earned",
      value: formatBig(lifetimeEarnings),
      icon: TrendingUp,
      accent: "text-primary",
      chip: "bg-primary/10",
    },
    {
      ocid: "profile.stat.today_earnings",
      label: "Earned today",
      value: formatBig(todayEarnings),
      icon: Gift,
      accent: "text-warning",
      chip: "bg-warning/15",
    },
    {
      ocid: "profile.stat.streak",
      label: "Day streak",
      value: formatBig(streakCount),
      icon: Flame,
      accent: "text-accent",
      chip: "bg-accent/15",
    },
    {
      ocid: "profile.stat.freezes",
      label: "Streak freezes",
      value: formatBig(streakFreezeCount),
      icon: Snowflake,
      accent: "text-chart-4",
      chip: "bg-chart-4/15",
    },
    {
      ocid: "profile.stat.achievements",
      label: "Achievements",
      value: `${achievementsUnlocked}/${achievementsTotal}`,
      icon: Award,
      accent: "text-success",
      chip: "bg-success/15",
    },
  ];
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <ul
      data-ocid="profile.stats_grid"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <li
            key={stat.ocid}
            data-ocid={stat.ocid}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5",
              "shadow-subtle transition-smooth",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                stat.chip,
              )}
            >
              <Icon className={cn("h-5 w-5", stat.accent)} strokeWidth={2.5} />
            </span>
            <span
              className={cn(
                "font-mono text-xl font-semibold tabular-nums text-foreground",
              )}
            >
              {stat.value}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default ProfileStats;
