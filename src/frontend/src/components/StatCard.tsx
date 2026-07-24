/**
 * StatCard — compact metric card for wallet stat displays.
 *
 * Renders a label, a large tabular value, and a leading icon chip. The
 * `accent` prop selects the semantic color band (gold for coins, coral for
 * streaks, green for goal completion) so the same component can carry the
 * three accent usages defined in the design contract without bespoke
 * styling per call site.
 */
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatCardAccent = "gold" | "coral" | "green";

export interface StatCardProps {
  /** Short label above the value, e.g. "Today's earnings". */
  label: string;
  /** Pre-formatted value string (caller formats bigints). */
  value: string;
  /** Optional sub-label rendered under the value, e.g. "coins". */
  unit?: string;
  /** Lucide icon rendered in the accent chip. */
  icon: LucideIcon;
  /** Semantic accent band. */
  accent?: StatCardAccent;
  /** Deterministic test marker root. */
  ocid: string;
  /** Render a muted skeleton value while loading. */
  isLoading?: boolean;
}

const ACCENT_STYLES: Record<
  StatCardAccent,
  { chip: string; value: string; ring: string }
> = {
  gold: {
    chip: "bg-primary/15 text-primary border-primary/25",
    value: "text-primary",
    ring: "shadow-coin",
  },
  coral: {
    chip: "bg-accent/15 text-accent border-accent/25",
    value: "text-accent",
    ring: "shadow-subtle",
  },
  green: {
    chip: "bg-success/15 text-success border-success/25",
    value: "text-success",
    ring: "shadow-subtle",
  },
};

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  accent = "gold",
  ocid,
  isLoading = false,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      data-ocid={ocid}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5",
        "transition-smooth",
        styles.ring,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
            styles.chip,
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums leading-none",
            isLoading ? "text-muted-foreground" : styles.value,
          )}
        >
          {isLoading ? "—" : value}
        </span>
        {unit && !isLoading && (
          <span className="text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
