/**
 * CoinHeader — sticky top header showing the user's current coin balance.
 *
 * Visible on every page. Renders a gold coin icon next to a tabular coin
 * count so the balance reads as a premium fintech figure. While the wallet
 * is loading (or for guests) it shows a muted placeholder so the layout
 * never shifts.
 */
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

function formatCoins(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function CoinHeader() {
  const { totalCoins, isLoading, isSignedIn } = useCoinsSafe();

  return (
    <header
      data-ocid="coin_header"
      className={cn(
        "sticky top-0 z-40 w-full",
        "border-b border-border bg-card/95 backdrop-blur-md",
        "px-4 py-3",
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-lg font-bold tracking-tight text-foreground truncate">
            Coin Vault
          </span>
        </div>

        <div
          data-ocid="coin_balance"
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-primary/30",
            "bg-primary/10 px-3 py-1.5 shadow-coin",
            "transition-smooth",
          )}
          aria-label={`Current coin balance: ${formatCoins(totalCoins)} coins`}
        >
          <Coins className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
          <span
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              isLoading ? "text-muted-foreground" : "text-primary",
            )}
          >
            {isLoading ? "—" : formatCoins(totalCoins)}
          </span>
          {!isSignedIn && !isLoading && (
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              guest
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Local helper that merges coin state with auth awareness so the header can
 * render a stable guest badge without re-deriving it in every consumer.
 * Kept private to this module since only the header needs the merged view.
 *
 * Auth state comes from `useAuth().isSignedIn` (Internet Identity), NOT from
 * the coin balance — a signed-in user with a zero balance would otherwise be
 * mislabeled as a guest.
 */
function useCoinsSafe() {
  const coins = useCoins();
  const { isSignedIn } = useAuth();
  return {
    totalCoins: coins.totalCoins,
    isLoading: coins.isLoading,
    isSignedIn,
  };
}

export default CoinHeader;
