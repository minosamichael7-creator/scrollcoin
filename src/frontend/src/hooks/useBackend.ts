/**
 * Thin wrapper around the generated backend actor.
 *
 * Page tasks and hooks import `useBackendActor` (via `useBackend`) instead of
 * calling `useActor(createActor)` directly, so the actor wiring stays in one
 * place and React Query hooks can share a single actor reference.
 */
import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

export type BackendActor = ReturnType<typeof createActor>;

/**
 * Returns the live backend actor (or `null` while the agent is still
 * initializing). Call this at the top level of a hook or component — never
 * inside a query or mutation callback.
 */
export function useBackend(): {
  actor: BackendActor | null;
  isFetching: boolean;
} {
  const { actor, isFetching } = useActor(createActor);
  return { actor: actor as BackendActor | null, isFetching };
}
