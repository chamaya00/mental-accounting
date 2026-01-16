# FundMeLater — Phased Implementation Plan

## Quick Reference

**What is FundMeLater?** A goal commitment app where users bet on themselves. Put money at risk, accomplish your goal, earn it back. Fail, and it goes to charity.

**Tech Stack:** Next.js 14 (App Router), PostgreSQL/Prisma, NextAuth.js, Tailwind CSS, Framer Motion, Resend

**This is a demo implementation** — All banking is stubbed. Column integration points are marked for future implementation.

---

## Phase 1: Project Foundation

**Goal:** Set up the project skeleton with all core dependencies and database schema.

### Tasks

- [ ] Initialize Next.js 14 project with TypeScript and App Router
  ```bash
  npx create-next-app@latest fundmelater --typescript --tailwind --app --src-dir
  ```
- [ ] Install core dependencies
  ```bash
  npm install prisma @prisma/client next-auth framer-motion resend
  npm install -D @types/node
  ```
- [ ] Create project directory structure:
  ```
  app/
  ├── layout.tsx
  ├── page.tsx
  ├── auth/
  ├── dashboard/
  ├── bet/
  ├── stats/
  ├── wallet/
  └── api/
  components/
  ├── ui/
  ├── bet/
  ├── animations/
  ├── wallet/
  ├── stats/
  └── spotter/
  lib/
  ├── prisma.ts
  ├── auth.ts
  ├── banking/
  ├── email/
  └── utils/
  prisma/
  types/
  public/sounds/
  public/images/
  ```
- [ ] Set up Prisma with PostgreSQL
  - Initialize Prisma: `npx prisma init`
  - Create schema with User, Bet, BetNotification, Account, Session, VerificationToken models
  - Run migrations: `npx prisma migrate dev --name init`
- [ ] Create `.env.example` with all required environment variables
- [ ] Create basic layout with Tailwind CSS configuration
- [ ] Set up TypeScript types in `types/index.ts`

### Deliverables
- Working Next.js project with all dependencies
- Database schema migrated and ready
- Basic app shell renders at localhost:3000

### Schema Reference

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  balanceCents      Int       @default(0)
  vaultCents        Int       @default(0)
  lifetimeEarnings  Int       @default(0)
  lifetimeDonations Int       @default(0)
  columnEntityId    String?
  mainAccountId     String?
  vaultAccountId    String?
  // ... relations
}

model Bet {
  id              String    @id @default(cuid())
  userId          String
  goal            String
  stakeCents      Int
  deadline        DateTime
  status          BetStatus @default(ACTIVE)
  spotterEmail    String?
  spotterName     String?
  completedAt     DateTime?
  failedAt        DateTime?
  charityId       String?
  charityName     String?
  donationCents   Int?
  platformFeeCents Int?
  // ... transfer IDs for Column
}

enum BetStatus { ACTIVE, WON, LOST, CANCELLED }
```

---

## Phase 2: Authentication & Banking Stub

**Goal:** Implement authentication and the stubbed banking layer.

### Tasks

- [ ] Configure NextAuth.js with email magic links
  - Create `lib/auth.ts` with NextAuth configuration
  - Set up `app/api/auth/[...nextauth]/route.ts`
  - Configure email provider for magic links
- [ ] Create Prisma client singleton in `lib/prisma.ts`
- [ ] Implement banking interface in `lib/banking/index.ts`:
  ```typescript
  interface BankingProvider {
    getBalance(userId: string): Promise<{ available: number; vault: number }>;
    stakeBet(userId: string, amountCents: number, betId: string): Promise<{ transferId: string }>;
    releaseBet(userId: string, amountCents: number, betId: string): Promise<{ transferId: string }>;
    forfeitBet(userId: string, amountCents: number, betId: string, charityId: string): Promise<{...}>;
    addFunds(userId: string, amountCents: number): Promise<{ transferId: string }>;
  }
  ```
- [ ] Implement `StubBankingProvider` in `lib/banking/stub.ts`
  - All operations update Prisma User balances
  - Returns fake transfer IDs
- [ ] Create placeholder `lib/banking/column.ts` with TODO comments
- [ ] Create utility functions:
  - `lib/utils/currency.ts` — format cents to dollars
  - `lib/utils/dates.ts` — countdown calculations
  - `lib/utils/stats.ts` — win rate, streak calculations

### Deliverables
- Users can sign in via magic link email
- Banking operations work via stubbed provider
- New users get demo starting balance ($100)

---

## Phase 3: Core UI Components

**Goal:** Build all reusable UI components.

### Tasks

- [ ] Create base UI components in `components/ui/`:
  - `Button.tsx` — primary, secondary, danger variants
  - `Card.tsx` — container with border and shadow
  - `Input.tsx` — styled form input
  - `Modal.tsx` — overlay modal with Framer Motion
  - `ProgressBar.tsx` — animated progress indicator
- [ ] Create wallet components in `components/wallet/`:
  - `BalanceDisplay.tsx` — shows available + vault amounts
  - `FundWalletModal.tsx` — simulated add funds form
- [ ] Create spotter component:
  - `components/spotter/SpotterInput.tsx` — email + name input for accountability partner
- [ ] Create stats components in `components/stats/`:
  - `WinRateCard.tsx` — percentage display
  - `StreakDisplay.tsx` — current and best streak
  - `AchievementBadge.tsx` — optional gamification

### Deliverables
- Complete component library ready for pages
- All components styled with Tailwind CSS
- Components are responsive (mobile-first)

---

## Phase 4: Wallet & Funding Flow

**Goal:** Implement the wallet page and simulated funding.

### Tasks

- [ ] Create wallet API routes:
  - `app/api/wallet/route.ts` — GET balance
  - `app/api/wallet/fund/route.ts` — POST add funds (simulated)
- [ ] Build wallet page at `app/wallet/page.tsx`:
  - Display current balance (available + vault)
  - "Add Funds" button opens modal
  - Transaction history (optional)
- [ ] Implement `FundWalletModal` functionality:
  - Amount input with preset buttons ($10, $25, $50, $100)
  - Simulated "processing" delay
  - Success state updates balance

### Deliverables
- Users can view their balance
- Users can add simulated funds
- Balance updates immediately in UI

---

## Phase 5: Bet Creation Flow

**Goal:** Users can place new bets.

### Tasks

- [ ] Create charity pool in `lib/charities.ts`:
  - Array of 10 charities with id, name, category, icon, description
  - Helper functions: `getRandomCharity()`, `getCharityById()`
- [ ] Build bet form component `components/bet/BetForm.tsx`:
  - Goal text input
  - Stake amount input (minimum $5)
  - Deadline date/time picker
  - Spotter email/name (optional)
  - Balance validation
- [ ] Create bet API route `app/api/bets/route.ts`:
  - GET — list user's bets
  - POST — create new bet
    - Validate balance
    - Call `banking.stakeBet()`
    - Create bet record
    - Send spotter notification (if provided)
- [ ] Build new bet page at `app/bet/new/page.tsx`:
  - Uses BetForm component
  - Redirects to dashboard on success

### Deliverables
- Users can create new bets
- Money moves from available to vault
- Spotter receives notification email (if provided)

---

## Phase 6: Dashboard & Bet Cards

**Goal:** Display active bets with countdown timers.

### Tasks

- [ ] Create bet card component `components/bet/BetCard.tsx`:
  - Shows goal, stake, deadline
  - Countdown timer component
  - Spotter indicator
  - Status badge (active/won/lost)
  - Action buttons (Claim Win / Give Up)
- [ ] Create countdown component `components/bet/BetCountdown.tsx`:
  - Days, hours, minutes, seconds
  - Color changes as deadline approaches
  - Expired state
- [ ] Build dashboard page at `app/dashboard/page.tsx`:
  - List of active bets
  - Completed bets section
  - Empty state for new users
  - Quick stats summary
- [ ] Create bet detail page at `app/bet/[id]/page.tsx`:
  - Full bet information
  - Timeline of events
  - Action buttons

### Deliverables
- Dashboard shows all user bets
- Countdown timers update in real-time
- Users can navigate to bet details

---

## Phase 7: Win Flow

**Goal:** Implement the claim win functionality with celebration.

### Tasks

- [ ] Create win API route `app/api/bets/[id]/route.ts`:
  - PATCH — claim win
    - Validate bet ownership and status
    - Call `banking.releaseBet()`
    - Update bet status to WON
    - Send spotter notification
- [ ] Create claim win button `components/bet/ClaimWinButton.tsx`:
  - Confirmation state
  - Loading state
  - Triggers animation on success
- [ ] Build slot machine animation `components/animations/SlotMachine.tsx`:
  - Three spinning reels with money symbols
  - Stops on triple match
  - Displays payout amount
  - "You bet on yourself. You won." message
- [ ] Create confetti effect `components/animations/Confetti.tsx`:
  - Canvas-based confetti particles
  - Triggered on win
- [ ] Add sound effects:
  - `/public/sounds/cha-ching.mp3`
  - `/public/sounds/slot-spin.mp3`
  - `/public/sounds/slot-stop.mp3`

### Deliverables
- Users can claim wins on active bets
- Slot machine celebration plays
- Money returns to available balance
- Spotter notified of win

---

## Phase 8: Loss Flow

**Goal:** Implement the give up / loss functionality with charity selection.

### Tasks

- [ ] Create loss API route `app/api/bets/[id]/lose/route.ts`:
  - POST — process loss
    - Validate bet ownership and status
    - Accept selected charityId
    - Call `banking.forfeitBet()`
    - Update bet with charity info and donation amount
    - Send spotter notification
- [ ] Build charity gacha spinner `components/animations/CharityGacha.tsx`:
  - Intro phase: "Time's Up" message
  - Spinning phase: rapid cycling through charities
  - Stop button for user control
  - Reveal phase: shows selected charity
  - Confirm donation button
- [ ] Create charities API route `app/api/charities/route.ts`:
  - GET — return charity pool
- [ ] Integrate loss flow with BetCard:
  - "Give Up" button triggers gacha
  - Gacha selection calls loss API
  - Card updates to show donation info

### Deliverables
- Users can forfeit bets
- Charity gacha spinner selects random charity
- Donation amount (minus $0.50 fee) tracked
- Spotter notified of loss

---

## Phase 9: Email Notifications

**Goal:** Set up email system with all notification types.

### Tasks

- [ ] Configure Resend in `lib/email/index.ts`:
  - API client setup
  - Send function wrapper
- [ ] Create email templates in `lib/email/templates/`:
  - `bet-placed.tsx` — notify spotter of new bet
  - `deadline-reminder.tsx` — reminders at 7d, 3d, 1d, 6h
  - `win-notification.tsx` — notify spotter of win
  - `loss-notification.tsx` — notify spotter of loss + charity
- [ ] Create spotter notification API `app/api/spotter/notify/route.ts`:
  - Handles all notification types
  - Records notification in database
- [ ] Implement reminder system (optional cron job):
  - Query bets with approaching deadlines
  - Send appropriate reminders
  - Track sent notifications to avoid duplicates

### Deliverables
- Spotter receives emails at key moments
- Email templates are branded and informative
- Notifications tracked in database

---

## Phase 10: Stats & History

**Goal:** Build the stats page with win rate, streaks, and history.

### Tasks

- [ ] Create stats calculation utilities in `lib/utils/stats.ts`:
  - Calculate win rate percentage
  - Calculate current streak
  - Calculate best streak
  - Aggregate totals (won, lost, donated)
- [ ] Build stats page at `app/stats/page.tsx`:
  - Win rate display (percentage + visual)
  - Current streak counter
  - Best streak record
  - Total wagered / won / donated
  - Bet history list
- [ ] Create history list component:
  - Paginated list of past bets
  - Filter by status (won/lost/all)
  - Sort by date

### Deliverables
- Users can view their betting statistics
- Win rate and streaks motivate continued use
- Full history accessible

---

## Phase 11: Landing Page & Polish

**Goal:** Create compelling landing page and polish the entire experience.

### Tasks

- [ ] Build landing page at `app/page.tsx`:
  - Hero section with value proposition
  - How it works (3 steps)
  - Example bet card
  - CTA to sign up
- [ ] Mobile responsive refinements:
  - Test all pages on mobile viewports
  - Fix any layout issues
  - Ensure touch targets are adequate
- [ ] Loading states:
  - Skeleton loaders for data fetching
  - Button loading spinners
  - Page transition animations
- [ ] Error handling:
  - Toast notifications for errors
  - Friendly error messages
  - Retry mechanisms
- [ ] Navigation:
  - Header with logo and nav links
  - User menu with sign out
  - Footer with links

### Deliverables
- Professional landing page
- Smooth, polished UX throughout
- Proper error handling

---

## Phase 12: Testing & Deployment

**Goal:** Test all flows and deploy to production.

### Tasks

- [ ] Create seed script `prisma/seed.ts`:
  - Demo user with balance
  - Sample bets in various states
  - Test data for stats
- [ ] End-to-end testing:
  - Sign up flow
  - Add funds
  - Create bet
  - Claim win (verify animation + balance)
  - Give up (verify gacha + donation)
  - Stats accuracy
- [ ] Deploy to Vercel:
  - Connect GitHub repository
  - Configure environment variables
  - Set up PostgreSQL (Vercel Postgres or external)
- [ ] Final polish:
  - Fix any discovered bugs
  - Performance optimization
  - Console error cleanup

### Deliverables
- App deployed and accessible
- All flows tested and working
- Demo data available for showcasing

---

## Environment Variables Reference

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="FundMeLater <bets@yourdomain.com>"

# Banking (future)
USE_COLUMN="false"
COLUMN_API_KEY=""

# Demo mode
DEMO_MODE="true"
DEMO_STARTING_BALANCE="10000"  # $100 in cents
```

---

## Future: Column Integration

When ready for real money, these tasks unlock the full product:

- [ ] Get Column sandbox credentials
- [ ] Implement user onboarding (create Column entity + accounts)
- [ ] Implement Plaid for external bank linking
- [ ] Replace `StubBankingProvider` with `ColumnBankingProvider`
- [ ] Set up charity counterparties in Column
- [ ] Implement webhook handlers for transfer status
- [ ] Add proper error handling for failed transfers
- [ ] Test full flow in Column sandbox
- [ ] Legal review (terms of service, money transmission)
- [ ] Get Column production credentials
- [ ] Launch with real money

---

## Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Foundation | Project skeleton + database |
| 2 | Auth & Banking | Magic links + stubbed banking |
| 3 | UI Components | Reusable component library |
| 4 | Wallet | View balance + add funds |
| 5 | Bet Creation | Place new bets |
| 6 | Dashboard | View bets + countdown |
| 7 | Win Flow | Claim wins + slot machine |
| 8 | Loss Flow | Give up + charity gacha |
| 9 | Emails | Spotter notifications |
| 10 | Stats | Win rate + history |
| 11 | Polish | Landing page + UX |
| 12 | Deploy | Testing + production |

Each phase builds on the previous. Complete them in order for best results.
