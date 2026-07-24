/**
 * MotivationalBanner — daily rotating tip banner shown at the top of the
 * Leaderboard page.
 *
 * Picks a deterministic tip for the current day (so it stays stable across
 * re-renders within the same calendar day) and rotates through a curated set
 * of earning-focused tips. The banner uses the gold coin gradient to read as
 * a premium reward cue, with a small coin icon and a manual "next tip" afford
 * for users who want a fresh idea immediately.
 */
import { cn } from "@/lib/utils";
import { Coins, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

/** Curated earning tips. Keep copy action-oriented and coin-reward focused. */
const TIPS: readonly string[] = [
  "Keep your daily streak alive — streak bonuses double your coin rewards at every milestone.",
  "Hit your daily goal three days in a row to unlock the Goal Getter badge and a 500-coin bonus.",
  "Scroll past 50 items in one session to trigger a milestone award. Longer sessions pay more.",
  "Watch for the gold milestone pop — every 25 scrolls drops a fresh coin bundle into your vault.",
  "Redeem early and often. Rewards reset weekly, so don't let your coins sit idle.",
  "Climb the weekly leaderboard — the top three earners each week pocket a streak freeze.",
  "Fun facts pay too. Tap into the fun-fact feed to earn coins while you learn.",
  "Set a daily goal you can actually hit. Small consistent days beat one big spike.",
] as const;

/** Deterministic day index so the tip is stable within a calendar day. */
function dayIndex(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export interface MotivationalBannerProps {
  /** Optional className override for layout composition. */
  className?: string;
}

export function MotivationalBanner({ className }: MotivationalBannerProps) {
  const [manualOffset, setManualOffset] = useState(0);

  const tip = useMemo(() => {
    const base = dayIndex(new Date());
    const index = (base + manualOffset) % TIPS.length;
    return TIPS[index < 0 ? index + TIPS.length : index];
  }, [manualOffset]);

  const tipNumber = useMemo(() => {
    const base = dayIndex(new Date());
    const index = (base + manualOffset) % TIPS.length;
    return (index < 0 ? index + TIPS.length : index) + 1;
  }, [manualOffset]);

  return (
    <section
      data-ocid="motivational_banner"
      aria-label="Daily earning tip"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/30",
        "bg-card p-4 shadow-coin",
        className,
      )}
    >
      {/* Gold gradient wash behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 gradient-primary"
      />
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "border border-primary/40 bg-primary/15",
          )}
        >
          <Coins
            className="h-5 w-5 text-primary animate-coin-float"
            strokeWidth={2.5}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-xs font-semibold uppercase tracking-widest text-primary">
              Daily Tip
            </p>
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-primary">
              {tipNumber}/{TIPS.length}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-foreground">{tip}</p>
        </div>

        <button
          type="button"
          data-ocid="motivational_banner.next_tip"
          aria-label="Show next earning tip"
          onClick={() => setManualOffset((n) => n + 1)}
          className={cn(
            "shrink-0 rounded-full p-2 text-primary",
            "transition-smooth hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}

export default MotivationalBanner;
