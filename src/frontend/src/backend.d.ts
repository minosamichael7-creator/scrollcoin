import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ProductRedemption {
    id: bigint;
    redeemedAt: Timestamp;
    userId: UserId;
    productId: bigint;
}
export interface LeaderboardEntry {
    weeklyEarnings: bigint;
    username: string;
    rank: bigint;
    user: UserId;
}
export type Timestamp = bigint;
export interface CoinAward {
    id: bigint;
    sourceSessionId: bigint;
    timestamp: Timestamp;
    amount: bigint;
    reason: string;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type RedeemProductResult = {
    __kind__: "ok";
    ok: ProductRedemption;
} | {
    __kind__: "err";
    err: RewardsError;
};
export interface RewardItem {
    id: bigint;
    title: string;
    description: string;
    category: string;
    image: string;
    coinPrice: bigint;
}
export interface Achievement {
    id: AchievementId;
    title: string;
    icon: string;
    description: string;
    unlockedThreshold: bigint;
}
export type AwardResult = {
    __kind__: "ok";
    ok: CoinAward;
} | {
    __kind__: "err";
    err: RewardsError;
};
export interface FeedContent {
    id: bigint;
    title: string;
    contentType: FeedContentType;
    body: string;
    imageUrl: string;
    category: string;
}
export interface Lesson {
    id: bigint;
    title: string;
    difficulty: LessonDifficulty;
    description: string;
    steps: Array<string>;
    category: string;
}
export interface DailyGoal {
    date: Date_;
    completed: boolean;
    earnedCoins: bigint;
    targetCoins: bigint;
}
export type RedeemResult = {
    __kind__: "ok";
    ok: Redemption;
} | {
    __kind__: "err";
    err: RewardsError;
};
export interface Cell {
    value: Value;
    name: string;
}
export interface Ebook {
    id: bigint;
    title: string;
    description: string;
    fullText: string;
    author: string;
    category: string;
    coverUrl: string;
}
export type AchievementId = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type Date_ = bigint;
export interface Redemption {
    id: bigint;
    status: RedemptionStatus;
    userId: UserId;
    rewardId: bigint;
    timestamp: Timestamp;
    coinsDeducted: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type UserId = Principal;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface UserProfile {
    principal: UserId;
    username: string;
    joinDate: Date_;
    totalCoins: bigint;
    lifetimeEarnings: bigint;
    lastActiveDate: Date_;
    todayEarnings: bigint;
    achievements: Array<AchievementId>;
    streakFreezeCount: bigint;
    streakCount: bigint;
}
export interface Product {
    id: bigint;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    priceCoins: bigint;
}
export enum FeedContentType {
    finance = "finance",
    reel = "reel",
    article = "article",
    ebook = "ebook",
    ainews = "ainews",
    lesson = "lesson",
    image = "image",
    product = "product",
    funfact = "funfact"
}
export enum LessonDifficulty {
    intermediate = "intermediate",
    beginner = "beginner",
    advanced = "advanced"
}
export enum RedemptionStatus {
    pending = "pending",
    fulfilled = "fulfilled",
    failed = "failed"
}
export enum RewardsError {
    rewardNotFound = "rewardNotFound",
    userNotFound = "userNotFound",
    notAuthorized = "notAuthorized",
    alreadyRedeemed = "alreadyRedeemed",
    invalidInput = "invalidInput",
    notFound = "notFound",
    insufficientCoins = "insufficientCoins",
    invalidMilestone = "invalidMilestone"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getAchievements(): Promise<Array<Achievement>>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyGoal(date: Date_): Promise<DailyGoal | null>;
    getEarningsHistory(): Promise<Array<CoinAward>>;
    getEbook(id: bigint): Promise<Ebook | null>;
    getEbooks(offset: bigint, limit: bigint): Promise<Array<Ebook>>;
    getFeedContent(offset: bigint, limit: bigint, category: string | null): Promise<Array<FeedContent>>;
    getFeedContentByCategory(category: string, offset: bigint, limit: bigint): Promise<Array<FeedContent>>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getLesson(id: bigint): Promise<Lesson | null>;
    getLessons(offset: bigint, limit: bigint): Promise<Array<Lesson>>;
    getProduct(id: bigint): Promise<Product | null>;
    getProducts(offset: bigint, limit: bigint): Promise<Array<Product>>;
    getProfile(): Promise<UserProfile | null>;
    getRewards(): Promise<Array<RewardItem>>;
    getStreak(): Promise<{
        lastActiveDate: Date_;
        streakFreezeCount: bigint;
        streakCount: bigint;
    }>;
    getWallet(): Promise<{
        totalCoins: bigint;
        lifetimeEarnings: bigint;
        todayEarnings: bigint;
    }>;
    isCallerAdmin(): Promise<boolean>;
    recordScrollMilestone(sessionId: bigint, milestone: bigint): Promise<AwardResult>;
    redeemProduct(productId: bigint): Promise<RedeemProductResult>;
    redeemReward(rewardId: bigint): Promise<RedeemResult>;
    schema(): Promise<string>;
    signIn(username: string): Promise<UserProfile>;
}
