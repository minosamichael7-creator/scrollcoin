/**
 * Coin balance hook backed by `getWallet`.
 *
 * Returns the user's current coin balance plus lifetime and today's earnings,
 * and a `refresh` helper for manual invalidation after milestone awards or
 * redemptions. Falls back to zero balances for guests (no actor yet).
 */
import { useBackend } from "@/hooks/useBackend";
import type { Wallet } from "@/types/rewards";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const COINS_QUERY_KEY = ["wallet"] as const;

const ZERO_WALLET: Wallet = {
  totalCoins: 0n,
  lifetimeEarnings: 0n,
  todayEarnings: 0n,
};

export interface UseCoins {
  wallet: Wallet;
  totalCoins: bigint;
  todayEarnings: bigint;
  lifetimeEarnings: bigint;
  isLoading: boolean;
  isFetching: boolean;
  /** Force a refetch of the wallet (e.g. after a milestone award). */
  refresh: () => void;
}

export function useCoins(): UseCoins {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: COINS_QUERY_KEY,
    queryFn: async (): Promise<Wallet> => {
      if (!actor) return ZERO_WALLET;
      return actor.getWallet();
    },
    enabled: !isFetching,
  });

  const wallet = query.data ?? ZERO_WALLET;

  return {
    wallet,
    totalCoins: wallet.totalCoins,
    todayEarnings: wallet.todayEarnings,
    lifetimeEarnings: wallet.lifetimeEarnings,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: COINS_QUERY_KEY });
    },
  };
}
