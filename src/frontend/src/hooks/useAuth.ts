/**
 * Authentication surface built on Internet Identity.
 *
 * Exposes the principal (when signed in), sign-in / sign-out actions, and the
 * raw II status flags. Page tasks should consume `useAuth` rather than
 * `useInternetIdentity` directly so the auth contract stays stable.
 */
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMemo } from "react";

export interface UseAuth {
  /** True when the user holds a valid, non-anonymous identity. */
  isSignedIn: boolean;
  /** The textual principal of the signed-in identity, or `null`. */
  principal: string | null;
  /** Trigger the Internet Identity sign-in popup. */
  signIn: () => void;
  /** Clear the stored identity (sign out). */
  signOut: () => void;
  /** Raw II status flags for fine-grained UI (loading spinners, errors). */
  isInitializing: boolean;
  isLoggingIn: boolean;
  isLoginError: boolean;
  loginError?: Error;
}

export function useAuth(): UseAuth {
  const {
    isAuthenticated,
    identity,
    login,
    clear,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  } = useInternetIdentity();

  const principal = useMemo(
    () => (identity ? identity.getPrincipal().toText() : null),
    [identity],
  );

  return {
    isSignedIn: isAuthenticated,
    principal,
    signIn: login,
    signOut: clear,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  };
}
