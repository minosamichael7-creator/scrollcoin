import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Inlined old authorization state types (self-contained: no project imports).
  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  public type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  // Inlined rewards state types — OLD shape (matches the NewActor of the
  // preceding migration 20260724_080210.mo).
  public type UserId = Principal;

  public type UserProfile = {
    principal : UserId;
    username : Text;
    totalCoins : Nat;
    todayEarnings : Nat;
    lifetimeEarnings : Nat;
    streakCount : Nat;
    streakFreezeCount : Nat;
    lastActiveDate : Int;
    joinDate : Int;
    achievements : [Nat];
  };

  public type CoinAward = {
    id : Nat;
    amount : Nat;
    timestamp : Int;
    reason : Text;
    sourceSessionId : Nat;
  };

  public type RedemptionStatus = {
    #pending;
    #fulfilled;
    #failed;
  };

  public type Redemption = {
    id : Nat;
    userId : UserId;
    rewardId : Nat;
    timestamp : Int;
    coinsDeducted : Nat;
    status : RedemptionStatus;
  };

  public type DailyGoal = {
    targetCoins : Nat;
    earnedCoins : Nat;
    completed : Bool;
    date : Int;
  };

  public type OldRewardsState = {
    var nextAwardId : Nat;
    var nextRedemptionId : Nat;
    users : Map.Map<UserId, UserProfile>;
    awards : Map.Map<UserId, [CoinAward]>;
    redemptions : Map.Map<UserId, [Redemption]>;
    dailyGoals : Map.Map<UserId, Map.Map<Int, DailyGoal>>;
    awardedMilestones : Map.Map<UserId, Map.Map<Nat, [Nat]>>;
  };

  // New ProductRedemption type added in this migration.
  public type ProductRedemption = {
    id : Nat;
    userId : UserId;
    productId : Nat;
    redeemedAt : Int;
  };

  // New rewards state shape — adds nextProductRedemptionId counter and
  // productRedemptions collection.
  public type NewRewardsState = {
    var nextAwardId : Nat;
    var nextRedemptionId : Nat;
    var nextProductRedemptionId : Nat;
    users : Map.Map<UserId, UserProfile>;
    awards : Map.Map<UserId, [CoinAward]>;
    redemptions : Map.Map<UserId, [Redemption]>;
    productRedemptions : Map.Map<UserId, [ProductRedemption]>;
    dailyGoals : Map.Map<UserId, Map.Map<Int, DailyGoal>>;
    awardedMilestones : Map.Map<UserId, Map.Map<Nat, [Nat]>>;
  };

  // OldActor matches the NewActor of the preceding migration (20260724_080210.mo).
  type OldActor = {
    accessControlState : AccessControlState;
    rewardsState : OldRewardsState;
  };

  // NewActor enumerates every stable field declared in main.mo.
  type NewActor = {
    accessControlState : AccessControlState;
    rewardsState : NewRewardsState;
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      rewardsState = {
        var nextAwardId = old.rewardsState.nextAwardId;
        var nextRedemptionId = old.rewardsState.nextRedemptionId;
        var nextProductRedemptionId = 0;
        users = old.rewardsState.users;
        awards = old.rewardsState.awards;
        redemptions = old.rewardsState.redemptions;
        productRedemptions = Map.empty();
        dailyGoals = old.rewardsState.dailyGoals;
        awardedMilestones = old.rewardsState.awardedMilestones;
      };
    };
  };
};
