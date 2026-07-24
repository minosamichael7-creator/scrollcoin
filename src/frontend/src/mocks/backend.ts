/**
 * Mock backend for visual QA and frontend-only iteration.
 *
 * Loaded automatically by `@caffeineai/core-infrastructure` when
 * `VITE_USE_MOCK=true`. Implements the subset of `backendInterface` methods
 * the app actually calls so pages render realistic content without a live
 * canister. Finance items include both crypto and forex sub-types so the
 * finance badge + sub-type cue (crypto/forex) is verifiable.
 */
import { FeedContentType, LessonDifficulty, RewardsError, UserRole } from "@/backend";
import type { backendInterface } from "@/backend";

/** Build a deterministic feed item. */
function feedItem(
  id: number,
  category: string,
  contentType: FeedContentType,
  title: string,
  body: string,
  imageUrl = "",
): {
  id: bigint;
  title: string;
  contentType: FeedContentType;
  body: string;
  imageUrl: string;
  category: string;
} {
  return {
    id: BigInt(id),
    title,
    contentType,
    body,
    imageUrl,
    category,
  };
}

/** A rotating pool of feed content across categories, with finance first. */
const ALL_ITEMS: ReturnType<typeof feedItem>[] = [
  // Finance — crypto
  feedItem(
    1,
    "finance",
    FeedContentType.finance,
    "Bitcoin halving cycle: what on-chain data signals next",
    "Bitcoin's fourth halving tightened issuance. On-chain staking flows and layer-2 activity suggest the next supply shock may arrive earlier than prior cycles.",
  ),
  // Finance — forex
  feedItem(
    2,
    "finance",
    FeedContentType.finance,
    "EUR/USD holds above 1.08 as dollar softens ahead of rate decision",
    "The euro climbed against a softer dollar as traders weighed a central bank rate decision. Safe-haven demand eased in a risk-on session.",
  ),
  // Finance — crypto
  feedItem(
    3,
    "finance",
    FeedContentType.finance,
    "Ethereum staking yields steady as layer-2 TVL climbs",
    "Ethereum staking rewards held firm while layer-2 token inflows rose, supporting on-chain security and stablecoin liquidity.",
  ),
  // Finance — forex
  feedItem(
    4,
    "finance",
    FeedContentType.finance,
    "USD/JPY tests intervention zone as yen weakens",
    "The dollar pushed the yen toward levels that previously drew central bank intervention, with sterling and euro also firming against the yen.",
  ),
  // Finance — crypto
  feedItem(
    5,
    "finance",
    FeedContentType.finance,
    "Stablecoin flows hint at risk-on rotation",
    "Stablecoin exchange inflows rose, often a precursor to risk-on crypto positioning as traders prepare to deploy capital into altcoins.",
  ),
  // Self-improvement
  feedItem(
    6,
    "self-improvement",
    FeedContentType.article,
    "The 2-minute rule for beating procrastination",
    "When a task takes less than two minutes, do it now. Shrinking the starting friction is the single highest-leverage habit change you can make.",
  ),
  // Fun facts
  feedItem(
    7,
    "fun-facts",
    FeedContentType.funfact,
    "Honey never spoils",
    "Pots of honey sealed in ancient Egyptian tombs remained edible after 3,000 years thanks to low moisture and natural acidity.",
  ),
  // Productivity
  feedItem(
    8,
    "productivity",
    FeedContentType.article,
    "Time-block your day in 90-minute sprints",
    "Ultradian rhythms make 90 minutes the natural focus unit. Pair each sprint with a 20-minute recovery to sustain output without burnout.",
  ),
  // Wellness
  feedItem(
    9,
    "wellness",
    FeedContentType.article,
    "Box breathing to reset your nervous system",
    "Inhale 4, hold 4, exhale 4, hold 4. Two minutes of box breathing lowers heart rate and clears stress fog before high-stakes moments.",
  ),
  // Nature
  feedItem(
    10,
    "nature",
    FeedContentType.image,
    "Bioluminescent bays glow under a new moon",
    "When dinoflagellates concentrate in warm, sheltered bays, each paddle stroke sparks blue fire. New-moon nights give the brightest shows.",
  ),
  // Psychology
  feedItem(
    11,
    "psychology",
    FeedContentType.article,
    "The anchoring effect skews every negotiation",
    "The first number mentioned sets an invisible reference point. Naming your number first — or refusing theirs — reclaims the frame.",
  ),
  // Learning
  feedItem(
    12,
    "learning",
    FeedContentType.article,
    "Feynman technique: explain it to a child",
    "If you can't teach a concept in plain words, you don't understand it yet. Gaps surface fastest when you strip away the jargon.",
  ),
  // More finance — forex
  feedItem(
    13,
    "finance",
    FeedContentType.finance,
    "Dollar index (DXY) slips as risk-off fades",
    "A broad dollar index eased as safe-haven flows reversed. Euro and sterling gained, while the yen lagged on yield differentials.",
  ),
  // More finance — crypto
  feedItem(
    14,
    "finance",
    FeedContentType.finance,
    "Altcoin season watch: token rotation accelerates",
    "Bitcoin dominance stalled as capital rotated into select altcoins. On-chain staking and layer-2 launches are the main catalysts.",
  ),
  // More finance — forex
  feedItem(
    15,
    "finance",
    FeedContentType.finance,
    "GBP/USD rallies on sterling strength, euro follows",
    "Sterling led gains against the dollar, with the euro tracking higher. Traders eyed a central bank rate decision for the next directional cue.",
  ),
  // Reels — short vertical videos with @creator handles in the body
  feedItem(
    16,
    "reels",
    FeedContentType.reel,
    "60-second crypto wallet setup",
    "@coincoach - Set up a non-custodial wallet in under a minute. Save this reel before you start.",
  ),
  feedItem(
    17,
    "reels",
    FeedContentType.reel,
    "Forex candlestick patterns that actually work",
    "@fxflow - Three candlestick patterns every new trader should recognize on the daily chart.",
  ),
  feedItem(
    18,
    "reels",
    FeedContentType.reel,
    "Side hustle: flip thrift finds online",
    "@hustleharper - I turned a $4 jacket into $80. Here's the exact playbook.",
  ),
  feedItem(
    19,
    "reels",
    FeedContentType.reel,
    "Passive income myth-busting",
    "@moneymind - Most 'passive' income takes real upfront work. Let's break down what's real.",
  ),
  feedItem(
    20,
    "reels",
    FeedContentType.reel,
    "Budget like a Gen Z pro",
    "@budgetbabe - The 50/30/20 rule but make it actually work on a starter salary.",
  ),
  // AI News — bodies follow "<source> - <read-time>\n<snippet>"
  feedItem(
    21,
    "ainews",
    FeedContentType.ainews,
    "OpenAI ships cheaper GPT-4o tier for indie builders",
    "TechCrunch - 3 min read\nThe new pricing tier targets solo developers shipping AI apps under cost pressure, with usage-based discounts for high-volume callers.",
  ),
  feedItem(
    22,
    "ainews",
    FeedContentType.ainews,
    "Open-source LLM closes the gap with frontier models",
    "The Verge - 4 min read\nA new open-weights model matches proprietary benchmarks on reasoning tasks, lowering the barrier for startups building AI features.",
  ),
  feedItem(
    23,
    "ainews",
    FeedContentType.ainews,
    "How teens are earning with AI art tools",
    "Wired - 5 min read\nGen Z creators are turning AI image generators into side income by selling custom stickers, prints, and design commissions.",
  ),
  feedItem(
    24,
    "ainews",
    FeedContentType.ainews,
    "AI agents automate the boring parts of freelancing",
    "Fast Company - 3 min read\nNew agent platforms handle invoicing, follow-ups, and research, freeing solo earners to focus on billable work.",
  ),
  feedItem(
    25,
    "ainews",
    FeedContentType.ainews,
    "Prompt engineering is the new part-time job",
    "MIT Tech Review - 6 min read\nA growing gig market pays for structured prompts that reliably steer LLMs toward business-ready output.",
  ),
];

/** Slice the pool by category and offset/limit, returning a page of items. */
function page(
  offset: bigint,
  limit: bigint,
  category: string | null,
): ReturnType<typeof feedItem>[] {
  const pool = category
    ? ALL_ITEMS.filter((i) => i.category === category)
    : ALL_ITEMS;
  const start = Number(offset);
  const end = start + Number(limit);
  return pool.slice(start, end);
}

export const mockBackend: backendInterface = {
  _initialize_access_control: async () => undefined,
  _internet_identity_sign_in_start: async () => new Uint8Array(),
  _internet_identity_sign_in_finish: async () => ({ __kind__: "ok", ok: null }),
  assignCallerUserRole: async () => undefined,
  execute: async () => ({ hasMore: false, rows: [] }),
  getAchievements: async () => [],
  getCallerUserRole: async () => UserRole.guest,
  getDailyGoal: async () => ({
    date: BigInt(20260724),
    completed: false,
    earnedCoins: 40n,
    targetCoins: 200n,
  }),
  getEarningsHistory: async () => [],
  getFeedContent: async (offset, limit, category) =>
    page(offset, limit, category),
  getFeedContentByCategory: async (category, offset, limit) =>
    page(offset, limit, category),
  getLeaderboard: async () => [],
  getProfile: async () => null,
  getRewards: async () => [],
  getStreak: async () => ({
    lastActiveDate: BigInt(20260724),
    streakFreezeCount: 0n,
    streakCount: 3n,
  }),
  getWallet: async () => ({
    totalCoins: 120n,
    lifetimeEarnings: 120n,
    todayEarnings: 40n,
  }),
  isCallerAdmin: async () => false,
  recordScrollMilestone: async (_sessionId, milestone) => ({
    __kind__: "ok",
    ok: {
      id: milestone,
      sourceSessionId: _sessionId,
      timestamp: BigInt(Date.now()) * 1_000_000n,
      amount: 10n,
      reason: `Scroll milestone ${milestone.toString()}`,
    },
  }),
  redeemReward: async () => ({ __kind__: "err", err: RewardsError.insufficientCoins }),
  redeemProduct: async (productId) => ({
    __kind__: "ok",
    ok: {
      id: BigInt(Date.now()),
      redeemedAt: BigInt(Date.now()) * 1_000_000n,
      userId: "2vxsx-fae" as never,
      productId,
    },
  }),
  getProducts: async (offset, limit) => {
    const all = [
      {
        id: 1n,
        title: "ScrollCoin Sticker Pack",
        description: "A pack of glossy ScrollCoin stickers for your laptop.",
        imageUrl: "",
        category: "merch",
        priceCoins: 50n,
      },
      {
        id: 2n,
        title: "Premium Feed Theme",
        description: "Unlock the warm-gold premium feed theme for 30 days.",
        imageUrl: "",
        category: "digital",
        priceCoins: 120n,
      },
      {
        id: 3n,
        title: "$5 Coffee Gift Card",
        description: "Redeem coins for a $5 coffee gift card.",
        imageUrl: "",
        category: "gift-card",
        priceCoins: 500n,
      },
    ];
    const start = Number(offset);
    return all.slice(start, start + Number(limit));
  },
  getProduct: async (id) => {
    const all = [
      {
        id: 1n,
        title: "ScrollCoin Sticker Pack",
        description: "A pack of glossy ScrollCoin stickers for your laptop.",
        imageUrl: "",
        category: "merch",
        priceCoins: 50n,
      },
    ];
    return all.find((p) => p.id === id) ?? null;
  },
  getEbooks: async (offset, limit) => {
    const all = [
      {
        id: 1n,
        title: "Crypto Basics for Gen Z",
        description: "A plain-words intro to Bitcoin, Ethereum, and wallets.",
        fullText:
          "Crypto is digital money on a public ledger. This ebook walks through wallets, keys, and your first on-chain transaction.",
        author: "ScrollCoin Learn",
        category: "finance",
        coverUrl: "",
      },
      {
        id: 2n,
        title: "Side Hustles That Actually Pay",
        description: "Twelve income ideas ranked by effort vs. reward.",
        fullText:
          "Not every side hustle is worth your time. This ebook ranks twelve by hourly rate, startup cost, and skill ceiling.",
        author: "ScrollCoin Learn",
        category: "earning",
        coverUrl: "",
      },
    ];
    const start = Number(offset);
    return all.slice(start, start + Number(limit));
  },
  getEbook: async (id) => {
    const all = [
      {
        id: 1n,
        title: "Crypto Basics for Gen Z",
        description: "A plain-words intro to Bitcoin, Ethereum, and wallets.",
        fullText:
          "Crypto is digital money on a public ledger. This ebook walks through wallets, keys, and your first on-chain transaction.",
        author: "ScrollCoin Learn",
        category: "finance",
        coverUrl: "",
      },
    ];
    return all.find((e) => e.id === id) ?? null;
  },
  getLessons: async (offset, limit) => {
    const all = [
      {
        id: 1n,
        title: "Your first crypto wallet",
        difficulty: LessonDifficulty.beginner,
        description: "Set up a non-custodial wallet and back up your seed phrase safely.",
        steps: [
          "Pick a wallet app with non-custodial keys.",
          "Write your seed phrase on paper, offline.",
          "Send a small test transaction before larger amounts.",
        ],
        category: "finance",
      },
      {
        id: 2n,
        title: "Reading a forex candlestick chart",
        difficulty: LessonDifficulty.intermediate,
        description: "Decode candle bodies, wicks, and common reversal patterns.",
        steps: [
          "Identify bullish vs. bearish candles by body color.",
          "Read wicks as rejection of price extremes.",
          "Spot a doji as indecision before a move.",
        ],
        category: "finance",
      },
    ];
    const start = Number(offset);
    return all.slice(start, start + Number(limit));
  },
  getLesson: async (id) => {
    const all = [
      {
        id: 1n,
        title: "Your first crypto wallet",
        difficulty: LessonDifficulty.beginner,
        description: "Set up a non-custodial wallet and back up your seed phrase safely.",
        steps: [
          "Pick a wallet app with non-custodial keys.",
          "Write your seed phrase on paper, offline.",
          "Send a small test transaction before larger amounts.",
        ],
        category: "finance",
      },
    ];
    return all.find((l) => l.id === id) ?? null;
  },
  schema: async () => "{}",
  signIn: async (username) => ({
    principal: "2vxsx-fae" as never,
    username,
    joinDate: BigInt(20260724),
    totalCoins: 120n,
    lifetimeEarnings: 120n,
    lastActiveDate: BigInt(20260724),
    todayEarnings: 40n,
    achievements: [],
    streakFreezeCount: 0n,
    streakCount: 3n,
  }),
};
