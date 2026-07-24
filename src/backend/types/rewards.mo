import Result "mo:core/Result";

module {
  // Cross-cutting identifiers reused across the rewards domain.
  public type UserId = Principal;
  public type Timestamp = Int; // nanoseconds since epoch (Time.now())
  public type Date = Int; // yyyymmdd as Int for daily/streak bucketing

  // A user's profile and accumulated earnings state.
  public type UserProfile = {
    principal : UserId;
    username : Text;
    totalCoins : Nat;
    todayEarnings : Nat;
    lifetimeEarnings : Nat;
    streakCount : Nat;
    streakFreezeCount : Nat;
    lastActiveDate : Date;
    joinDate : Date;
    achievements : [AchievementId];
  };

  // A single coin award event, recorded when a milestone is hit.
  public type CoinAward = {
    id : Nat;
    amount : Nat;
    timestamp : Timestamp;
    reason : Text; // milestone label / human-readable reason
    sourceSessionId : Nat; // feed session that triggered the award
  };

  // A redeemable reward item in the catalogue.
  public type RewardItem = {
    id : Nat;
    title : Text;
    description : Text;
    coinPrice : Nat;
    category : Text;
    image : Text; // image url
  };

  // Status of a redemption request.
  public type RedemptionStatus = {
    #pending;
    #fulfilled;
    #failed;
  };

  // A redemption record for a reward by a user.
  public type Redemption = {
    id : Nat;
    userId : UserId;
    rewardId : Nat;
    timestamp : Timestamp;
    coinsDeducted : Nat;
    status : RedemptionStatus;
  };

  // A single leaderboard row.
  public type LeaderboardEntry = {
    user : UserId;
    username : Text;
    weeklyEarnings : Nat;
    rank : Nat;
  };

  // Identifier for an achievement.
  public type AchievementId = Nat;

  // An achievement definition and its unlock threshold.
  public type Achievement = {
    id : AchievementId;
    title : Text;
    description : Text;
    icon : Text;
    unlockedThreshold : Nat;
  };

  // The kind of feed content item. #finance is a distinct badge for the
  // curated crypto/forex finance news category. #reel, #product, #ainews,
  // #ebook, and #lesson extend the feed to cover short-form reels,
  // e-commerce products, AI news, free e-books, and income-learning lessons.
  public type FeedContentType = {
    #article;
    #funfact;
    #image;
    #finance;
    #reel;
    #product;
    #ainews;
    #ebook;
    #lesson;
  };

  // A piece of feed content shown in the endless scroll feed.
  public type FeedContent = {
    id : Nat;
    title : Text;
    body : Text;
    category : Text;
    imageUrl : Text;
    contentType : FeedContentType;
  };

  // A user's daily goal progress.
  public type DailyGoal = {
    targetCoins : Nat;
    earnedCoins : Nat;
    completed : Bool;
    date : Date;
  };

  // Error variants for Result-typed operations.
  public type RewardsError = {
    #userNotFound;
    #insufficientCoins;
    #rewardNotFound;
    #notFound;
    #alreadyRedeemed;
    #invalidMilestone;
    #invalidInput;
    #notAuthorized;
  };

  // Result aliases for error-handled operations.
  public type AwardResult = Result.Result<CoinAward, RewardsError>;
  public type RedeemResult = Result.Result<Redemption, RewardsError>;
  public type RedeemProductResult = Result.Result<ProductRedemption, RewardsError>;

  // Difficulty tier for an income-learning lesson.
  public type LessonDifficulty = {
    #beginner;
    #intermediate;
    #advanced;
  };

  // A shoppable product redeemable with earned coins. (No real Stripe checkout
  // or physical shipping — redemption is recorded in-app only.)
  public type Product = {
    id : Nat;
    title : Text;
    description : Text;
    imageUrl : Text;
    priceCoins : Nat;
    category : Text;
  };

  // A free-to-read e-book in the income/learning library.
  public type Ebook = {
    id : Nat;
    title : Text;
    author : Text;
    coverUrl : Text;
    description : Text;
    fullText : Text;
    category : Text;
  };

  // A step-by-step income-learning lesson.
  public type Lesson = {
    id : Nat;
    title : Text;
    difficulty : LessonDifficulty;
    description : Text;
    steps : [Text];
    category : Text;
  };

  // A record of a user redeeming a shop product with coins. Tracked separately
  // from reward redemptions (Redemption) so shop activity is queryable on its own.
  public type ProductRedemption = {
    id : Nat;
    userId : UserId;
    productId : Nat;
    redeemedAt : Timestamp;
  };
};
