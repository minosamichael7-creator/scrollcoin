import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Types "../types/rewards";

module {
  public type UserProfile = Types.UserProfile;
  public type CoinAward = Types.CoinAward;
  public type RewardItem = Types.RewardItem;
  public type Redemption = Types.Redemption;
  public type LeaderboardEntry = Types.LeaderboardEntry;
  public type Achievement = Types.Achievement;
  public type FeedContent = Types.FeedContent;
  public type DailyGoal = Types.DailyGoal;
  public type AwardResult = Types.AwardResult;
  public type RedeemResult = Types.RedeemResult;
  public type RedeemProductResult = Types.RedeemProductResult;
  public type Product = Types.Product;
  public type Ebook = Types.Ebook;
  public type Lesson = Types.Lesson;
  public type LessonDifficulty = Types.LessonDifficulty;
  public type ProductRedemption = Types.ProductRedemption;

  // ---------------------------------------------------------------------------
  // State shape passed in from the actor (main.mo). All collections are stable
  // (enhanced orthogonal persistence); counters are wrapped in a record so the
  // mixin/lib mutations propagate back to the actor.
  // ---------------------------------------------------------------------------

  public type RewardsState = {
    var nextAwardId : Nat;
    var nextRedemptionId : Nat;
    var nextProductRedemptionId : Nat;
    users : Map.Map<Types.UserId, UserProfile>;
    awards : Map.Map<Types.UserId, [CoinAward]>; // most-recent-first list per user
    redemptions : Map.Map<Types.UserId, [Redemption]>; // most-recent-first list per user
    productRedemptions : Map.Map<Types.UserId, [ProductRedemption]>; // shop redemptions per user
    dailyGoals : Map.Map<Types.UserId, Map.Map<Types.Date, DailyGoal>>;
    // Tracks (sessionId, milestone) pairs already awarded, to prevent duplicates.
    awardedMilestones : Map.Map<Types.UserId, Map.Map<Nat, [Nat]>>;
  };

  // ---------------------------------------------------------------------------
  // Static catalogs (module-level constants — pure static expressions).
  // ---------------------------------------------------------------------------

  public let REWARDS_CATALOG : [RewardItem] = [
    { id = 1; title = "$5 Gift Card"; description = "Redeem for a $5 digital gift card"; coinPrice = 500; category = "giftcard"; image = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400" },
    { id = 2; title = "$10 Gift Card"; description = "Redeem for a $10 digital gift card"; coinPrice = 1000; category = "giftcard"; image = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400" },
    { id = 3; title = "$25 Gift Card"; description = "Redeem for a $25 digital gift card"; coinPrice = 2500; category = "giftcard"; image = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400" },
    { id = 4; title = "Premium Perk"; description = "Unlock a premium app perk for a week"; coinPrice = 250; category = "perk"; image = "https://images.unsplash.com/photo-1614624532983-4e039e1f3d6a?w=400" },
    { id = 5; title = "Ad-Free Day"; description = "Enjoy 24 hours with no ads"; coinPrice = 150; category = "perk"; image = "https://images.unsplash.com/photo-1614624532983-4e039e1f3d6a?w=400" },
    { id = 6; title = "Custom Theme"; description = "Unlock a custom dark theme accent color"; coinPrice = 400; category = "cosmetic"; image = "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400" },
    { id = 7; title = "Profile Badge"; description = "Show off a rare profile badge"; coinPrice = 750; category = "cosmetic"; image = "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400" },
    { id = 8; title = "$50 Gift Card"; description = "Redeem for a $50 digital gift card"; coinPrice = 5000; category = "giftcard"; image = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400" },
  ];

  public let ACHIEVEMENTS_CATALOG : [Achievement] = [
    { id = 1; title = "First Coin"; description = "Earn your very first coin"; icon = "🪙"; unlockedThreshold = 1 },
    { id = 2; title = "Scroll Novice"; description = "Earn 100 coins total"; icon = "🌱"; unlockedThreshold = 100 },
    { id = 3; title = "Scroll Master"; description = "Earn 1,000 coins total"; icon = "🏆"; unlockedThreshold = 1000 },
    { id = 4; title = "Coin Tycoon"; description = "Earn 10,000 coins total"; icon = "💎"; unlockedThreshold = 10000 },
    { id = 5; title = "Week Warrior"; description = "Maintain a 7-day streak"; icon = "🔥"; unlockedThreshold = 7 },
    { id = 6; title = "Fortnight Legend"; description = "Maintain a 30-day streak"; icon = "⚡"; unlockedThreshold = 30 },
    { id = 7; title = "Goal Getter"; description = "Complete a daily goal"; icon = "🎯"; unlockedThreshold = 1 },
    { id = 8; title = "Big Spender"; description = "Redeem your first reward"; icon = "🎁"; unlockedThreshold = 1 },
  ];

  // Static feed content catalog (30+ items so infinite scroll works).
  public let FEED_CATALOG : [FeedContent] = [
    { id = 1; title = "The Science of Habit Formation"; body = "It takes an average of 66 days to form a new habit, not 21 as commonly believed. Consistency is the key to lasting change."; category = "self-improvement"; imageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600"; contentType = #article },
    { id = 2; title = "Honey Never Spoils"; body = "Archaeologists have found pots of honey in ancient Egyptian tombs over 3,000 years old that are still perfectly edible!"; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=600"; contentType = #funfact },
    { id = 3; title = "Morning Productivity Tips"; body = "Start your day with the hardest task first. Willpower is highest in the morning and depletes throughout the day."; category = "productivity"; imageUrl = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600"; contentType = #article },
    { id = 4; title = "Octopuses Have Three Hearts"; body = "Two pump blood to the gills while the third pumps it to the rest of the body. The third heart stops beating when they swim."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600"; contentType = #funfact },
    { id = 5; title = "The Power of Compound Interest"; body = "Starting to save early, even small amounts, can lead to significant wealth over time thanks to compound growth."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"; contentType = #article },
    { id = 6; title = "Bananas Are Berries, Strawberries Aren't"; body = "Botanically, bananas qualify as berries while strawberries do not. Nature has a quirky sense of classification."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600"; contentType = #funfact },
    { id = 7; title = "Mindful Breathing in 60 Seconds"; body = "Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times. This simple technique can reduce stress instantly."; category = "wellness"; imageUrl = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600"; contentType = #article },
    { id = 8; title = "A Bee Can Lift Its Body Weight"; body = "Bees can carry up to 80% of their body weight in pollen. They're nature's tiny weightlifters."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1587049352846-4da222e38a8d?w=600"; contentType = #funfact },
    { id = 9; title = "The 2-Minute Rule"; body = "If a task takes less than two minutes, do it immediately. This simple rule clears mental clutter and builds momentum."; category = "productivity"; imageUrl = "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600"; contentType = #article },
    { id = 10; title = "Wombat Poop Is Cube-Shaped"; body = "Wombats produce cube-shaped droppings to mark territory. They're the only known animal to do so!"; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1561731216-c3a4d71c3760?w=600"; contentType = #funfact },
    { id = 11; title = "Why Sleep Matters"; body = "Quality sleep improves memory, boosts immunity, and enhances creativity. Aim for 7-9 hours per night."; category = "wellness"; imageUrl = "https://images.unsplash.com/photo-1511632765486-06023b2ef221?w=600"; contentType = #article },
    { id = 12; title = "Stunning Mountain Vista"; body = "Take a moment to appreciate the beauty of nature's grandest landscapes."; category = "nature"; imageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600"; contentType = #image },
    { id = 13; title = "The 80/20 Rule"; body = "80% of results come from 20% of efforts. Identify your highest-impact activities and focus there."; category = "productivity"; imageUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"; contentType = #article },
    { id = 14; title = "Sharks Predate Trees"; body = "Sharks have existed for over 400 million years, while trees appeared about 350 million years ago."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600"; contentType = #funfact },
    { id = 15; title = "Building Better Habits"; body = "Stack new habits onto existing ones. After I pour my morning coffee, I will write down three priorities for the day."; category = "self-improvement"; imageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c0?w=600"; contentType = #article },
    { id = 16; title = "Ocean Sunset Serenity"; body = "There's nothing quite like watching the sun dip below the horizon over calm waters."; category = "nature"; imageUrl = "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=600"; contentType = #image },
    { id = 17; title = "The Pomodoro Technique"; body = "Work in 25-minute focused bursts with 5-minute breaks. After 4 cycles, take a longer 15-30 minute break."; category = "productivity"; imageUrl = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600"; contentType = #article },
    { id = 18; title = "A Day on Venus Is Longer Than a Year"; body = "Venus rotates so slowly that one rotation (243 Earth days) takes longer than its orbit around the sun (225 Earth days)."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1614624532983-4e039e1f3d6a?w=600"; contentType = #funfact },
    { id = 19; title = "Hydration and Focus"; body = "Even mild dehydration can impair concentration and memory. Keep water within reach throughout your day."; category = "wellness"; imageUrl = "https://images.unsplash.com/photo-1523365284157-44d7c6f4c7e0?w=600"; contentType = #article },
    { id = 20; title = "Forest Canopy Magic"; body = "Forests cover about 31% of Earth's land area and produce much of the oxygen we breathe."; category = "nature"; imageUrl = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600"; contentType = #image },
    { id = 21; title = "The Zeigarnik Effect"; body = "People remember uncompleted tasks better than completed ones. Use this to your advantage by starting important tasks."; category = "psychology"; imageUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"; contentType = #article },
    { id = 22; title = "Cows Have Best Friends"; body = "Studies show cows form close bonds with specific herd mates and become stressed when separated."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600"; contentType = #funfact },
    { id = 23; title = "The Art of Saying No"; body = "Every yes is a no to something else. Guard your time fiercely and decline commitments that don't align with your goals."; category = "self-improvement"; imageUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600"; contentType = #article },
    { id = 24; title = "Aurora Borealis Wonder"; body = "The northern lights are caused by charged particles from the sun colliding with Earth's atmosphere."; category = "nature"; imageUrl = "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600"; contentType = #image },
    { id = 25; title = "The Feynman Technique"; body = "Learn by teaching. Explain a concept in simple terms as if to a child. Gaps in your explanation reveal what to study next."; category = "learning"; imageUrl = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600"; contentType = #article },
    { id = 26; title = "Sea Otters Hold Hands"; body = "Sea otters hold hands while sleeping to avoid drifting apart. They also store their favorite rocks in loose skin pouches."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1535551951406-a19828b1d6a0?w=600"; contentType = #funfact },
    { id = 27; title = "Gratitude Changes the Brain"; body = "Regular gratitude practice increases activity in the medial prefrontal cortex, associated with learning and decision making."; category = "wellness"; imageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600"; contentType = #article },
    { id = 28; title = "Desert Dune Patterns"; body = "Wind sculpts sand dunes into mesmerizing, ever-shifting patterns across the world's deserts."; category = "nature"; imageUrl = "https://images.unsplash.com/photo-1473580046384-87ba99c93690?w=600"; contentType = #image },
    { id = 29; title = "The Eisenhower Matrix"; body = "Sort tasks by urgency and importance. Focus on important-but-not-urgent tasks to reduce crises and build long-term value."; category = "productivity"; imageUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"; contentType = #article },
    { id = 30; title = "Pineapples Take Two Years to Grow"; body = "A single pineapple takes about two years to reach full maturity. Patience truly is a virtue in nature."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1559181567-c3f0c69a9b85?w=600"; contentType = #funfact },
    { id = 31; title = "Deep Work Wins"; body = "Schedule uninterrupted blocks for cognitively demanding tasks. Shallow work fills time; deep work creates value."; category = "productivity"; imageUrl = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600"; contentType = #article },
    { id = 32; title = "Starfish Can Regrow Arms"; body = "Some starfish can regrow lost arms, and certain species can even grow an entirely new body from a single arm."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1551634294-8cb1d00e9b1c?w=600"; contentType = #funfact },
    { id = 33; title = "The 5-Second Rule"; body = "When you feel hesitation before acting, count 5-4-3-2-1 and move. This interrupts overthinking and sparks action."; category = "self-improvement"; imageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c0?w=600"; contentType = #article },
    { id = 34; title = "Misty Mountain Morning"; body = "There's a special kind of peace found only in the quiet mist of early mountain mornings."; category = "nature"; imageUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600"; contentType = #image },
    { id = 35; title = "Your Brain Uses 20% of Your Energy"; body = "Though it's only 2% of body weight, the brain consumes about 20% of your daily energy intake."; category = "fun-facts"; imageUrl = "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600"; contentType = #funfact },
    // --- Finance news: crypto & forex (curated static content) ---
    { id = 36; title = "Bitcoin Holds Above Key Support"; body = "Bitcoin is consolidating above a major support level as traders watch for a breakout. On-chain data shows long-term holders accumulating despite short-term volatility."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1518546405486-3e3a1a1e1e1e?w=600"; contentType = #finance },
    { id = 37; title = "Ethereum Upgrade Sparks Network Activity"; body = "A recent Ethereum protocol upgrade has driven a surge in layer-2 transactions and staking deposits, signaling renewed developer and user engagement."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600"; contentType = #finance },
    { id = 38; title = "Altcoin Season Watch: Which Coins Are Moving"; body = "Several mid-cap altcoins are outperforming as capital rotates out of blue chips. Analysts caution that altcoin rallies can be sharp but short-lived."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1621761191319-c6fb62004041?w=600"; contentType = #finance },
    { id = 39; title = "Crypto Market Sentiment Turns Cautious"; body = "The Fear & Greed index has slipped into neutral territory as traders weigh macro headwinds against improving adoption metrics."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1640340486-db32c084d4f9?w=600"; contentType = #finance },
    { id = 40; title = "EUR/USD Tests Major Resistance"; body = "The euro is testing a key resistance level against the dollar as traders price in diverging growth outlooks between the eurozone and the US."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a4?w=600"; contentType = #finance },
    { id = 41; title = "Dollar Strengthens on Safe-Haven Demand"; body = "The US dollar is gaining against major peers as risk sentiment softens, with the DXY index climbing amid rising demand for safe-haven assets."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600"; contentType = #finance },
    { id = 42; title = "GBP/USD Volatility Ahead of Data"; body = "Sterling is seeing elevated volatility against the dollar as markets await key labor and inflation prints that could shift rate expectations."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600"; contentType = #finance },
    { id = 43; title = "USD/JPY Reacts to Central Bank Signals"; body = "The dollar-yen pair is sensitive to shifting rhetoric from central banks, with traders watching for any hint of policy divergence."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1590283603385-15ffb1a61641?w=600"; contentType = #finance },
    { id = 44; title = "Central Bank Rate Decision in Focus"; body = "Markets are bracing for a major central bank rate decision, with expectations split between a hold and a smaller cut. Forward guidance will be key."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"; contentType = #finance },
    { id = 45; title = "Bitcoin Halving Cycle and Supply Dynamics"; body = "Each Bitcoin halving cuts new issuance in half, tightening supply. Historically these events have reshaped medium-term price dynamics."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1518546405486-3e3a1a1e1e1e?w=600"; contentType = #finance },
    { id = 46; title = "Stablecoins and Forex Corridors"; body = "Stablecoins increasingly act as 24/7 forex corridors, offering fast settlement between fiat currencies and bridging crypto with traditional markets."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1621761191319-c6fb62004041?w=600"; contentType = #finance },
    { id = 47; title = "Risk-On vs Risk-Off: Reading the Tape"; body = "When equities and high-beta currencies rally together, markets are risk-on. When the dollar and gold lead, risk-off flows dominate forex and crypto alike."; category = "finance"; imageUrl = "https://images.unsplash.com/photo-1640340486-db32c084d4f9?w=600"; contentType = #finance },
    // --- Reels: short-form vertical video teasers (9:16 posters) ---
    { id = 48; title = "5 Side Hustles You Can Start Today"; body = "@hustlewithmaya - 60s breakdown of beginner-friendly side hustles you can launch this weekend."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600"; contentType = #reel },
    { id = 49; title = "How I Saved My First $100"; body = "@moneyteens - a real breakdown of how a teen hit their first $100 savings milestone."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"; contentType = #reel },
    { id = 50; title = "Freelancing in 60 Seconds"; body = "@freelancefactory - quick explainer on landing your first freelance client online."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600"; contentType = #reel },
    { id = 51; title = "AI Tools That Pay You"; body = "@aitoolsdaily - 3 AI tools you can use right now to start earning online."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600"; contentType = #reel },
    { id = 52; title = "Reselling 101: Flip for Profit"; body = "@resellryan - how to find cheap items and resell them for a clean profit."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600"; contentType = #reel },
    { id = 53; title = "Crypto Basics in 60s"; body = "@cryptocompass - what crypto actually is, explained simply for beginners."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1518546405486-3e3a1a1e1e1e?w=600"; contentType = #reel },
    { id = 54; title = "Content Creation Pays"; body = "@creatorcoach - how creators turn views into income, even with a small audience."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600"; contentType = #reel },
    { id = 55; title = "Save Money Without Trying"; body = "@frugalfern - tiny daily habits that quietly stack up your savings."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"; contentType = #reel },
    { id = 56; title = "Digital Skills That Earn"; body = "@digitalskillspro - 4 digital skills in demand right now that you can learn for free."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600"; contentType = #reel },
    { id = 57; title = "Investing for Beginners"; body = "@investsimple - the simplest way to start investing with very little money."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=600"; contentType = #reel },
    { id = 58; title = "Passive Income Myths Busted"; body = "@truthaboutmoney - what passive income really takes vs the hype online."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"; contentType = #reel },
    { id = 59; title = "Build Your First Budget"; body = "@budgetwithben - a 60-second budget template anyone can follow."; category = "reels"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"; contentType = #reel },
    // --- AI News: curated AI headlines with source + read time ---
    { id = 60; title = "New Open-Source LLM Closes the Gap"; body = "TechBrief - 3 min read. A new open-source model reportedly matches proprietary frontier models on common reasoning benchmarks."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600"; contentType = #ainews },
    { id = 61; title = "AI Image Tools Get a Speed Boost"; body = "AIWeekly - 2 min read. Faster inference pipelines are making real-time AI image generation practical on consumer hardware."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1620712943543-bcc4688e7f13?w=600"; contentType = #ainews },
    { id = 62; title = "Freelancers Adopt AI to 2x Output"; body = "FutureWork - 4 min read. Survey shows freelancers using AI assistants complete projects nearly twice as fast on average."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600"; contentType = #ainews },
    { id = 63; title = "AI Coding Assistants Cross New Milestone"; body = "DevPulse - 3 min read. AI pair-programming tools now suggest code that passes review on the first try more often than not."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600"; contentType = #ainews },
    { id = 64; title = "Small Models, Big Results On-Device"; body = "EdgeAI - 2 min read. Compact models running on phones are matching cloud accuracy for many everyday tasks."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600"; contentType = #ainews },
    { id = 65; title = "AI Tutors Reach 1M Learners"; body = "EduTechDaily - 3 min read. Personalized AI tutoring platforms report strong gains for self-directed Gen Z learners."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600"; contentType = #ainews },
    { id = 66; title = "Voice AI Becomes Free for Creators"; body = "CreatorNews - 2 min read. A new wave of free voice-cloning and dubbing tools is lowering the barrier for solo creators."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1589903308904-1010c229cd0b?w=600"; contentType = #ainews },
    { id = 67; title = "AI Resumes That Actually Get Interviews"; body = "CareerAI - 4 min read. AI-tailored resumes are showing measurably higher callback rates in early hiring experiments."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f04d?w=600"; contentType = #ainews },
    { id = 68; title = "Open Weights vs Closed Models: The Debate"; body = "ModelWatch - 5 min read. The open-weights movement argues transparency beats raw capability for most real-world uses."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=600"; contentType = #ainews },
    { id = 69; title = "AI Side Hustles That Actually Pay in 2026"; body = "HustleAI - 3 min read. From AI-assisted design to prompt consulting, here are the side hustles generating real income."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600"; contentType = #ainews },
    { id = 70; title = "Detecting AI-Generated Content Gets Easier"; body = "TrustLab - 2 min read. New detection tools claim over 90% accuracy on AI text, raising the bar for content authenticity."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1563164261-1e8e3c7f7f7f?w=600"; contentType = #ainews },
    { id = 71; title = "AI for Personal Finance Apps Surges"; body = "FinAI - 3 min read. Budgeting apps with AI insights are helping young users save more without thinking about it."; category = "ainews"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"; contentType = #ainews },
    // --- Learn teasers: surface e-books and lessons in the main feed ---
    { id = 72; title = "Free Read: Money Skills for Beginners"; body = "Start reading 'Money Skills 101' - a free e-book on saving, budgeting, and your first income. Tap to open the full book."; category = "learn"; imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"; contentType = #ebook },
    { id = 73; title = "Free Read: The Freelance Starter Guide"; body = "Open 'The Freelance Starter Guide' - learn how to land your first paid client online. Free to read in full."; category = "learn"; imageUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600"; contentType = #ebook },
    { id = 74; title = "Lesson: Start Freelancing in 5 Steps"; body = "A beginner lesson on launching your freelance hustle. Tap to view the step-by-step guide."; category = "learn"; imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600"; contentType = #lesson },
    { id = 75; title = "Lesson: Resell for Profit"; body = "An intermediate lesson on finding, pricing, and reselling items for steady income. Tap to view steps."; category = "learn"; imageUrl = "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600"; contentType = #lesson },
  ];

  // ---------------------------------------------------------------------------
  // Shop product catalog (8 sample products redeemable with coins).
  // Digital goods, courses, and vouchers appropriate for a Gen Alpha/Gen Z
  // earning-focused audience. Coin prices range from 50 to 500.
  // ---------------------------------------------------------------------------
  public let PRODUCT_CATALOG : [Product] = [
    { id = 1; title = "Freelance Starter Kit"; description = "Templates and scripts to land your first freelance client"; imageUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400"; priceCoins = 150; category = "digital" },
    { id = 2; title = "Budget Planner Template"; description = "A simple monthly budget template to track income and spending"; imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400"; priceCoins = 50; category = "digital" },
    { id = 3; title = "Side Hustle Idea Pack"; description = "30 beginner-friendly side hustle ideas with starter steps"; imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400"; priceCoins = 100; category = "digital" },
    { id = 4; title = "Crypto Basics Mini-Course"; description = "A short course explaining crypto, wallets, and safety basics"; imageUrl = "https://images.unsplash.com/photo-1518546405486-3e3a1a1e1e1e?w=400"; priceCoins = 250; category = "course" },
    { id = 5; title = "Resume Builder Voucher"; description = "Voucher for an AI-assisted resume builder tool"; imageUrl = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f04d?w=400"; priceCoins = 200; category = "voucher" },
    { id = 6; title = "Design Skills Starter Pack"; description = "Intro design templates and a guide to learning design for free"; imageUrl = "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400"; priceCoins = 175; category = "digital" },
    { id = 7; title = "Content Creator Toolkit"; description = "Hooks, captions, and a posting plan for new creators"; imageUrl = "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400"; priceCoins = 300; category = "digital" },
    { id = 8; title = "Investing Basics Course"; description = "A beginner course on stocks, index funds, and long-term investing"; imageUrl = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400"; priceCoins = 500; category = "course" },
    { id = 9; title = "Productivity App Voucher"; description = "Voucher for 1 month of a premium productivity app"; imageUrl = "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400"; priceCoins = 120; category = "voucher" },
    { id = 10; title = "AI Prompt Pack for Earning"; description = "Ready-to-use AI prompts for freelancing, content, and research"; imageUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400"; priceCoins = 90; category = "digital" },
  ];

  // ---------------------------------------------------------------------------
  // E-book catalog (6 sample e-books with full readable text).
  // Each fullText is 3-5 paragraphs of original content on money skills,
  // freelancing, saving, investing basics, digital skills, and side hustles.
  // ---------------------------------------------------------------------------
  public let EBOOK_CATALOG : [Ebook] = [
    {
      id = 1;
      title = "Money Skills 101";
      author = "The Coin Crew";
      coverUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400";
      description = "A beginner-friendly guide to saving, budgeting, and earning your first income.";
      category = "money";
      fullText = "Money skills are the foundation of every earning journey, and the good news is they are learnable at any age. The first skill is simple: track what comes in and what goes out. Write down every coin you earn and every coin you spend for one week, and patterns will appear that surprise you. Most people leak small amounts on things they do not value, and plugging those leaks is the fastest way to start saving.\n\nOnce you can see your money, the next step is to give every coin a job. A basic budget splits income into three buckets: needs, wants, and savings. Even if your income is small, paying yourself first by saving a fixed percentage builds a habit that compounds over time. The exact percentage matters less than the consistency.\n\nSaving is only half the picture. The other half is growing your income. Money skills include knowing how to price your time, how to ask for what you are worth, and how to add new income streams over time. Start with one small earning experiment, learn from it, and expand what works.\n\nFinally, protect what you build. Avoid debt that does not pay for itself, keep an emergency buffer, and never invest money you cannot afford to lose in things you do not understand. Money skills are not about getting rich quickly; they are about making steady, smart choices that add up. Read this book once, then come back to it after your first month of tracking. You will see your own progress in the numbers.";
    },
    {
      id = 2;
      title = "The Freelance Starter Guide";
      author = "Maya Holt";
      coverUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400";
      description = "How to land your first paid freelance client online, even with no experience.";
      category = "freelancing";
      fullText = "Freelancing is one of the most accessible ways to start earning online, and you do not need years of experience to begin. The first step is to pick one skill you can offer right now, such as writing, design, data entry, video editing, or research. Narrowing to a single skill keeps you focused and makes it easier for clients to understand what you do.\n\nNext, build a small portfolio. If you have no paid work yet, create three sample projects that show what you can do. A sample can be a short article, a mock design, or a quick edit. Clients care far more about what you can produce than about your resume, so let your work speak first.\n\nThen, find your first client. Start with people you know, post your service in beginner marketplaces, and reach out directly to small businesses. Your first client may pay very little, and that is fine. The goal of the first client is a review and a real project, not a big paycheck.\n\nDeliver more than promised, communicate clearly, and ask for a testimonial when the work is done. Repeat this loop and your rates will rise with each project. Freelancing rewards reliability over talent, so be the person who replies on time and meets deadlines. Within a few months you can turn a first client into a steady stream of work.";
    },
    {
      id = 3;
      title = "Save Smarter, Not Harder";
      author = "Ben Carter";
      coverUrl = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400";
      description = "Practical saving strategies that work even on a small income.";
      category = "saving";
      fullText = "Saving is often framed as sacrifice, but the most effective savers focus on systems, not willpower. The first system is automation. Move a set amount to savings the moment income arrives, before you can spend it. What you do not see in your spending account, you will not miss.\n\nThe second system is the 24-hour rule. For any non-essential purchase, wait one full day before buying. Most urges fade within hours, and the purchases that survive the wait are usually worth keeping. This single habit can cut impulse spending dramatically.\n\nThe third system is category caps. Set a monthly limit for categories that tend to creep up, like snacks or apps, and stop spending in that category once the cap is hit. Caps turn vague intentions into clear boundaries.\n\nFinally, celebrate small wins. Saving is a long game, and noticing progress keeps you motivated. Track your savings total each month, watch it grow, and let that momentum carry you forward. Saving smarter means designing your environment so the easy choice is also the right one.";
    },
    {
      id = 4;
      title = "Investing Basics for Beginners";
      author = "Lena Park";
      coverUrl = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a4?w=400";
      description = "A plain-language introduction to stocks, index funds, and long-term investing.";
      category = "investing";
      fullText = "Investing can sound intimidating, but at its core it is just putting your money to work so it can grow over time. The most important idea is compounding: when your earnings generate their own earnings, growth accelerates. The earlier you start, the more time compounding has to work in your favor, even if you begin with very small amounts.\n\nA common starting point is an index fund, which buys a small piece of many companies at once. Instead of trying to pick one winning stock, you own a slice of the whole market, which spreads risk. Index funds tend to have low fees and are a popular choice for long-term, hands-off investors.\n\nRisk is real and should be respected. Prices go up and down, and money invested can lose value in the short term. That is why investing is best for money you will not need for several years. Keep an emergency buffer in savings first, and only invest money you can leave invested.\n\nFinally, keep it simple and consistent. Many successful investors do nothing fancy; they invest a fixed amount regularly and let time do the work. Avoid chasing hot tips or anything you cannot explain in one sentence. Boring, steady investing is what builds lasting wealth.";
    },
    {
      id = 5;
      title = "Digital Skills That Pay";
      author = "Ryan Osei";
      coverUrl = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400";
      description = "In-demand digital skills you can learn for free and turn into income.";
      category = "digital-skills";
      fullText = "Digital skills are some of the fastest routes to earning online because they can be learned for free and practiced from anywhere. The first skill worth learning is basic writing for the web. Clear, useful writing is in constant demand for blogs, product descriptions, and social posts, and you can start practicing today by writing about topics you already know.\n\nThe second skill is simple design. You do not need to be an artist; you need to understand layout, color, and tools. Free design apps let you create social graphics, presentations, and thumbnails that small businesses will pay for. A few solid samples are enough to begin.\n\nThe third skill is data and spreadsheets. Many businesses have messy data and need someone to organize it. Learning basic spreadsheet functions and data cleaning can lead to steady, repeatable freelance work that is often overlooked by people chasing trendier skills.\n\nThe fourth skill is using AI tools well. Knowing how to prompt an AI, edit its output, and combine it with your own judgment is becoming a skill in itself. People who can use AI to produce useful work faster are increasingly in demand. Pick one skill, learn the basics for free, build two or three samples, and start offering it as a service.";
    },
    {
      id = 6;
      title = "Side Hustles From Scratch";
      author = "The Coin Crew";
      coverUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400";
      description = "Realistic side hustles you can start this week with little or no money.";
      category = "side-hustles";
      fullText = "A side hustle is any small income stream you build alongside your main activity, and many can be started with little or no money. The key is to start with what you already have: your time, your skills, and your network. The first realistic option is reselling, which means buying items at a low price and selling them at a higher price. Thrift finds, clearance items, and used goods can all be flipped online for a profit.\n\nA second option is service-based work tied to a skill you already have. If you can write, design, organize, tutor, or edit video, there are people willing to pay for that help. Start by offering your service to people you know, then expand to online marketplaces once you have a sample or two.\n\nA third option is content creation. Even with a small audience, creators can earn through simple digital products, affiliate links, or sponsored posts. The trick is consistency and picking a topic you can stick with for months, not days.\n\nWhatever you choose, treat your side hustle like a tiny business from day one. Track your time and your earnings, reinvest a portion into better tools, and keep your promises to every customer. Side hustles rarely replace a full income overnight, but steady effort turns them into reliable extra money over time.";
    },
  ];

  // ---------------------------------------------------------------------------
  // Lesson catalog (8 sample income-generation lessons).
  // Each lesson has 4-6 steps and a mix of beginner/intermediate/advanced
  // difficulty. Topics: freelancing, content creation, reselling, AI-assisted
  // earning, saving basics, digital skills, side hustles, investing basics.
  // ---------------------------------------------------------------------------
  public let LESSON_CATALOG : [Lesson] = [
    {
      id = 1;
      title = "Start Freelancing in 5 Steps";
      difficulty = #beginner;
      description = "Launch your freelance hustle this week, even with no prior clients.";
      category = "freelancing";
      steps = [
        "Pick one skill you can offer right now, such as writing, design, or data entry.",
        "Create three sample projects that show what you can do, even if they are self-made.",
        "Set a beginner rate that feels slightly uncomfortable but fair for your first client.",
        "Reach out to five people or small businesses and offer your service directly.",
        "Deliver more than promised, ask for a testimonial, and use it to find the next client.",
      ];
    },
    {
      id = 2;
      title = "Create Content That Earns";
      difficulty = #intermediate;
      description = "Turn a small audience into real income with a content plan.";
      category = "content-creation";
      steps = [
        "Choose one topic you can post about consistently for at least three months.",
        "Define your target viewer in one sentence so every post speaks to them.",
        "Plan a simple weekly posting schedule you can actually keep.",
        "Add one simple monetization path, such as a digital product or affiliate link.",
        "Review your analytics monthly and double down on the formats that perform best.",
        "Engage with every comment and build a small, loyal community around your topic.",
      ];
    },
    {
      id = 3;
      title = "Resell for Profit";
      difficulty = #beginner;
      description = "Find, price, and resell items for steady extra income.";
      category = "reselling";
      steps = [
        "Pick one category you understand, like clothing, electronics, or books.",
        "Source items cheaply from thrift stores, clearance racks, or online marketplaces.",
        "Research recent sold prices before buying so you know your profit margin.",
        "Take clear photos and write honest, detailed listings.",
        "Ship promptly and request reviews to build a trustworthy seller profile.",
      ];
    },
    {
      id = 4;
      title = "Earn With AI Assistants";
      difficulty = #intermediate;
      description = "Use AI tools to deliver paid work faster without sacrificing quality.";
      category = "ai-earning";
      steps = [
        "Choose one service you already offer, such as writing, research, or design.",
        "Identify the repetitive parts of that service that an AI can speed up.",
        "Write reusable prompts that produce a solid first draft you can edit.",
        "Always review and edit AI output before delivering it to a client.",
        "Track the time saved and raise your rates as your effective output grows.",
        "Stay transparent with clients about how you use AI in your workflow.",
      ];
    },
    {
      id = 5;
      title = "Saving Basics That Stick";
      difficulty = #beginner;
      description = "Build a saving habit that survives real life, not just motivation.";
      category = "saving";
      steps = [
        "Track every coin you earn and spend for one full week.",
        "Identify three small recurring expenses you do not truly value.",
        "Set a fixed percentage of income to save the moment it arrives.",
        "Move savings to a separate account so it is out of sight and out of mind.",
        "Review your savings total each month and celebrate the progress.",
      ];
    },
    {
      id = 6;
      title = "Learn a Digital Skill for Free";
      difficulty = #beginner;
      description = "Go from zero to a marketable digital skill using only free resources.";
      category = "digital-skills";
      steps = [
        "Pick one digital skill in demand, such as writing, design, or spreadsheets.",
        "Find two free beginner tutorials and complete them fully.",
        "Create three sample projects based on what you learned.",
        "Ask for feedback from one person who already does this skill.",
        "List your service online with your samples attached.",
      ];
    },
    {
      id = 7;
      title = "Build a Side Hustle System";
      difficulty = #advanced;
      description = "Turn a scrappy side hustle into a repeatable, growing income system.";
      category = "side-hustles";
      steps = [
        "Choose one hustle with clear demand and repeatable steps.",
        "Document your process so each new client or sale takes less effort.",
        "Set pricing that reflects your time, not just your costs.",
        "Reinvest a portion of earnings into tools that save you time.",
        "Track income and hours weekly to measure your real hourly rate.",
        "Decide whether to scale this hustle or pivot based on the data.",
      ];
    },
    {
      id = 8;
      title = "Investing Basics: First Steps";
      difficulty = #intermediate;
      description = "Understand investing enough to make a safe, simple first move.";
      category = "investing";
      steps = [
        "Build a small emergency buffer in savings before investing anything.",
        "Learn the difference between saving, investing, and speculating.",
        "Read a plain-language explanation of index funds and how they work.",
        "Choose a beginner-friendly platform with low fees.",
        "Start with a small, fixed amount you can leave invested for years.",
        "Invest the same amount regularly and avoid reacting to short-term swings.",
      ];
    },
  ];

  // ---------------------------------------------------------------------------
  // Date helpers (Date is yyyymmdd as Int).
  // ---------------------------------------------------------------------------

  // Convert a nanosecond timestamp (Time.now()) to a yyyymmdd Int.
  // We use a simple approximation: days since epoch * 86400 * 1_000_000_000 ns.
  public func timestampToDate(ts : Types.Timestamp) : Types.Date {
    let secondsPerDay : Int = 86400;
    let nsPerSecond : Int = 1_000_000_000;
    let daysSinceEpoch = ts / (secondsPerDay * nsPerSecond);
    // Convert days-since-epoch (1970-01-01) to yyyymmdd.
    // Use a civil-from-days algorithm (Howard Hinnant).
    let z = daysSinceEpoch + 719468;
    let era = (if (z >= 0) z else z - 146096) / 146097;
    let doe = z - era * 146097; // [0, 146096]
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // [0, 399]
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // [0, 365]
    let mp = (5 * doy + 2) / 153; // [0, 11]
    let d = doy - (153 * mp + 2) / 5 + 1; // [1, 31]
    let m = if (mp < 10) mp + 3 else mp - 9; // [1, 12]
    let year = if (m <= 2) y + 1 else y;
    year * 10000 + m * 100 + d;
  };

  public func today() : Types.Date {
    timestampToDate(Time.now());
  };

  // Difference in days between two yyyymmdd dates (a - b), via civil conversion.
  public func daysBetween(a : Types.Date, b : Types.Date) : Int {
    daysFromCivil(a) - daysFromCivil(b);
  };

  // Convert yyyymmdd to days-since-epoch (Howard Hinnant days_from_civil).
  public func daysFromCivil(date : Types.Date) : Int {
    let year = date / 10000;
    let m = (date / 100) % 100;
    let d = date % 100;
    let y = if (m <= 2) year - 1 else year;
    let era = (if (y >= 0) y else y - 399) / 400;
    let yoe = y - era * 400; // [0, 399]
    let mm = if (m > 2) m - 3 else m + 9; // [0, 11]
    let doy = (153 * mm + 2) / 5 + d - 1; // [0, 365]
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy; // [0, 146096]
    era * 146097 + doe - 719468;
  };

  // ---------------------------------------------------------------------------
  // Core operations. Each takes the shared RewardsState as the first argument.
  // ---------------------------------------------------------------------------

  // Create a new UserProfile if the principal doesn't exist, otherwise return
  // the existing profile.
  public func signInOrRegister(state : RewardsState, principal : Types.UserId, username : Text) : UserProfile {
    switch (state.users.get(principal)) {
      case (?existing) { existing };
      case null {
        let now = Time.now();
        let date = timestampToDate(now);
        let profile : UserProfile = {
          principal;
          username;
          totalCoins = 0;
          todayEarnings = 0;
          lifetimeEarnings = 0;
          streakCount = 0;
          streakFreezeCount = 1;
          lastActiveDate = date;
          joinDate = date;
          achievements = [];
        };
        state.users.add(principal, profile);
        state.awards.add(principal, []);
        state.redemptions.add(principal, []);
        state.dailyGoals.add(principal, Map.empty<Types.Date, DailyGoal>());
        state.awardedMilestones.add(principal, Map.empty<Nat, [Nat]>());
        profile;
      };
    };
  };

  // Retrieve a user's profile.
  public func getProfile(state : RewardsState, principal : Types.UserId) : ?UserProfile {
    state.users.get(principal);
  };

  // Award coins for a scroll milestone; returns the award record or an error.
  // Every 5 cards scrolled = 10 coins. Prevents duplicate awards for the same
  // (sessionId, milestone) pair.
  public func recordScrollMilestone(state : RewardsState, principal : Types.UserId, sessionId : Nat, milestone : Nat) : AwardResult {
    let profile = switch (state.users.get(principal)) {
      case (?p) { p };
      case null { return #err(#userNotFound) };
    };

    // Milestone must be a positive multiple of 5 to be awardable.
    if (milestone == 0 or milestone % 5 != 0) {
      return #err(#invalidMilestone);
    };

    // Check for duplicate award for this (sessionId, milestone).
    let userMilestones = switch (state.awardedMilestones.get(principal)) {
      case (?m) { m };
      case null {
        let fresh = Map.empty<Nat, [Nat]>();
        state.awardedMilestones.add(principal, fresh);
        fresh;
      };
    };
    let sessionMilestones = switch (userMilestones.get(sessionId)) {
      case (?list) { list };
      case null { [] };
    };
    if (sessionMilestones.contains(milestone)) {
      return #err(#invalidMilestone);
    };

    // Award 10 coins per milestone.
    let amount : Nat = 10;
    let awardId = state.nextAwardId;
    state.nextAwardId := awardId + 1;
    let award : CoinAward = {
      id = awardId;
      amount;
      timestamp = Time.now();
      reason = "Scroll milestone: " # milestone.toText() # " cards";
      sourceSessionId = sessionId;
    };

    // Append award to user's history (most-recent-first).
    let history = switch (state.awards.get(principal)) {
      case (?h) { h };
      case null { [] };
    };
    state.awards.add(principal, [award].concat(history));

    // Update profile earnings.
    let nowDate = today();
    let newToday = if (profile.lastActiveDate == nowDate) {
      profile.todayEarnings + amount;
    } else {
      amount; // new day resets todayEarnings
    };
    let updatedProfile : UserProfile = {
      profile with
      totalCoins = profile.totalCoins + amount;
      todayEarnings = newToday;
      lifetimeEarnings = profile.lifetimeEarnings + amount;
      lastActiveDate = nowDate;
    };

    // Update streak: if lastActiveDate was yesterday, increment; if today, no change;
    // if older, apply freeze logic.
    let updatedProfile2 = applyStreakUpdate(updatedProfile, nowDate);
    state.users.add(principal, updatedProfile2);

    // Record the milestone as awarded.
    userMilestones.add(sessionId, sessionMilestones.concat([milestone]));

    // Update daily goal progress for today.
    updateDailyGoalProgress(state, principal, nowDate, amount);

    // Check and unlock achievements.
    checkAchievements(state, principal, updatedProfile2);

    #ok(award);
  };

  // Apply streak update logic based on lastActiveDate vs today.
  // - same day: no change
  // - yesterday: increment streakCount
  // - older than 1 day: if freeze available, decrement freeze; else reset streak to 0
  public func applyStreakUpdate(profile : UserProfile, nowDate : Types.Date) : UserProfile {
    if (profile.lastActiveDate == nowDate) {
      // Already active today; no streak change.
      profile;
    } else {
      let diff = daysBetween(nowDate, profile.lastActiveDate);
      if (diff == 1) {
        // Consecutive day.
        { profile with streakCount = profile.streakCount + 1 };
      } else if (diff > 1) {
        // Gap of more than 1 day.
        if (profile.streakFreezeCount > 0) {
          { profile with streakFreezeCount = profile.streakFreezeCount - 1 };
        } else {
          { profile with streakCount = 0 };
        };
      } else {
        // diff <= 0 (future date or same — shouldn't happen, keep as-is).
        profile;
      };
    };
  };

  // Return the user's wallet balance summary.
  public func getWallet(state : RewardsState, principal : Types.UserId) : { totalCoins : Nat; todayEarnings : Nat; lifetimeEarnings : Nat } {
    switch (state.users.get(principal)) {
      case (?p) {
        { totalCoins = p.totalCoins; todayEarnings = p.todayEarnings; lifetimeEarnings = p.lifetimeEarnings };
      };
      case null {
        { totalCoins = 0; todayEarnings = 0; lifetimeEarnings = 0 };
      };
    };
  };

  // Return the user's earnings history (coin awards), most recent first.
  public func getEarningsHistory(state : RewardsState, principal : Types.UserId) : [CoinAward] {
    switch (state.awards.get(principal)) {
      case (?h) { h };
      case null { [] };
    };
  };

  // Return the user's streak information. Applies freeze/reset logic if the
  // lastActiveDate is more than 1 day ago.
  public func getStreak(state : RewardsState, principal : Types.UserId) : { streakCount : Nat; streakFreezeCount : Nat; lastActiveDate : Types.Date } {
    switch (state.users.get(principal)) {
      case (?p) {
        let nowDate = today();
        let diff = daysBetween(nowDate, p.lastActiveDate);
        if (diff > 1) {
          // Streak is stale; apply freeze/reset.
          if (p.streakFreezeCount > 0) {
            let updated : UserProfile = {
              p with streakFreezeCount = p.streakFreezeCount - 1;
            };
            state.users.add(principal, updated);
            { streakCount = updated.streakCount; streakFreezeCount = updated.streakFreezeCount; lastActiveDate = updated.lastActiveDate };
          } else {
            let updated : UserProfile = { p with streakCount = 0 };
            state.users.add(principal, updated);
            { streakCount = 0; streakFreezeCount = updated.streakFreezeCount; lastActiveDate = updated.lastActiveDate };
          };
        } else {
          { streakCount = p.streakCount; streakFreezeCount = p.streakFreezeCount; lastActiveDate = p.lastActiveDate };
        };
      };
      case null {
        { streakCount = 0; streakFreezeCount = 0; lastActiveDate = 0 };
      };
    };
  };

  // Return or create a DailyGoal for the given date.
  public func getDailyGoal(state : RewardsState, principal : Types.UserId, date : Types.Date) : ?DailyGoal {
    let userGoals = switch (state.dailyGoals.get(principal)) {
      case (?g) { g };
      case null {
        let fresh = Map.empty<Types.Date, DailyGoal>();
        state.dailyGoals.add(principal, fresh);
        fresh;
      };
    };
    switch (userGoals.get(date)) {
      case (?goal) { ?goal };
      case null {
        // Compute earnedCoins from today's awards for this date.
        let earned = sumAwardsForDate(state, principal, date);
        let target : Nat = 100;
        let goal : DailyGoal = {
          targetCoins = target;
          earnedCoins = earned;
          completed = earned >= target;
          date;
        };
        userGoals.add(date, goal);
        ?goal;
      };
    };
  };

  // Sum coin awards for a given date for a user.
  public func sumAwardsForDate(state : RewardsState, principal : Types.UserId, date : Types.Date) : Nat {
    let history = switch (state.awards.get(principal)) {
      case (?h) { h };
      case null { return 0 };
    };
    history.foldLeft(0, func(acc : Nat, award : CoinAward) : Nat {
      if (timestampToDate(award.timestamp) == date) {
        acc + award.amount;
      } else {
        acc;
      };
    });
  };

  // Update daily goal progress after an award.
  public func updateDailyGoalProgress(state : RewardsState, principal : Types.UserId, date : Types.Date, addedAmount : Nat) {
    let userGoals = switch (state.dailyGoals.get(principal)) {
      case (?g) { g };
      case null {
        let fresh = Map.empty<Types.Date, DailyGoal>();
        state.dailyGoals.add(principal, fresh);
        fresh;
      };
    };
    let goal = switch (userGoals.get(date)) {
      case (?existing) { existing };
      case null {
        let g : DailyGoal = {
          targetCoins = 100;
          earnedCoins = 0;
          completed = false;
          date;
        };
        userGoals.add(date, g);
        g;
      };
    };
    let newEarned = goal.earnedCoins + addedAmount;
    let updatedGoal : DailyGoal = {
      goal with
      earnedCoins = newEarned;
      completed = newEarned >= goal.targetCoins;
    };
    userGoals.add(date, updatedGoal);
  };

  // Redeem a reward for the user; deducts coins and records a redemption.
  public func redeemReward(state : RewardsState, principal : Types.UserId, rewardId : Nat) : RedeemResult {
    let profile = switch (state.users.get(principal)) {
      case (?p) { p };
      case null { return #err(#userNotFound) };
    };

    // Find the reward in the catalog.
    let reward = switch (REWARDS_CATALOG.find(func(r : RewardItem) : Bool { r.id == rewardId })) {
      case (?r) { r };
      case null { return #err(#rewardNotFound) };
    };

    // Check balance.
    if (profile.totalCoins < reward.coinPrice) {
      return #err(#insufficientCoins);
    };

    // Deduct coins and create redemption.
    let redemptionId = state.nextRedemptionId;
    state.nextRedemptionId := redemptionId + 1;
    let redemption : Redemption = {
      id = redemptionId;
      userId = principal;
      rewardId = reward.id;
      timestamp = Time.now();
      coinsDeducted = reward.coinPrice;
      status = #pending;
    };

    let updatedProfile : UserProfile = {
      profile with totalCoins = profile.totalCoins - reward.coinPrice;
    };
    state.users.add(principal, updatedProfile);

    // Append redemption to user's history (most-recent-first).
    let history = switch (state.redemptions.get(principal)) {
      case (?h) { h };
      case null { [] };
    };
    state.redemptions.add(principal, [redemption].concat(history));

    // Unlock "Big Spender" achievement (first redemption).
    checkAchievements(state, principal, updatedProfile);

    #ok(redemption);
  };

  // List available reward items.
  public func getRewards() : [RewardItem] {
    REWARDS_CATALOG;
  };

  // Return the leaderboard (top weekly earners). Weekly earnings = sum of
  // CoinAwards in the last 7 days. Includes seeded sample entries so the
  // leaderboard isn't empty for a new user.
  public func getLeaderboard(state : RewardsState) : [LeaderboardEntry] {
    let nowDate = today();
    let weekAgoDate = dateMinusDays(nowDate, 7);

    // Build entries from real users by iterating the users map.
    let realEntries : [{ user : Types.UserId; username : Text; weeklyEarnings : Nat }] =
      state.users.foldLeft<Types.UserId, UserProfile, [{ user : Types.UserId; username : Text; weeklyEarnings : Nat }]>(
        [],
        func(acc, p, profile) {
          let weekly = weeklyEarningsFor(state, p, weekAgoDate, nowDate);
          acc.concat([{ user = p; username = profile.username; weeklyEarnings = weekly }]);
        },
      );

    // Seed sample entries so a new user sees a populated leaderboard.
    // Convert principalText -> Principal here (Principal.fromText is non-static
    // and cannot live in the module-level constant).
    let sampleEntries : [{ user : Types.UserId; username : Text; weeklyEarnings : Nat }] =
      SAMPLE_LEADERBOARD_USERS.map(
        func(entry) {
          { user = Principal.fromText(entry.principalText); username = entry.username; weeklyEarnings = entry.weeklyEarnings };
        },
      );

    let allEntries = realEntries.concat(sampleEntries);

    // Sort by weeklyEarnings descending.
    let sorted = allEntries.sort(func(a, b) {
      Nat.compare(b.weeklyEarnings, a.weeklyEarnings);
    });

    // Assign ranks (1-based) using mapEntries (item, index).
    sorted.mapEntries(
      func(entry, index) {
        { entry with rank = index + 1 };
      },
    );
  };

  // Sample leaderboard entries so the board isn't empty for a new user.
  // Principals are stored as Text because Principal.fromText() is non-static
  // and cannot appear in a module-level let (M0014). They are converted to
  // Principal at use time inside getLeaderboard.
  public let SAMPLE_LEADERBOARD_USERS : [{ principalText : Text; username : Text; weeklyEarnings : Nat }] = [
    { principalText = "2vxsx-fae"; username = "TopScroller"; weeklyEarnings = 580 },
    { principalText = "2vxsx-fae"; username = "CoinKing"; weeklyEarnings = 420 },
    { principalText = "2vxsx-fae"; username = "ScrollSage"; weeklyEarnings = 310 },
    { principalText = "2vxsx-fae"; username = "DoomDominator"; weeklyEarnings = 250 },
    { principalText = "2vxsx-fae"; username = "FeedFanatic"; weeklyEarnings = 180 },
    { principalText = "2vxsx-fae"; username = "StreakStarter"; weeklyEarnings = 120 },
    { principalText = "2vxsx-fae"; username = "NewbieScroller"; weeklyEarnings = 60 },
  ];

  // Compute weekly earnings for a user between two dates (inclusive of start).
  public func weeklyEarningsFor(state : RewardsState, principal : Types.UserId, fromDate : Types.Date, toDate : Types.Date) : Nat {
    let history = switch (state.awards.get(principal)) {
      case (?h) { h };
      case null { return 0 };
    };
    history.foldLeft(0, func(acc : Nat, award : CoinAward) : Nat {
      let awardDate = timestampToDate(award.timestamp);
      if (awardDate >= fromDate and awardDate <= toDate) {
        acc + award.amount;
      } else {
        acc;
      };
    });
  };

  // Subtract days from a yyyymmdd date.
  public func dateMinusDays(date : Types.Date, days : Int) : Types.Date {
    let daysSinceEpoch = daysFromCivil(date);
    let newDays = daysSinceEpoch - days;
    daysToCivil(newDays);
  };

  // Convert days-since-epoch back to yyyymmdd.
  public func daysToCivil(days : Int) : Types.Date {
    let z = days + 719468;
    let era = (if (z >= 0) z else z - 146096) / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) mp + 3 else mp - 9;
    let year = if (m <= 2) y + 1 else y;
    year * 10000 + m * 100 + d;
  };

  // Return all achievement definitions.
  public func getAchievements() : [Achievement] {
    ACHIEVEMENTS_CATALOG;
  };

  // Check and unlock achievements for a user based on their current profile.
  public func checkAchievements(state : RewardsState, principal : Types.UserId, profile : UserProfile) {
    var unlocked : [Nat] = profile.achievements;
    var changed = false;
    for (achievement in ACHIEVEMENTS_CATALOG.vals()) {
      if (not unlocked.contains(achievement.id)) {
        let meets = switch (achievement.id) {
          case (1) { profile.lifetimeEarnings >= 1 };
          case (2) { profile.lifetimeEarnings >= 100 };
          case (3) { profile.lifetimeEarnings >= 1000 };
          case (4) { profile.lifetimeEarnings >= 10000 };
          case (5) { profile.streakCount >= 7 };
          case (6) { profile.streakCount >= 30 };
          case (7) {
            // Goal Getter: completed a daily goal today.
            switch (state.dailyGoals.get(principal)) {
              case (?goals) {
                switch (goals.get(today())) {
                  case (?g) { g.completed };
                  case null { false };
                };
              };
              case null { false };
            };
          };
          case (8) {
            // Big Spender: at least one redemption exists.
            switch (state.redemptions.get(principal)) {
              case (?h) { h.size() > 0 };
              case null { false };
            };
          };
          case (_) { false };
        };
        if (meets) {
          unlocked := unlocked.concat([achievement.id]);
          changed := true;
        };
      };
    };
    if (changed) {
      state.users.add(principal, { profile with achievements = unlocked });
    };
  };

  // Return a paginated slice of feed content. An optional category filter
  // narrows the slice to a single category (e.g. "finance"); `null` returns
  // items across all categories. This matches the frontend's
  // `getFeedContent(offset, limit, category?)` call shape.
  public func getFeedContent(offset : Nat, limit : Nat, category : ?Text) : [FeedContent] {
    let pool = switch (category) {
      case null { FEED_CATALOG };
      case (?cat) {
        if (cat == "") {
          FEED_CATALOG;
        } else {
          FEED_CATALOG.filter(func(item : FeedContent) : Bool { item.category == cat });
        };
      };
    };
    let total = pool.size();
    if (offset >= total) {
      return [];
    };
    let end = if (offset + limit > total) { total } else { offset + limit };
    pool.sliceToArray(offset, end);
  };

  // Return a paginated slice of feed content filtered by category.
  // An empty category Text returns all items (matches the "All" chip).
  public func getFeedContentByCategory(category : Text, offset : Nat, limit : Nat) : [FeedContent] {
    let filtered = if (category == "") {
      FEED_CATALOG;
    } else {
      FEED_CATALOG.filter(func(item : FeedContent) : Bool { item.category == category });
    };
    let total = filtered.size();
    if (offset >= total) {
      return [];
    };
    let end = if (offset + limit > total) { total } else { offset + limit };
    filtered.sliceToArray(offset, end);
  };

  // ---------------------------------------------------------------------------
  // Shop products, e-books, and lessons (contract stubs — develop wave fills
  // in catalog data and logic).
  // ---------------------------------------------------------------------------

  // Return a paginated slice of shop products.
  public func getProducts(offset : Nat, limit : Nat) : [Product] {
    paginate(PRODUCT_CATALOG, offset, limit);
  };

  // Return a single shop product by id.
  public func getProduct(id : Nat) : ?Product {
    PRODUCT_CATALOG.find(func(p : Product) : Bool { p.id == id });
  };

  // Redeem a shop product for the calling user with coins; records a
  // ProductRedemption and deducts the product's coin price from the user's
  // balance. Mirrors redeemReward but tracks shop activity separately in
  // productRedemptions so it is queryable on its own (no real Stripe checkout
  // or physical shipping — per doNotBuild).
  public func redeemProduct(state : RewardsState, principal : Types.UserId, productId : Nat) : RedeemProductResult {
    let profile = switch (state.users.get(principal)) {
      case (?p) { p };
      case null { return #err(#userNotFound) };
    };

    // Find the product in the catalog.
    let product = switch (PRODUCT_CATALOG.find(func(p : Product) : Bool { p.id == productId })) {
      case (?p) { p };
      case null { return #err(#notFound) };
    };

    // Check balance (totalCoins is the running balance maintained by
    // redeemReward and getWallet; product redemptions decrement it too).
    if (profile.totalCoins < product.priceCoins) {
      return #err(#insufficientCoins);
    };

    // Deduct coins and create the product redemption record.
    let redemptionId = state.nextProductRedemptionId;
    state.nextProductRedemptionId := redemptionId + 1;
    let redemption : ProductRedemption = {
      id = redemptionId;
      userId = principal;
      productId = product.id;
      redeemedAt = Time.now();
    };

    let updatedProfile : UserProfile = {
      profile with totalCoins = profile.totalCoins - product.priceCoins;
    };
    state.users.add(principal, updatedProfile);

    // Append redemption to the user's shop history (most-recent-first).
    let history = switch (state.productRedemptions.get(principal)) {
      case (?h) { h };
      case null { [] };
    };
    state.productRedemptions.add(principal, [redemption].concat(history));

    // Re-check achievements (e.g. Big Spender on first redemption).
    checkAchievements(state, principal, updatedProfile);

    #ok(redemption);
  };

  // Return a paginated slice of free-to-read e-books.
  public func getEbooks(offset : Nat, limit : Nat) : [Ebook] {
    paginate(EBOOK_CATALOG, offset, limit);
  };

  // Return a single e-book by id.
  public func getEbook(id : Nat) : ?Ebook {
    EBOOK_CATALOG.find(func(e : Ebook) : Bool { e.id == id });
  };

  // Return a paginated slice of income-learning lessons.
  public func getLessons(offset : Nat, limit : Nat) : [Lesson] {
    paginate(LESSON_CATALOG, offset, limit);
  };

  // Return a single lesson by id.
  public func getLesson(id : Nat) : ?Lesson {
    LESSON_CATALOG.find(func(l : Lesson) : Bool { l.id == id });
  };

  // Shared pagination helper: returns the [offset, offset+limit) slice of an
  // immutable array, clamped to the array bounds.
  func paginate<T>(catalog : [T], offset : Nat, limit : Nat) : [T] {
    let total = catalog.size();
    if (offset >= total) {
      return [];
    };
    let end = if (offset + limit > total) { total } else { offset + limit };
    catalog.sliceToArray(offset, end);
  };
};
