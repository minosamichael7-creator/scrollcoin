import Rewards "../lib/rewards";
import Types "../types/rewards";

// Exposes the public API of the rewards domain. All 12 endpoints delegate to
// lib/rewards.mo, passing the shared RewardsState in as a parameter so the
// mixin reads and writes the same stable state owned by the actor.
mixin (rewardsState : Rewards.RewardsState) {
  // Sign in or register a user; returns the user's profile.
  public shared ({ caller }) func signIn(username : Text) : async Types.UserProfile {
    Rewards.signInOrRegister(rewardsState, caller, username);
  };

  // Get the calling user's profile.
  public shared ({ caller }) func getProfile() : async ?Types.UserProfile {
    Rewards.getProfile(rewardsState, caller);
  };

  // Record a scroll milestone and award coins; returns the award or an error.
  public shared ({ caller }) func recordScrollMilestone(sessionId : Nat, milestone : Nat) : async Types.AwardResult {
    Rewards.recordScrollMilestone(rewardsState, caller, sessionId, milestone);
  };

  // Get the calling user's wallet balance summary.
  public shared ({ caller }) func getWallet() : async { totalCoins : Nat; todayEarnings : Nat; lifetimeEarnings : Nat } {
    Rewards.getWallet(rewardsState, caller);
  };

  // Get the calling user's earnings history.
  public shared ({ caller }) func getEarningsHistory() : async [Types.CoinAward] {
    Rewards.getEarningsHistory(rewardsState, caller);
  };

  // Get the calling user's streak information.
  public shared ({ caller }) func getStreak() : async { streakCount : Nat; streakFreezeCount : Nat; lastActiveDate : Types.Date } {
    Rewards.getStreak(rewardsState, caller);
  };

  // Get the calling user's daily goal for a given date.
  public shared ({ caller }) func getDailyGoal(date : Types.Date) : async ?Types.DailyGoal {
    Rewards.getDailyGoal(rewardsState, caller, date);
  };

  // Redeem a reward; returns the redemption record or an error.
  public shared ({ caller }) func redeemReward(rewardId : Nat) : async Types.RedeemResult {
    Rewards.redeemReward(rewardsState, caller, rewardId);
  };

  // List all available reward items.
  public query func getRewards() : async [Types.RewardItem] {
    Rewards.getRewards();
  };

  // Get the weekly earnings leaderboard.
  public query func getLeaderboard() : async [Types.LeaderboardEntry] {
    Rewards.getLeaderboard(rewardsState);
  };

  // Get all achievement definitions.
  public query func getAchievements() : async [Types.Achievement] {
    Rewards.getAchievements();
  };

  // Get a paginated slice of feed content for the endless scroll feed.
  // An optional category filter narrows the slice to a single category
  // (e.g. "finance"); pass `null` to return items across all categories.
  // This matches the frontend's `getFeedContent(offset, limit, category?)`
  // call shape so the main feed's category chip row can filter server-side.
  public query func getFeedContent(offset : Nat, limit : Nat, category : ?Text) : async [Types.FeedContent] {
    Rewards.getFeedContent(offset, limit, category);
  };

  // Get a paginated slice of feed content filtered by category.
  // Pass an empty Text to return all categories (the "All" chip).
  public query func getFeedContentByCategory(category : Text, offset : Nat, limit : Nat) : async [Types.FeedContent] {
    Rewards.getFeedContentByCategory(category, offset, limit);
  };

  // ---------------------------------------------------------------------------
  // Shop products, e-books, and lessons (contract stubs — develop wave fills
  // in the actual catalog data and logic).
  // ---------------------------------------------------------------------------

  // Get a paginated slice of shop products redeemable with coins.
  public query func getProducts(offset : Nat, limit : Nat) : async [Types.Product] {
    Rewards.getProducts(offset, limit);
  };

  // Get a single shop product by id.
  public query func getProduct(id : Nat) : async ?Types.Product {
    Rewards.getProduct(id);
  };

  // Redeem a shop product for the calling user with coins; returns the
  // product redemption record or an error.
  public shared ({ caller }) func redeemProduct(productId : Nat) : async Types.RedeemProductResult {
    Rewards.redeemProduct(rewardsState, caller, productId);
  };

  // Get a paginated slice of free-to-read e-books.
  public query func getEbooks(offset : Nat, limit : Nat) : async [Types.Ebook] {
    Rewards.getEbooks(offset, limit);
  };

  // Get a single e-book by id.
  public query func getEbook(id : Nat) : async ?Types.Ebook {
    Rewards.getEbook(id);
  };

  // Get a paginated slice of income-learning lessons.
  public query func getLessons(offset : Nat, limit : Nat) : async [Types.Lesson] {
    Rewards.getLessons(offset, limit);
  };

  // Get a single lesson by id.
  public query func getLesson(id : Nat) : async ?Types.Lesson {
    Rewards.getLesson(id);
  };
};
