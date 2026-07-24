/**
 * ProfilePage — the signed-in user's profile and lifetime stats.
 *
 * When authenticated and registered, shows:
 *   - username + truncated principal
 *   - join date and current streak badge
 *   - lifetime stats grid (ProfileStats)
 *   - unlocked achievements summary
 *   - sign-out button
 *
 * When not authenticated (guest), renders the SignInPrompt CTA instead.
 * When authenticated via Internet Identity but not yet registered on the
 * backend (no profile), the SignInPrompt handles username registration.
 */
import { ProfileStats, buildProfileStats } from "@/components/ProfileStats";
import SignInPrompt from "@/components/SignInPrompt";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements, useProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Achievement, UserProfile } from "@/types/rewards";
import { CalendarDays, Flame, Lock, LogOut } from "lucide-react";
import { motion } from "motion/react";

/** Format a yyyymmdd bigint as a human-readable date. */
function formatJoinDate(joinDate: bigint): string {
  const n = Number(joinDate);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const yyyy = Math.floor(n / 10000);
  const mm = Math.floor((n % 10000) / 100);
  const dd = n % 100;
  if (yyyy < 1970 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return "—";
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Truncate a principal string to a readable ID. */
function truncatePrincipal(principal: string): string {
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

function ProfileHeader({ profile }: { profile: UserProfile }) {
  const { principal: authPrincipal } = useAuth();
  const principalText = profile.principal?.toText?.() ?? authPrincipal ?? "—";
  const hasActiveStreak = profile.streakCount > 0n;

  return (
    <header className="flex flex-col items-center text-center">
      <span
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full",
          "bg-gradient-coin text-3xl font-bold text-primary-foreground shadow-coin",
        )}
        aria-hidden="true"
      >
        {profile.username.slice(0, 2).toUpperCase()}
      </span>
      <h1
        data-ocid="profile.username"
        className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground"
      >
        {profile.username}
      </h1>
      <p
        data-ocid="profile.principal"
        className="mt-1 font-mono text-xs text-muted-foreground"
        title={principalText}
      >
        {truncatePrincipal(principalText)}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border",
            "bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground",
          )}
        >
          <CalendarDays
            className="h-3.5 w-3.5 text-muted-foreground"
            strokeWidth={2.5}
          />
          Joined {formatJoinDate(profile.joinDate)}
        </span>
        <span
          data-ocid="profile.streak_badge"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
            "text-xs font-semibold",
            hasActiveStreak
              ? "border-accent/30 bg-accent/15 text-accent"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          <Flame
            className={cn("h-3.5 w-3.5", hasActiveStreak && "animate-pulse")}
            strokeWidth={2.5}
          />
          {Number(profile.streakCount)}-day streak
        </span>
      </div>
    </header>
  );
}

function AchievementsSummary({
  unlockedIds,
  catalog,
}: {
  unlockedIds: bigint[];
  catalog: Achievement[];
}) {
  const unlockedSet = new Set(unlockedIds.map((id) => Number(id)));
  const unlocked = catalog.filter((achievement) =>
    unlockedSet.has(Number(achievement.id)),
  );
  const locked = catalog.filter(
    (achievement) => !unlockedSet.has(Number(achievement.id)),
  );

  if (catalog.length === 0) {
    return (
      <section data-ocid="profile.achievements" className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          Achievements
        </h2>
        <p className="text-sm text-muted-foreground">
          Achievement definitions are loading.
        </p>
      </section>
    );
  }

  return (
    <section data-ocid="profile.achievements" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          Achievements
        </h2>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {unlocked.length}/{catalog.length} unlocked
        </span>
      </div>

      {unlocked.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {unlocked.map((achievement) => (
            <li
              key={achievement.id.toString()}
              data-ocid={`profile.achievement.${achievement.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-success/30",
                "bg-success/10 p-3 shadow-subtle",
              )}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-xl"
                aria-hidden="true"
              >
                {achievement.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {achievement.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {locked.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {locked.map((achievement) => (
            <li
              key={achievement.id.toString()}
              data-ocid={`profile.achievement_locked.${achievement.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border",
                "bg-card/60 p-3",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-muted text-muted-foreground grayscale",
                )}
                aria-hidden="true"
              >
                <Lock className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-muted-foreground">
                  {achievement.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <button
      type="button"
      data-ocid="profile.signout_button"
      onClick={signOut}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-full",
        "border border-border bg-card px-5 py-3",
        "font-display text-sm font-semibold text-foreground",
        "transition-smooth hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <LogOut className="h-4 w-4" strokeWidth={2.5} />
      Sign out
    </button>
  );
}

export function ProfilePage() {
  const { isSignedIn } = useAuth();
  const profileQuery = useProfile();
  const achievementsQuery = useAchievements();

  // Guest or not yet II-authenticated → show the sign-in CTA.
  if (!isSignedIn) {
    return (
      <section data-ocid="page.profile" className="space-y-6">
        <SignInPrompt />
      </section>
    );
  }

  // Authenticated via II but backend profile not loaded / not registered yet.
  if (profileQuery.isLoading) {
    return (
      <section data-ocid="page.profile" className="space-y-6">
        <div
          data-ocid="profile.loading_state"
          className="rounded-2xl border border-border bg-card p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </div>
      </section>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    // II authenticated but no backend profile → register a username.
    return (
      <section data-ocid="page.profile" className="space-y-6">
        <SignInPrompt />
      </section>
    );
  }

  const catalog = achievementsQuery.data ?? [];
  const unlockedCount = profile.achievements.length;

  const stats = buildProfileStats({
    totalCoins: profile.totalCoins,
    lifetimeEarnings: profile.lifetimeEarnings,
    todayEarnings: profile.todayEarnings,
    streakCount: profile.streakCount,
    streakFreezeCount: profile.streakFreezeCount,
    achievementsUnlocked: unlockedCount,
    achievementsTotal: catalog.length,
  });

  return (
    <section data-ocid="page.profile" className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ProfileHeader profile={profile} />
      </motion.div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-foreground">
          Lifetime stats
        </h2>
        <ProfileStats stats={stats} />
      </div>

      <AchievementsSummary
        unlockedIds={profile.achievements}
        catalog={catalog}
      />

      <SignOutButton />
    </section>
  );
}

export default ProfilePage;
