/**
 * LeaderboardPage — weekly earnings leaderboard with motivational banner and
 * achievement badges.
 *
 * Composition (top to bottom, mobile-first within the max-w-md shell):
 *   1. MotivationalBanner — daily rotating earning tip
 *   2. Weekly leaderboard — ranked rows, current user highlighted in gold
 *   3. AchievementGrid — unlocked (full color) and locked (grayscale + threshold)
 *
 * Data comes from the shared React Query hooks in `@/lib/api`:
 *   - `useLeaderboard()` → LeaderboardEntry[]
 *   - `useAchievements()` → Achievement[]
 *   - `useProfile()` → UserProfile | null (identifies the current user's row
 *     and which achievements are unlocked)
 *
 * The current user's row is matched by comparing the leaderboard entry's
 * `user` principal against the signed-in profile's principal.
 */
import AchievementGrid from "@/components/AchievementGrid";
import LeaderboardRow from "@/components/LeaderboardRow";
import MotivationalBanner from "@/components/MotivationalBanner";
import { useAchievements, useLeaderboard, useProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

/** True when a leaderboard entry belongs to the signed-in caller. */
function isCurrentUserRow(
  entryUser: { toText: () => string },
  profilePrincipal: { toText: () => string } | null | undefined,
): boolean {
  if (!profilePrincipal) return false;
  return entryUser.toText() === profilePrincipal.toText();
}

export function LeaderboardPage() {
  const leaderboardQuery = useLeaderboard();
  const achievementsQuery = useAchievements();
  const profileQuery = useProfile();

  const entries = leaderboardQuery.data ?? [];
  const profile = profileQuery.data;
  const leaderboardLoading = leaderboardQuery.isLoading;
  const achievementsLoading = achievementsQuery.isLoading;

  return (
    <section data-ocid="page.leaderboard" className="space-y-5">
      <header className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" strokeWidth={2.5} />
        <h1 className="font-display text-xl font-bold text-foreground">
          Leaderboard
        </h1>
      </header>

      <MotivationalBanner />

      {/* Weekly earnings leaderboard */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-base font-bold text-foreground">
            Weekly Earnings
          </h2>
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            This week
          </span>
        </div>

        {leaderboardLoading ? (
          <ul
            data-ocid="leaderboard.loading_state"
            className="space-y-2"
            aria-label="Loading leaderboard"
          >
            {[
              "leaderboard-skeleton-0",
              "leaderboard-skeleton-1",
              "leaderboard-skeleton-2",
              "leaderboard-skeleton-3",
              "leaderboard-skeleton-4",
            ].map((skeletonKey) => (
              <li
                key={skeletonKey}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
              >
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : entries.length === 0 ? (
          <div
            data-ocid="leaderboard.empty_state"
            className={cn(
              "rounded-2xl border border-border bg-card p-6 text-center",
            )}
          >
            <Trophy
              className="mx-auto h-8 w-8 text-muted-foreground"
              strokeWidth={1.5}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              No earnings recorded this week yet. Be the first to climb the
              board!
            </p>
          </div>
        ) : (
          <ol data-ocid="leaderboard.list" className="space-y-2">
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.user.toText()}
                entry={entry}
                isCurrentUser={isCurrentUserRow(entry.user, profile?.principal)}
              />
            ))}
          </ol>
        )}
      </div>

      {/* Achievement badges grid */}
      <AchievementGrid
        achievements={achievementsQuery.data}
        profile={profile}
        isLoading={achievementsLoading}
      />
    </section>
  );
}

export default LeaderboardPage;
