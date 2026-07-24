/**
 * SignInPrompt — guest-mode call-to-action for the Profile page.
 *
 * Shown when the user is not authenticated. Explains the value of signing in
 * (earning coins, streaks, achievements) and offers a single primary action:
 * sign in with Internet Identity. After II auth succeeds, the user picks a
 * username to register their backend profile.
 *
 * The component owns the full guest → registered flow:
 *   1. Trigger II login via `useAuth.signIn`.
 *   2. Once authenticated, collect a username and call `useSignIn` to register.
 */
import { useAuth } from "@/hooks/useAuth";
import { useSignIn } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Coins, Flame, LogIn, Sparkles, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { FormEvent } from "react";

const VALUE_PROPS = [
  {
    icon: Coins,
    title: "Earn coins",
    body: "Every scroll milestone pays gold into your wallet.",
    accent: "text-primary",
  },
  {
    icon: Flame,
    title: "Build streaks",
    body: "Show up daily to grow your streak and unlock freeze shields.",
    accent: "text-accent",
  },
  {
    icon: Trophy,
    title: "Unlock achievements",
    body: "Collect badges as you hit earning and streak milestones.",
    accent: "text-success",
  },
] as const;

export function SignInPrompt() {
  const { isSignedIn, signIn, isLoggingIn, isLoginError, loginError } =
    useAuth();
  const signInMutation = useSignIn();
  const [username, setUsername] = useState("");

  // Step 1: not yet authenticated via Internet Identity.
  if (!isSignedIn) {
    return (
      <section
        data-ocid="profile.signin_prompt"
        className="rounded-2xl border border-border bg-card p-6 shadow-subtle"
      >
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              "bg-primary/15 text-primary",
            )}
          >
            <LogIn className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            Sign in to start earning
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You're browsing as a guest. Sign in with Internet Identity to claim
            your coins, streaks, and achievements.
          </p>

          {isLoginError && (
            <p
              data-ocid="profile.signin_error"
              role="alert"
              className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {loginError?.message ?? "Sign-in failed. Please try again."}
            </p>
          )}

          <button
            type="button"
            data-ocid="profile.signin_button"
            onClick={signIn}
            disabled={isLoggingIn}
            className={cn(
              "mt-5 w-full rounded-full bg-primary px-5 py-3",
              "font-display text-sm font-semibold text-primary-foreground",
              "transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-60",
            )}
          >
            {isLoggingIn ? "Connecting…" : "Sign in with Internet Identity"}
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <li
                key={prop.title}
                className="flex items-start gap-3 rounded-xl bg-background/60 p-3"
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", prop.accent)}
                  strokeWidth={2.5}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {prop.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{prop.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  // Step 2: II authenticated but backend profile not yet registered.
  return (
    <motion.section
      data-ocid="profile.register_prompt"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-subtle"
    >
      <div className="flex flex-col items-center text-center">
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary/15 text-primary",
          )}
        >
          <Sparkles className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
          Pick your username
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a display name to create your earning profile.
        </p>
      </div>

      <form
        className="mt-5 space-y-3"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const trimmed = username.trim();
          if (trimmed.length === 0 || signInMutation.isPending) return;
          signInMutation.mutate(trimmed);
        }}
      >
        <label
          htmlFor="profile-username"
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Username
        </label>
        <input
          id="profile-username"
          data-ocid="profile.username_input"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. coin_hoarder"
          maxLength={24}
          autoComplete="off"
          required
          className={cn(
            "w-full rounded-xl border border-input bg-background px-4 py-3",
            "font-body text-sm text-foreground placeholder:text-muted-foreground",
            "transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />

        {signInMutation.isError && (
          <p
            data-ocid="profile.register_error"
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
          >
            {signInMutation.error instanceof Error
              ? signInMutation.error.message
              : "Registration failed. Please try again."}
          </p>
        )}

        <button
          type="submit"
          data-ocid="profile.register_button"
          disabled={signInMutation.isPending || username.trim().length === 0}
          className={cn(
            "w-full rounded-full bg-primary px-5 py-3",
            "font-display text-sm font-semibold text-primary-foreground",
            "transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-60",
          )}
        >
          {signInMutation.isPending ? "Creating profile…" : "Create profile"}
        </button>
      </form>
    </motion.section>
  );
}

export default SignInPrompt;
