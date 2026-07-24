# Design Brief

## Direction

ScrollCoin — a dark, gamified scroll-to-earn content hub; arcade-meets-fintech warmth across reels, shop, AI news, and learning.

## Tone

Premium arcade warmth — deep charcoal canvas with luminous gold coin accents; playful but trustworthy, never childish.

## Differentiation

Gold is the protagonist: coin counts, milestones, and streaks glow against warm-dark surfaces, making earning feel tangible and addictive.

## Color Palette

| Token      | OKLCH           | Role                                |
| ---------- | --------------- | ----------------------------------- |
| background | 0.14 0.015 50   | warm dark charcoal canvas           |
| foreground | 0.95 0.008 60   | warm off-white text                 |
| card       | 0.18 0.018 50   | elevated content surfaces           |
| primary    | 0.78 0.165 80   | gold — coins, CTAs, active states   |
| accent     | 0.62 0.16 25    | dusty coral — secondary highlights  |
| muted      | 0.22 0.02 50    | subtle backgrounds, disabled states |
| success    | 0.7 0.16 150    | streak/goal completion              |
| warning    | 0.78 0.15 70    | streak freeze, low-balance alerts   |

## Content Type Tints

| Token  | OKLCH           | Role                                          |
| ------ | --------------- | --------------------------------------------- |
| reel   | 0.62 0.18 320   | magenta/violet — vertical short-form feed     |
| shop   | 0.7 0.16 155    | emerald — product grid, redeem buttons        |
| ainews | 0.68 0.15 230   | sky blue — AI news cards, source badges       |
| learn  | 0.66 0.16 290   | warm violet — ebook covers, lesson cards      |

## Typography

- Display: Space Grotesk — headings, coin counts, hero numbers
- Body: General Sans — paragraphs, UI labels, feed content
- Mono: JetBrains Mono — tabular coin balances, timestamps
- Scale: hero `text-5xl font-bold tracking-tight`, h2 `text-3xl font-bold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered warm-dark surfaces; subtle shadows lift cards, coin-shadow glow highlights reward moments without neon cheapness.

## Structural Zones

| Zone    | Background           | Border                  | Notes                                    |
| ------- | -------------------- | ----------------------- | ---------------------------------------- |
| Header  | bg-card              | border-b border-border  | sticky daily-goal progress bar           |
| Nav     | bg-card/80 backdrop  | border-b border-border  | 9-tab compact pill nav, scrollable, hidden scrollbar (nav-pill-scroll) |
| Content | bg-background        | —                       | tab-specific layout per zone below      |
| Footer  | bg-muted/40          | border-t border-border  | bottom nav with coin-balance pill        |

## Tab Layouts

- Reels: full-bleed vertical 9:16 snap feed (reel-snap utility), creator handle + like button overlay, swipe advances one card
- Shop: 2-column product grid, coin-price badges, redeem button triggers card-press
- AI News: single-column image cards with source badge + tinted top border (ainews)
- Learn: ebook cover row + lesson card list, reader-fade transition into ebook prose (reader-prose)

## Spacing & Rhythm

Feed cards gap-3, section gaps gap-6, content padding px-4; shop grid gap-3, learn list gap-4.

## Component Patterns

- Buttons: rounded-full, primary gold gradient for earn/redeem, secondary muted for nav
- Cards: rounded-2xl (14px), bg-card, shadow-subtle, hover lifts to shadow-elevated
- Badges: rounded-full pills, gold for coins, coral for streaks, green for goals, tint per content type
- Progress bars: gold gradient fill with shimmer animation on active earning
- Tab pills: compact, active state uses content-type tint, inactive muted

## Motion

- Entrance: coin-pop (0.6s bounce) on milestone reward, fade-up on new feed cards
- Hover: cards lift via shadow-elevated, transition-smooth 0.3s
- Decorative: coin-float on streak icons, streak-pulse on active streaks, progress-shimmer on goal bars
- Reel snap: reel-snap (0.32s spring) — subtle scale pulse on vertical snap landing
- Shop press: card-press (0.18s) — press-down feedback on redeem buttons
- Reader fade: reader-fade (0.4s) — fade-in + lift on ebook page transitions

## Constraints

- Gold/amber is the only accent for earning — never dilute with rainbow
- Content-type tints are for format identity only, not earning accents
- Mobile-first: all layouts must work at 375px width before scaling up
- Dark mode is primary and intentional; no light mode implementation
- No real-money visual cues — coins are playful tokens, not currency

## Signature Detail

The coin-pop animation with gold radial-gradient glow on every scroll milestone — earning becomes a tactile, celebratory micro-moment.
