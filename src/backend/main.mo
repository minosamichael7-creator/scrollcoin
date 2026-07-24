import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import TextValue "mo:caffeineai-oql/TextValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import RewardsApi "mixins/rewards-api";
import RewardsLib "lib/rewards";
import Types "types/rewards";

actor {
  // Existing authorization state (initialized by the migration chain).
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // Rewards domain stable state (types only — initial values come from the
  // migration chain in src/backend/migrations/).
  let rewardsState : RewardsLib.RewardsState;
  include RewardsApi(rewardsState);

  // ---------------------------------------------------------------------------
  // OQL — Data Intelligence entities.
  // All collections are owner-keyed (Map<UserId, …>) and/or need flattening,
  // so every entity uses OQL.Entity.manual over a flattening iterator that
  // promotes the outer Map key as a `userId` column tagged with .ownedBy.
  // ---------------------------------------------------------------------------

  type UserProfile = Types.UserProfile;
  type CoinAward = Types.CoinAward;
  type Redemption = Types.Redemption;
  type DailyGoal = Types.DailyGoal;
  type ProductRedemption = Types.ProductRedemption;
  type UserId = Types.UserId;
  type Date = Types.Date;

  // Sample owner principal for .sample templates (value is ignored).
  transient let anyP = Principal.fromText("2vxsx-fae");

  // ---------------------------------------------------------------------------
  // Flattening iterators + variant sentinel helper for OQL manual entities.
  // These are wiring (row projection), not business logic. Declared before the
  // Expose block so they are in scope where the entity iterators reference them.
  // ---------------------------------------------------------------------------

  // Flatten Map<UserId, [CoinAward]> into one (UserId, CoinAward) pair per award.
  func flattenAwards(state : RewardsLib.RewardsState) : {
    next : () -> ?(UserId, CoinAward);
  } {
    let outer = state.awards.entries();
    var inner : { next : () -> ?CoinAward } = object {
      public func next() : ?CoinAward { null };
    };
    var currentOwner : ?UserId = null;
    object {
      public func next() : ?(UserId, CoinAward) {
        switch (inner.next()) {
          case (?a) {
            switch (currentOwner) {
              case (?p) { ?(p, a) };
              case null { next() };
            };
          };
          case null {
            switch (outer.next()) {
              case (?(p, awards)) {
                currentOwner := ?p;
                inner := awards.vals();
                next();
              };
              case null { null };
            };
          };
        };
      };
    };
  };

  // Flatten Map<UserId, [Redemption]> into one (UserId, Redemption) pair per redemption.
  func flattenRedemptions(state : RewardsLib.RewardsState) : {
    next : () -> ?(UserId, Redemption);
  } {
    let outer = state.redemptions.entries();
    var inner : { next : () -> ?Redemption } = object {
      public func next() : ?Redemption { null };
    };
    var currentOwner : ?UserId = null;
    object {
      public func next() : ?(UserId, Redemption) {
        switch (inner.next()) {
          case (?r) {
            switch (currentOwner) {
              case (?p) { ?(p, r) };
              case null { next() };
            };
          };
          case null {
            switch (outer.next()) {
              case (?(p, redemptions)) {
                currentOwner := ?p;
                inner := redemptions.vals();
                next();
              };
              case null { null };
            };
          };
        };
      };
    };
  };

  // Flatten Map<UserId, [ProductRedemption]> into one (UserId, ProductRedemption)
  // pair per shop redemption.
  func flattenProductRedemptions(state : RewardsLib.RewardsState) : {
    next : () -> ?(UserId, ProductRedemption);
  } {
    let outer = state.productRedemptions.entries();
    var inner : { next : () -> ?ProductRedemption } = object {
      public func next() : ?ProductRedemption { null };
    };
    var currentOwner : ?UserId = null;
    object {
      public func next() : ?(UserId, ProductRedemption) {
        switch (inner.next()) {
          case (?r) {
            switch (currentOwner) {
              case (?p) { ?(p, r) };
              case null { next() };
            };
          };
          case null {
            switch (outer.next()) {
              case (?(p, redemptions)) {
                currentOwner := ?p;
                inner := redemptions.vals();
                next();
              };
              case null { null };
            };
          };
        };
      };
    };
  };

  // Flatten nested Map<UserId, Map<Date, DailyGoal>> into one
  // (UserId, Date, DailyGoal) triple per goal.
  func flattenDailyGoals(state : RewardsLib.RewardsState) : {
    next : () -> ?(UserId, Date, DailyGoal);
  } {
    let outer = state.dailyGoals.entries();
    var middle : { next : () -> ?(Date, DailyGoal) } = object {
      public func next() : ?(Date, DailyGoal) { null };
    };
    var currentOwner : ?UserId = null;
    object {
      public func next() : ?(UserId, Date, DailyGoal) {
        switch (middle.next()) {
          case (?(d, g)) {
            switch (currentOwner) {
              case (?p) { ?(p, d, g) };
              case null { next() };
            };
          };
          case null {
            switch (outer.next()) {
              case (?(p, goals)) {
                currentOwner := ?p;
                middle := goals.entries();
                next();
              };
              case null { null };
            };
          };
        };
      };
    };
  };

  // Flatten nested Map<UserId, Map<Nat, [Nat]>> into one
  // (UserId, sessionId, milestone) triple per awarded milestone.
  func flattenAwardedMilestones(state : RewardsLib.RewardsState) : {
    next : () -> ?(UserId, Nat, Nat);
  } {
    let outer = state.awardedMilestones.entries();
    var middle : { next : () -> ?(Nat, [Nat]) } = object {
      public func next() : ?(Nat, [Nat]) { null };
    };
    var inner : { next : () -> ?Nat } = object {
      public func next() : ?Nat { null };
    };
    var currentOwner : ?UserId = null;
    var currentSession : ?Nat = null;
    object {
      public func next() : ?(UserId, Nat, Nat) {
        switch (inner.next()) {
          case (?m) {
            switch (currentOwner, currentSession) {
              case (?p, ?s) { ?(p, s, m) };
              case (_, _) { next() };
            };
          };
          case null {
            switch (middle.next()) {
              case (?(s, milestones)) {
                currentSession := ?s;
                inner := milestones.vals();
                next();
              };
              case null {
                switch (outer.next()) {
                  case (?(p, sessions)) {
                    currentOwner := ?p;
                    middle := sessions.entries();
                    next();
                  };
                  case null { null };
                };
              };
            };
          };
        };
      };
    };
  };

  // RedemptionStatus variant → sentinel text (single OQL.Value variant).
  func redemptionStatusToText(status : Types.RedemptionStatus) : Text {
    switch (status) {
      case (#pending) "pending";
      case (#fulfilled) "fulfilled";
      case (#failed) "failed";
    };
  };

  // ---------------------------------------------------------------------------
  // OQL Expose — one entity per stored collection.
  //
  // All collections are owner-keyed (Map<UserId, …>) and/or nested, so every
  // entity uses OQL.Entity.manual over a flattening iterator that promotes the
  // outer Map key as a `userId` column. The `userId` column is declared via
  // .payload first, then tagged as the owner column via .ownedBy("userId").
  //
  // API (caffeineai-oql@0.4.0): Builder<T> is a plain record; manual, payload,
  // ownedBy, sample, controllerOrScoped, controllerOnly, and build are
  // module-level functions in OQL.Entity taking `self` as the first argument.
  //
  // Nesting pattern (inside-out):
  //   build( controllerOrScoped( sample( ownedBy( payload( manual(...), "userId", extract ), "userId" ), sampleValue ) ) )
  //
  // Implicit _toRow instances for Nat/Int/Text/Bool/Principal are resolved via
  // the *Value imports above (PrincipalValue, TextValue, NatValue, IntValue,
  // BoolValue).
  // ---------------------------------------------------------------------------

  include Expose({
    entities = [
      // userProfile — one row per user; promote the Map key as `userId`.
      // `achievements` is a [Nat] collection field → expose its size as a column
      // (per OQL skill: collection fields use .size() or Text.join, not raw arrays).
      OQL.Entity.build(
        OQL.Entity.controllerOrScoped(
          OQL.Entity.sample(
            OQL.Entity.ownedBy(
              OQL.Entity.payload(
                OQL.Entity.payload(
                  OQL.Entity.payload(
                    OQL.Entity.payload(
                      OQL.Entity.payload(
                        OQL.Entity.payload(
                          OQL.Entity.payload(
                            OQL.Entity.payload(
                              OQL.Entity.payload(
                                OQL.Entity.payload(
                                  OQL.Entity.payload(
                                    OQL.Entity.manual<(UserId, UserProfile)>(
                                      "userProfile",
                                      func() = rewardsState.users.entries(),
                                      "UserProfile",
                                      "principal",
                                    ),
                                    "userId", func((p, _)) = p,
                                  ),
                                  "principal", func((_, u)) = u.principal,
                                ),
                                "username", func((_, u)) = u.username,
                              ),
                              "totalCoins", func((_, u)) = u.totalCoins,
                            ),
                            "todayEarnings", func((_, u)) = u.todayEarnings,
                          ),
                          "lifetimeEarnings", func((_, u)) = u.lifetimeEarnings,
                        ),
                        "streakCount", func((_, u)) = u.streakCount,
                      ),
                      "streakFreezeCount", func((_, u)) = u.streakFreezeCount,
                    ),
                    "lastActiveDate", func((_, u)) = u.lastActiveDate,
                  ),
                  "joinDate", func((_, u)) = u.joinDate,
                ),
                "achievementsCount", func((_, u)) = u.achievements.size(),
              ),
              "userId",
            ),
              (
                anyP,
                {
                  principal = anyP;
                  username = "";
                  totalCoins = 0;
                  todayEarnings = 0;
                  lifetimeEarnings = 0;
                  streakCount = 0;
                  streakFreezeCount = 0;
                  lastActiveDate = 0;
                  joinDate = 0;
                  achievements = [];
                },
              ),
            ),
          ),
        ),

      // coinAward — flatten Map<UserId, [CoinAward]> to one row per award.
      OQL.Entity.build(
        OQL.Entity.controllerOrScoped(
          OQL.Entity.sample(
            OQL.Entity.ownedBy(
              OQL.Entity.payload(
                OQL.Entity.payload(
                  OQL.Entity.payload(
                    OQL.Entity.payload(
                      OQL.Entity.payload(
                        OQL.Entity.payload(
                          OQL.Entity.manual<(UserId, CoinAward)>(
                            "coinAward",
                            func() = flattenAwards(rewardsState),
                            "CoinAward",
                            "id",
                          ),
                          "userId", func((p, _)) = p,
                        ),
                        "id", func((_, a)) = a.id,
                      ),
                      "amount", func((_, a)) = a.amount,
                    ),
                    "timestamp", func((_, a)) = a.timestamp,
                  ),
                  "reason", func((_, a)) = a.reason,
                ),
                "sourceSessionId", func((_, a)) = a.sourceSessionId,
              ),
              "userId",
            ),
              (
                anyP,
                {
                  id = 0;
                  amount = 0;
                  timestamp = 0;
                  reason = "";
                  sourceSessionId = 0;
                },
              ),
            ),
          ),
        ),

      // redemption — flatten Map<UserId, [Redemption]> to one row per redemption.
      // status is a variant → emit as sentinel text.
      OQL.Entity.build(
        OQL.Entity.controllerOrScoped(
          OQL.Entity.sample(
            OQL.Entity.ownedBy(
              OQL.Entity.payload(
                OQL.Entity.payload(
                  OQL.Entity.payload(
                    OQL.Entity.payload(
                      OQL.Entity.payload(
                        OQL.Entity.payload(
                          OQL.Entity.manual<(UserId, Redemption)>(
                            "redemption",
                            func() = flattenRedemptions(rewardsState),
                            "Redemption",
                            "id",
                          ),
                          "userId", func((p, _)) = p,
                        ),
                        "id", func((_, r)) = r.id,
                      ),
                      "rewardId", func((_, r)) = r.rewardId,
                    ),
                    "timestamp", func((_, r)) = r.timestamp,
                  ),
                  "coinsDeducted", func((_, r)) = r.coinsDeducted,
                ),
                "status", func((_, r)) = redemptionStatusToText(r.status),
              ),
              "userId",
            ),
              (
                anyP,
                {
                  id = 0;
                  userId = anyP;
                  rewardId = 0;
                  timestamp = 0;
                  coinsDeducted = 0;
                  status = #pending;
                },
              ),
            ),
          ),
        ),

      // productRedemption — flatten Map<UserId, [ProductRedemption]> to one row
      // per shop redemption. Promote outer key as `userId` (owner column).
      OQL.Entity.build(
        OQL.Entity.controllerOrScoped(
          OQL.Entity.sample(
            OQL.Entity.ownedBy(
              OQL.Entity.payload(
                OQL.Entity.payload(
                  OQL.Entity.payload(
                    OQL.Entity.payload(
                      OQL.Entity.manual<(UserId, ProductRedemption)>(
                        "productRedemption",
                        func() = flattenProductRedemptions(rewardsState),
                        "ProductRedemption",
                        "id",
                      ),
                      "userId", func((p, _)) = p,
                    ),
                    "id", func((_, r)) = r.id,
                  ),
                  "productId", func((_, r)) = r.productId,
                ),
                "redeemedAt", func((_, r)) = r.redeemedAt,
              ),
              "userId",
            ),
              (
                anyP,
                {
                  id = 0;
                  userId = anyP;
                  productId = 0;
                  redeemedAt = 0;
                },
              ),
            ),
          ),
        ),

      // dailyGoal — flatten nested Map<UserId, Map<Date, DailyGoal>> to one row
      // per (user, date, goal). Promote outer key as `userId`.
      OQL.Entity.build(
        OQL.Entity.controllerOrScoped(
          OQL.Entity.sample(
            OQL.Entity.ownedBy(
              OQL.Entity.payload(
                OQL.Entity.payload(
                  OQL.Entity.payload(
                    OQL.Entity.payload(
                      OQL.Entity.payload(
                        OQL.Entity.manual<(UserId, Date, DailyGoal)>(
                          "dailyGoal",
                          func() = flattenDailyGoals(rewardsState),
                          "DailyGoal",
                          "date",
                        ),
                        "userId", func((p, _, _)) = p,
                      ),
                      "date", func((_, d, _)) = d,
                    ),
                    "targetCoins", func((_, _, g)) = g.targetCoins,
                  ),
                  "earnedCoins", func((_, _, g)) = g.earnedCoins,
                ),
                "completed", func((_, _, g)) = g.completed,
              ),
              "userId",
            ),
              (
                anyP,
                0,
                {
                  targetCoins = 0;
                  earnedCoins = 0;
                  completed = false;
                  date = 0;
                },
              ),
            ),
          ),
        ),

      // awardedMilestone — flatten nested Map<UserId, Map<Nat, [Nat]>> to one
      // row per (user, sessionId, milestone). Internal dedup data → controllerOnly.
      OQL.Entity.build(
        OQL.Entity.controllerOnly(
          OQL.Entity.sample(
            OQL.Entity.payload(
              OQL.Entity.payload(
                OQL.Entity.payload(
                  OQL.Entity.manual<(UserId, Nat, Nat)>(
                    "awardedMilestone",
                    func() = flattenAwardedMilestones(rewardsState),
                    "AwardedMilestone",
                    "sessionId",
                  ),
                  "userId", func((p, _, _)) = p,
                ),
                "sessionId", func((_, s, _)) = s,
              ),
              "milestone", func((_, _, m)) = m,
            ),
            (anyP, 0, 0),
          ),
        ),
      ),
    ];
  });
};
