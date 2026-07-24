/**
 * App — router configuration and provider wiring.
 *
 * The foundation owns the route tree and the Layout shell; each page module
 * owns its own implementation. The `/finance` route points at the real
 * `@/pages/FinancePage` module, which renders finance-category content with
 * the same infinite-scroll pagination and coin-milestone behavior as the
 * main feed.
 *
 * The four new content tabs (Reels, Shop, AI News, Learn) currently point at
 * minimal placeholder pages; full implementations land in a later wave.
 *
 * Uses a hash-based history so the SPA works when served from a canister
 * without server-side route handling.
 */
import Layout from "@/components/Layout";
import AINewsPage from "@/pages/AINewsPage";
import FeedPage from "@/pages/FeedPage";
import FinancePage from "@/pages/FinancePage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import LearnPage from "@/pages/LearnPage";
import ProfilePage from "@/pages/ProfilePage";
import RedeemPage from "@/pages/RedeemPage";
import ReelsPage from "@/pages/ReelsPage";
import ShopPage from "@/pages/ShopPage";
import WalletPage from "@/pages/WalletPage";
import {
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FeedPage,
});

const reelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reels",
  component: ReelsPage,
});

const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop",
  component: ShopPage,
});

const ainewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ainews",
  component: AINewsPage,
});

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/learn",
  component: LearnPage,
});

const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/finance",
  component: FinancePage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const redeemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/redeem",
  component: RedeemPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  reelsRoute,
  shopRoute,
  ainewsRoute,
  learnRoute,
  financeRoute,
  walletRoute,
  redeemRoute,
  leaderboardRoute,
  profileRoute,
]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
