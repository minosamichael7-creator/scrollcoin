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

  // Inlined rewards state types (self-contained: no project imports).
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

  public type RewardsState = {
    var nextAwardId : Nat;
    var nextRedemptionId : Nat;
    users : Map.Map<UserId, UserProfile>;
    awards : Map.Map<UserId, [CoinAward]>;
    redemptions : Map.Map<UserId, [Redemption]>;
    dailyGoals : Map.Map<UserId, Map.Map<Int, DailyGoal>>;
    awardedMilestones : Map.Map<UserId, Map.Map<Nat, [Nat]>>;
  };

  // First migration in the chain: no prior actor state existed.
  type OldActor = {};

  // NewActor enumerates every stable field declared in main.mo.
  type NewActor = {
    accessControlState : AccessControlState;
    rewardsState : RewardsState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      rewardsState = {
        var nextAwardId = 0;
        var nextRedemptionId = 0;
        users = Map.empty();
        awards = Map.empty();
        redemptions = Map.empty();
        dailyGoals = Map.empty();
        awardedMilestones = Map.empty();
      };
    };
  };
};
