# FundMeLater

A goal commitment app where users bet on themselves. Put money at risk, accomplish your goal, earn it back. Fail, and it goes to charity.

## Documentation

- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — Phased implementation plan with 12 actionable phases. Use this to build the app step-by-step.
- **[IMPLEMENTATION_SPEC.md](./IMPLEMENTATION_SPEC.md)** — Full technical specification with code examples, database schema, and component implementations.

## Quick Start

This is a demo implementation with stubbed banking. All UX, animations, and flows are real — but no actual money moves.

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Prisma
- **Auth:** NextAuth.js (email magic link)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Email:** Resend
- **Banking:** Stubbed (Column-ready)

## Implementation Phases

| Phase | Focus |
|-------|-------|
| 1 | Project Foundation |
| 2 | Authentication & Banking Stub |
| 3 | Core UI Components |
| 4 | Wallet & Funding Flow |
| 5 | Bet Creation Flow |
| 6 | Dashboard & Bet Cards |
| 7 | Win Flow (Slot Machine) |
| 8 | Loss Flow (Charity Gacha) |
| 9 | Email Notifications |
| 10 | Stats & History |
| 11 | Landing Page & Polish |
| 12 | Testing & Deployment |

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed tasks in each phase.

## Core Features

- Place bets on personal goals with money at stake
- Win celebration with slot machine animation
- Loss flow with charity gacha spinner
- Spotter (accountability partner) email notifications
- Stats and streak tracking
- Sports betting language throughout

## License

MIT
