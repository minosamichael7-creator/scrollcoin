/**
 * BottomNav — mobile-first pill navigation bar.
 *
 * Fixed to the bottom of the viewport on mobile, sticky on larger screens.
 * Nine destinations (Feed, Reels, Shop, AI News, Learn, Finance, Wallet,
 * Redeem, Profile) with the active route highlighted in gold. Each item is a
 * real router link, so it works with middle-click and keyboard navigation.
 *
 * With nine tabs the pill row is wider than a mobile viewport, so the row
 * scrolls horizontally using the `nav-pill-scroll` utility (hidden scrollbar)
 * and each pill is a fixed shrink-0 width so the active pill stays legible.
 */
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  LineChart,
  ListOrdered,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  Video,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  /** Route path, e.g. `/wallet`. */
  to: string;
  /** Accessible label and tooltip. */
  label: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Deterministic test marker. */
  ocid: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Feed", icon: ListOrdered, ocid: "nav.feed" },
  { to: "/reels", label: "Reels", icon: Video, ocid: "nav.reels" },
  { to: "/shop", label: "Shop", icon: ShoppingBag, ocid: "nav.shop" },
  { to: "/ainews", label: "AI News", icon: Bot, ocid: "nav.ainews" },
  { to: "/learn", label: "Learn", icon: BookOpen, ocid: "nav.learn" },
  { to: "/finance", label: "Finance", icon: LineChart, ocid: "nav.finance" },
  { to: "/wallet", label: "Wallet", icon: Wallet, ocid: "nav.wallet" },
  { to: "/redeem", label: "Redeem", icon: Sparkles, ocid: "nav.redeem" },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    ocid: "nav.leaderboard",
  },
  { to: "/profile", label: "Profile", icon: User, ocid: "nav.profile" },
];

function isActive(currentPath: string, to: string): boolean {
  if (to === "/") return currentPath === "/";
  return currentPath === to || currentPath.startsWith(`${to}/`);
}

export function BottomNav() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <nav
      aria-label="Primary"
      data-ocid="bottom_nav"
      className={cn(
        "sticky bottom-0 z-40 w-full",
        "border-t border-border bg-card/95 backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul
        className={cn(
          "mx-auto flex max-w-md items-stretch gap-1 overflow-x-auto px-2 py-2",
          "nav-pill-scroll",
        )}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(currentPath, item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="shrink-0">
              <Link
                to={item.to}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                data-ocid={item.ocid}
                className={cn(
                  "group flex min-h-[44px] w-[68px] flex-col items-center justify-center gap-1 rounded-full px-1.5 py-1.5",
                  "transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-smooth",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
