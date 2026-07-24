/**
 * Layout — the app shell shared by every route.
 *
 * Composition:
 *   - sticky top CoinHeader (coin balance, visible on all pages)
 *   - guest-mode banner prompting sign-in when not authenticated
 *   - main content area (router outlet) with mobile-first max width
 *   - sticky bottom BottomNav (Feed, Wallet, Redeem, Leaderboard, Profile)
 *   - Caffeine attribution footer
 *
 * Page tasks render inside `<Outlet />`; they should not re-render the header
 * or nav. The layout owns the structural zones defined in DESIGN.md.
 */
import BottomNav from "@/components/BottomNav";
import CoinHeader from "@/components/CoinHeader";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Outlet } from "@tanstack/react-router";
import { LogIn, X } from "lucide-react";
import { useState } from "react";

function GuestBanner() {
  const { isSignedIn, signIn, isLoggingIn } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (isSignedIn || dismissed) return null;

  return (
    <output
      data-ocid="guest_banner"
      className={cn("mx-auto max-w-md px-4 pt-3")}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-accent/30",
          "bg-accent/10 px-3 py-2.5 text-sm",
        )}
      >
        <LogIn className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
        <p className="min-w-0 flex-1 text-muted-foreground">
          <span className="font-semibold text-foreground">Guest mode.</span>{" "}
          Sign in with Internet Identity to start earning coins.
        </p>
        <button
          type="button"
          data-ocid="guest_banner.sign_in"
          onClick={signIn}
          disabled={isLoggingIn}
          className={cn(
            "shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground",
            "transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-50",
          )}
        >
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          data-ocid="guest_banner.dismiss"
          aria-label="Dismiss sign-in prompt"
          onClick={() => setDismissed(true)}
          className={cn(
            "shrink-0 rounded-full p-1 text-muted-foreground",
            "transition-smooth hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </output>
  );
}

function AttributionFooter() {
  const currentYear = new Date().getFullYear();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const href = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(host)}`;
  return (
    <footer className="mx-auto max-w-md px-4 py-6 text-center">
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-xs text-muted-foreground transition-smooth hover:text-foreground"
      >
        © {currentYear}. Built with love using caffeine.ai
      </a>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <CoinHeader />
      <GuestBanner />
      <main
        data-ocid="page_content"
        className="mx-auto w-full max-w-md flex-1 px-4 py-4"
      >
        <Outlet />
      </main>
      <AttributionFooter />
      <BottomNav />
    </div>
  );
}

export default Layout;
