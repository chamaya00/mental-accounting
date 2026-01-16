# FundMeLater — Full Implementation Specification

> This document contains detailed code examples and specifications for implementing FundMeLater.
> See `IMPLEMENTATION_PLAN.md` for the phased approach.

---

## Overview

**FundMeLater** is a goal commitment app where users bet on themselves. Put money at risk, accomplish your goal, earn it back. Fail, and it goes to charity.

This is a **demo implementation** with stubbed banking. All the UX, animations, and flows are real — but no actual money moves. Column integration points are clearly marked for future implementation.

---

## Core Concept

- User places a "bet" on accomplishing a personal goal
- Money moves from their balance to a vault (staked)
- Win: Money returns with celebration
- Lose: Charity gacha spin, money "donated"

### Monetization (Implemented in Demo)

- $0.50 platform fee on losses
- Interest on float (tracked but simulated)

### Key UX Elements

- Sports betting language (wager, payout, win/lose)
- Slot machine celebration on win
- Charity gacha spinner on loss
- Spotter (accountability partner) email notifications
- Stats and streaks

---

## Tech Stack

```
Framework:       Next.js 14 (App Router)
Database:        PostgreSQL via Prisma
Auth:            NextAuth.js (email magic link)
Styling:         Tailwind CSS
Animations:      Framer Motion
Email:           Resend (for spotter notifications)
Banking:         Stubbed (Column-ready interfaces)
Deployment:      Vercel
```

---

## Project Structure

```
fundmelater/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   └── [...nextauth]/route.ts
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard (active bets)
│   ├── bet/
│   │   ├── new/page.tsx            # Place new bet
│   │   └── [id]/page.tsx           # Bet detail view
│   ├── stats/
│   │   └── page.tsx                # Win rate, streaks, history
│   ├── wallet/
│   │   └── page.tsx                # Balance, add funds (simulated)
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── bets/
│       │   ├── route.ts            # GET all, POST new
│       │   ├── [id]/route.ts       # GET one, PATCH (claim win)
│       │   └── [id]/lose/route.ts  # POST (process loss)
│       ├── wallet/
│       │   ├── route.ts            # GET balance
│       │   └── fund/route.ts       # POST add funds (simulated)
│       ├── charities/
│       │   └── route.ts            # GET charity pool
│       └── spotter/
│           └── notify/route.ts     # POST send spotter email
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ProgressBar.tsx
│   ├── bet/
│   │   ├── BetCard.tsx             # Single bet display
│   │   ├── BetForm.tsx             # New bet form
│   │   ├── BetCountdown.tsx        # Time remaining
│   │   └── ClaimWinButton.tsx
│   ├── animations/
│   │   ├── SlotMachine.tsx         # Win celebration
│   │   ├── CharityGacha.tsx        # Loss spinner
│   │   ├── Confetti.tsx
│   │   └── CashRegister.tsx        # Cha-ching effect
│   ├── wallet/
│   │   ├── BalanceDisplay.tsx
│   │   └── FundWalletModal.tsx
│   ├── stats/
│   │   ├── WinRateCard.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── AchievementBadge.tsx
│   └── spotter/
│       └── SpotterInput.tsx        # Email input for accountability
├── lib/
│   ├── prisma.ts                   # Prisma client
│   ├── auth.ts                     # NextAuth config
│   ├── banking/
│   │   ├── index.ts                # Banking interface
│   │   ├── stub.ts                 # Stubbed implementation
│   │   └── column.ts               # Column implementation (future)
│   ├── email/
│   │   ├── index.ts
│   │   └── templates/
│   │       ├── bet-placed.tsx
│   │       ├── deadline-reminder.tsx
│   │       ├── win-notification.tsx
│   │       └── loss-notification.tsx
│   ├── charities.ts                # Charity pool data
│   └── utils/
│       ├── currency.ts             # Format cents to dollars
│       ├── dates.ts                # Countdown calculations
│       └── stats.ts                # Win rate, streak calcs
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                     # Demo data
├── public/
│   ├── sounds/
│   │   ├── cha-ching.mp3
│   │   ├── slot-spin.mp3
│   │   └── slot-stop.mp3
│   └── images/
│       └── charity-icons/
├── types/
│   └── index.ts                    # TypeScript types
└── .env.example
```

---

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Wallet (simulated)
  balanceCents      Int   @default(0)    // Available balance
  vaultCents        Int   @default(0)    // Money in active bets
  lifetimeEarnings  Int   @default(0)    // Total winnings
  lifetimeDonations Int   @default(0)    // Total to charity

  // Banking (for Column integration)
  columnEntityId    String?
  mainAccountId     String?
  vaultAccountId    String?

  bets        Bet[]
  sessions    Session[]
  accounts    Account[]
}

model Bet {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  // Bet details
  goal            String
  stakeCents      Int
  deadline        DateTime
  status          BetStatus   @default(ACTIVE)

  // Spotter (accountability partner)
  spotterEmail    String?
  spotterName     String?

  // Outcome tracking
  completedAt     DateTime?
  failedAt        DateTime?
  charityId       String?
  charityName     String?
  donationCents   Int?
  platformFeeCents Int?

  // Column references (for real implementation)
  stakeTransferId   String?
  returnTransferId  String?
  donationTransferId String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  notifications BetNotification[]
}

enum BetStatus {
  ACTIVE
  WON
  LOST
  CANCELLED
}

model BetNotification {
  id        String    @id @default(cuid())
  betId     String
  bet       Bet       @relation(fields: [betId], references: [id])
  type      NotificationType
  sentAt    DateTime  @default(now())
  recipient String    // 'user' or 'spotter'
}

enum NotificationType {
  BET_PLACED
  REMINDER_7_DAYS
  REMINDER_3_DAYS
  REMINDER_1_DAY
  REMINDER_6_HOURS
  WIN
  LOSS
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Banking Interface (Stubbed)

```typescript
// lib/banking/index.ts

export interface BankingProvider {
  // Account operations
  getBalance(userId: string): Promise<{ available: number; vault: number }>;

  // Bet operations
  stakeBet(userId: string, amountCents: number, betId: string): Promise<{ transferId: string }>;
  releaseBet(userId: string, amountCents: number, betId: string): Promise<{ transferId: string }>;
  forfeitBet(userId: string, amountCents: number, betId: string, charityId: string): Promise<{
    donationTransferId: string;
    donationCents: number;
    platformFeeCents: number;
  }>;

  // Funding (simulated in demo)
  addFunds(userId: string, amountCents: number): Promise<{ transferId: string }>;
}

// Get the active banking provider
export function getBankingProvider(): BankingProvider {
  // Switch between stub and real implementation
  if (process.env.USE_COLUMN === 'true') {
    // return new ColumnBankingProvider();
    throw new Error('Column integration not yet implemented');
  }

  return new StubBankingProvider();
}
```

```typescript
// lib/banking/stub.ts

import { prisma } from '@/lib/prisma';
import { BankingProvider } from './index';

export class StubBankingProvider implements BankingProvider {

  async getBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceCents: true, vaultCents: true }
    });

    return {
      available: user?.balanceCents ?? 0,
      vault: user?.vaultCents ?? 0
    };
  }

  async stakeBet(userId: string, amountCents: number, betId: string) {
    // Move money from available to vault
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceCents: { decrement: amountCents },
        vaultCents: { increment: amountCents }
      }
    });

    // Return fake transfer ID
    return { transferId: `stub_stake_${betId}_${Date.now()}` };
  }

  async releaseBet(userId: string, amountCents: number, betId: string) {
    // Move money from vault back to available
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceCents: { increment: amountCents },
        vaultCents: { decrement: amountCents },
        lifetimeEarnings: { increment: amountCents }
      }
    });

    return { transferId: `stub_release_${betId}_${Date.now()}` };
  }

  async forfeitBet(userId: string, amountCents: number, betId: string, charityId: string) {
    const platformFeeCents = 50; // $0.50
    const donationCents = amountCents - platformFeeCents;

    // Remove from vault, track donation
    await prisma.user.update({
      where: { id: userId },
      data: {
        vaultCents: { decrement: amountCents },
        lifetimeDonations: { increment: donationCents }
      }
    });

    return {
      donationTransferId: `stub_donate_${betId}_${Date.now()}`,
      donationCents,
      platformFeeCents
    };
  }

  async addFunds(userId: string, amountCents: number) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceCents: { increment: amountCents }
      }
    });

    return { transferId: `stub_fund_${userId}_${Date.now()}` };
  }
}
```

```typescript
// lib/banking/column.ts

import { BankingProvider } from './index';

/**
 * Column Bank API Integration
 *
 * Prerequisites:
 * 1. Column sandbox/production API key
 * 2. Platform entity and accounts set up
 * 3. User entity creation on signup
 *
 * Account structure per user:
 * - Main Account: Available balance for spending
 * - Vault Account: Money locked in active bets
 *
 * Money flows:
 * - FundMeLater bet: Book transfer Main → Vault
 * - Win bet: Book transfer Vault → Main
 * - Lose bet: ACH credit Vault → Charity counterparty
 */

export class ColumnBankingProvider implements BankingProvider {
  private apiKey: string;
  private baseUrl = 'https://api.column.com';

  constructor() {
    this.apiKey = process.env.COLUMN_API_KEY!;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${this.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Column API error: ${response.status}`);
    }

    return response.json();
  }

  async getBalance(userId: string) {
    // TODO: Fetch user's Column account IDs from database
    // TODO: Call Column API to get account balances

    // const mainAccount = await this.request(`/bank-accounts/${mainAccountId}`);
    // const vaultAccount = await this.request(`/bank-accounts/${vaultAccountId}`);

    // return {
    //   available: mainAccount.balances.available_amount,
    //   vault: vaultAccount.balances.available_amount
    // };

    throw new Error('Not implemented');
  }

  async stakeBet(userId: string, amountCents: number, betId: string) {
    // TODO: Get user's account IDs
    // TODO: Create book transfer from main to vault

    // const transfer = await this.request('/transfers/book', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     amount: amountCents,
    //     sender_bank_account_id: mainAccountId,
    //     receiver_bank_account_id: vaultAccountId,
    //     description: `FundMeLater bet: ${betId}`,
    //   }),
    // });

    // return { transferId: transfer.id };

    throw new Error('Not implemented');
  }

  async releaseBet(userId: string, amountCents: number, betId: string) {
    // TODO: Book transfer from vault back to main

    // const transfer = await this.request('/transfers/book', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     amount: amountCents,
    //     sender_bank_account_id: vaultAccountId,
    //     receiver_bank_account_id: mainAccountId,
    //     description: `Win payout: ${betId}`,
    //   }),
    // });

    // return { transferId: transfer.id };

    throw new Error('Not implemented');
  }

  async forfeitBet(userId: string, amountCents: number, betId: string, charityId: string) {
    // TODO: ACH credit from vault to charity

    // const platformFeeCents = 50;
    // const donationCents = amountCents - platformFeeCents;

    // const transfer = await this.request('/transfers/ach', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     type: 'CREDIT',
    //     amount: donationCents,
    //     bank_account_id: vaultAccountId,
    //     counterparty_id: charityCounterpartyId,
    //     description: `FundMeLater donation: ${betId}`,
    //   }),
    // });

    // return {
    //   donationTransferId: transfer.id,
    //   donationCents,
    //   platformFeeCents
    // };

    throw new Error('Not implemented');
  }

  async addFunds(userId: string, amountCents: number) {
    // TODO: ACH debit from user's external bank to main account
    // This requires Plaid integration to get user's external bank details

    throw new Error('Not implemented');
  }
}

/**
 * User Onboarding with Column
 *
 * When a new user signs up:
 *
 * 1. Create Person Entity
 *    POST /entities/person
 *    { first_name, last_name, email, ... }
 *
 * 2. Create Main Account
 *    POST /bank-accounts
 *    { entity_id, description: "Main Account" }
 *
 * 3. Create Vault Account
 *    POST /bank-accounts
 *    { entity_id, description: "Bet Vault" }
 *
 * 4. Store IDs in database
 *    user.columnEntityId = entity.id
 *    user.mainAccountId = mainAccount.id
 *    user.vaultAccountId = vaultAccount.id
 *
 *
 * Charity Setup (one-time platform setup):
 *
 * 1. For each charity in the pool, create a Counterparty
 *    POST /counterparties
 *    { routing_number, account_number, account_type, ... }
 *
 * 2. Store counterparty IDs in charities config
 */
```

---

## Charity Pool

```typescript
// lib/charities.ts

export interface Charity {
  id: string;
  name: string;
  category: string;
  icon: string;           // Emoji for gacha display
  description: string;
  ein?: string;           // For tax receipts
  counterpartyId?: string; // Column counterparty ID (for real implementation)
}

export const CHARITY_POOL: Charity[] = [
  {
    id: 'local-animal-shelter',
    name: 'Local Animal Shelter',
    category: 'Animals',
    icon: '🐕',
    description: 'Helping pets find forever homes',
  },
  {
    id: 'food-bank',
    name: 'Community Food Bank',
    category: 'Hunger',
    icon: '🍽️',
    description: 'Fighting hunger in your community',
  },
  {
    id: 'literacy-foundation',
    name: 'Literacy Foundation',
    category: 'Education',
    icon: '📚',
    description: 'Teaching kids to read',
  },
  {
    id: 'environmental-trust',
    name: 'Environmental Land Trust',
    category: 'Environment',
    icon: '🌳',
    description: 'Protecting natural spaces',
  },
  {
    id: 'childrens-hospital',
    name: "Children's Hospital",
    category: 'Health',
    icon: '🏥',
    description: 'Caring for sick children',
  },
  {
    id: 'housing-nonprofit',
    name: 'Habitat for Housing',
    category: 'Housing',
    icon: '🏠',
    description: 'Building homes for families',
  },
  {
    id: 'youth-mentorship',
    name: 'Youth Mentorship Program',
    category: 'Children',
    icon: '👶',
    description: 'Guiding the next generation',
  },
  {
    id: 'arts-education',
    name: 'Arts in Schools',
    category: 'Arts',
    icon: '🎨',
    description: 'Bringing creativity to classrooms',
  },
  {
    id: 'veterans-support',
    name: 'Veterans Support Network',
    category: 'Veterans',
    icon: '🎖️',
    description: 'Supporting those who served',
  },
  {
    id: 'mental-health',
    name: 'Mental Health Alliance',
    category: 'Health',
    icon: '🧠',
    description: 'Breaking the stigma, providing care',
  },
];

export function getRandomCharity(): Charity {
  const index = Math.floor(Math.random() * CHARITY_POOL.length);
  return CHARITY_POOL[index];
}

export function getCharityById(id: string): Charity | undefined {
  return CHARITY_POOL.find(c => c.id === id);
}
```

---

## Key Components

### Slot Machine Win Animation

```typescript
// components/animations/SlotMachine.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from './Confetti';

interface SlotMachineProps {
  amount: number;
  onComplete: () => void;
}

const SYMBOLS = ['💰', '💵', '🤑', '💎', '⭐'];

export function SlotMachine({ amount, onComplete }: SlotMachineProps) {
  const [phase, setPhase] = useState<'spinning' | 'winner' | 'complete'>('spinning');
  const [reels, setReels] = useState(['💰', '💰', '💰']);

  useEffect(() => {
    // Spin for 2 seconds
    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 100);

    // Stop on winner
    setTimeout(() => {
      clearInterval(spinInterval);
      setReels(['💰', '💰', '💰']);
      setPhase('winner');

      // Play sound
      const audio = new Audio('/sounds/cha-ching.mp3');
      audio.play().catch(() => {});
    }, 2000);

    // Complete after celebration
    setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 4000);

    return () => clearInterval(spinInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {phase === 'winner' && <Confetti />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-8 rounded-2xl shadow-2xl"
      >
        {/* Slot reels */}
        <div className="flex gap-4 mb-6">
          {reels.map((symbol, i) => (
            <motion.div
              key={i}
              animate={phase === 'spinning' ? { y: [0, -10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl shadow-inner"
            >
              {symbol}
            </motion.div>
          ))}
        </div>

        {/* Result */}
        <AnimatePresence>
          {phase === 'winner' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-white mb-2">WINNER!</div>
              <div className="text-4xl font-bold text-white">
                PAYOUT: ${(amount / 100).toFixed(2)}
              </div>
              <div className="text-lg text-yellow-100 mt-2">
                You bet on yourself. You won.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

### Charity Gacha Spinner

```typescript
// components/animations/CharityGacha.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CHARITY_POOL, Charity } from '@/lib/charities';

interface CharityGachaProps {
  onSelect: (charity: Charity) => void;
  donationAmount: number;
}

export function CharityGacha({ onSelect, donationAmount }: CharityGachaProps) {
  const [phase, setPhase] = useState<'intro' | 'spinning' | 'stopped' | 'revealed'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);

  const startSpin = useCallback(() => {
    setPhase('spinning');

    // Play spin sound
    const audio = new Audio('/sounds/slot-spin.mp3');
    audio.loop = true;
    audio.play().catch(() => {});

    // Rapid cycling through charities
    const spinInterval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % CHARITY_POOL.length);
    }, 80);

    // Store interval for cleanup
    return () => {
      clearInterval(spinInterval);
      audio.pause();
    };
  }, []);

  const stopSpin = useCallback(() => {
    setPhase('stopped');

    // Play stop sound
    const audio = new Audio('/sounds/slot-stop.mp3');
    audio.play().catch(() => {});

    // Land on random charity
    const finalIndex = Math.floor(Math.random() * CHARITY_POOL.length);
    setCurrentIndex(finalIndex);
    setSelectedCharity(CHARITY_POOL[finalIndex]);

    // Reveal after pause
    setTimeout(() => setPhase('revealed'), 500);
  }, []);

  const confirmDonation = useCallback(() => {
    if (selectedCharity) {
      onSelect(selectedCharity);
    }
  }, [selectedCharity, onSelect]);

  const currentCharity = CHARITY_POOL[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">

        {/* Intro phase */}
        {phase === 'intro' && (
          <div className="text-center">
            <div className="text-2xl mb-2">⏰</div>
            <h2 className="text-2xl font-bold text-white mb-4">TIME'S UP</h2>
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
              <div className="text-red-400 text-sm">PAYOUT</div>
              <div className="text-3xl font-bold text-red-500">$0.00</div>
            </div>
            <p className="text-gray-400 mb-6">
              Your wager didn't pay out.<br />
              But it's not going to waste...
            </p>
            <button
              onClick={startSpin}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              See Where It Goes →
            </button>
          </div>
        )}

        {/* Spinning phase */}
        {(phase === 'spinning' || phase === 'stopped') && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-6">🎰 CHARITY ROULETTE 🎰</h2>

            <motion.div
              animate={phase === 'spinning' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.2 }}
              className="bg-gray-800 rounded-xl p-6 mb-6"
            >
              <div className="text-6xl mb-4">{currentCharity.icon}</div>
              <div className="text-xl font-bold text-white">{currentCharity.name}</div>
              <div className="text-gray-400">{currentCharity.category}</div>
            </motion.div>

            {phase === 'spinning' && (
              <button
                onClick={stopSpin}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition animate-pulse"
              >
                STOP THE SPIN
              </button>
            )}
          </div>
        )}

        {/* Revealed phase */}
        {phase === 'revealed' && selectedCharity && (
          <div className="text-center">
            <div className="text-lg text-purple-400 mb-2">🎊 LANDED ON 🎊</div>

            <div className="bg-gradient-to-b from-purple-900/50 to-purple-800/30 border border-purple-500 rounded-xl p-6 mb-6">
              <div className="text-6xl mb-4">{selectedCharity.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{selectedCharity.name}</div>
              <div className="text-purple-300">{selectedCharity.description}</div>
            </div>

            <div className="text-gray-300 mb-6">
              <span className="text-green-400 font-bold">${(donationAmount / 100).toFixed(2)}</span>
              {' '}is going to help {selectedCharity.category.toLowerCase()}.
            </div>

            <button
              onClick={confirmDonation}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Confirm Donation ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Bet Card

```typescript
// components/bet/BetCard.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bet } from '@prisma/client';
import { BetCountdown } from './BetCountdown';
import { SlotMachine } from '../animations/SlotMachine';
import { CharityGacha } from '../animations/CharityGacha';
import { formatCurrency } from '@/lib/utils/currency';

interface BetCardProps {
  bet: Bet;
  onWin: (betId: string) => Promise<void>;
  onLoss: (betId: string, charityId: string) => Promise<void>;
}

export function BetCard({ bet, onWin, onLoss }: BetCardProps) {
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLossAnimation, setShowLossAnimation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isExpired = new Date(bet.deadline) < new Date();
  const isActive = bet.status === 'ACTIVE';

  const handleClaimWin = async () => {
    setShowWinAnimation(true);
  };

  const handleWinComplete = async () => {
    setIsProcessing(true);
    await onWin(bet.id);
    setShowWinAnimation(false);
    setIsProcessing(false);
  };

  const handleGiveUp = () => {
    setShowLossAnimation(true);
  };

  const handleCharitySelected = async (charity: { id: string }) => {
    setIsProcessing(true);
    await onLoss(bet.id, charity.id);
    setShowLossAnimation(false);
    setIsProcessing(false);
  };

  return (
    <>
      {showWinAnimation && (
        <SlotMachine amount={bet.stakeCents} onComplete={handleWinComplete} />
      )}

      {showLossAnimation && (
        <CharityGacha
          donationAmount={bet.stakeCents - 50} // Minus platform fee
          onSelect={handleCharitySelected}
        />
      )}

      <motion.div
        layout
        className={`bg-gray-800 rounded-xl p-6 border ${
          bet.status === 'WON' ? 'border-green-500' :
          bet.status === 'LOST' ? 'border-red-500' :
          'border-gray-700'
        }`}
      >
        {/* Goal */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">
              {bet.status === 'WON' ? '✅ WON' :
               bet.status === 'LOST' ? '❌ LOST' : '🎯 ACTIVE BET'}
            </div>
            <h3 className="text-xl font-bold text-white">{bet.goal}</h3>
          </div>
          {bet.spotterEmail && (
            <div className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
              👀 {bet.spotterName || 'Spotter'}
            </div>
          )}
        </div>

        {/* Countdown or result */}
        {isActive && (
          <div className="mb-4">
            <BetCountdown deadline={new Date(bet.deadline)} />
          </div>
        )}

        {/* Stakes */}
        <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 mb-4">
          <div>
            <div className="text-xs text-gray-500">WAGER</div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(bet.stakeCents)}
            </div>
          </div>
          <div className="text-2xl text-gray-600">→</div>
          <div className="text-right">
            <div className="text-xs text-gray-500">PAYOUT</div>
            <div className={`text-lg font-bold ${
              bet.status === 'WON' ? 'text-green-400' :
              bet.status === 'LOST' ? 'text-red-400' :
              'text-green-400'
            }`}>
              {bet.status === 'LOST' ? '$0.00' : formatCurrency(bet.stakeCents)}
            </div>
          </div>
        </div>

        {/* Charity info if lost */}
        {bet.status === 'LOST' && bet.charityName && (
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3 mb-4 text-sm">
            <span className="text-purple-400">
              {formatCurrency(bet.donationCents || 0)} donated to {bet.charityName}
            </span>
          </div>
        )}

        {/* Actions */}
        {isActive && (
          <div className="flex gap-3">
            <button
              onClick={handleClaimWin}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
            >
              Claim Win ✓
            </button>
            <button
              onClick={handleGiveUp}
              disabled={isProcessing}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-gray-300 font-bold py-3 rounded-lg transition"
            >
              Give Up
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
```

---

## API Routes

### Place New Bet

```typescript
// app/api/bets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getBankingProvider } from '@/lib/banking';
import { authOptions } from '@/lib/auth';
import { sendSpotterNotification } from '@/lib/email';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ bets });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { goal, stakeCents, deadline, spotterEmail, spotterName } = body;

  // Validation
  if (!goal || !stakeCents || !deadline) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (stakeCents < 500) { // Minimum $5 bet
    return NextResponse.json({ error: 'Minimum bet is $5' }, { status: 400 });
  }

  // Check balance
  const banking = getBankingProvider();
  const balance = await banking.getBalance(session.user.id);

  if (balance.available < stakeCents) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  // Stake the bet (move money to vault)
  const bet = await prisma.bet.create({
    data: {
      userId: session.user.id,
      goal,
      stakeCents,
      deadline: new Date(deadline),
      spotterEmail,
      spotterName,
    },
  });

  const { transferId } = await banking.stakeBet(session.user.id, stakeCents, bet.id);

  // Update with transfer ID
  await prisma.bet.update({
    where: { id: bet.id },
    data: { stakeTransferId: transferId },
  });

  // Notify spotter if provided
  if (spotterEmail) {
    await sendSpotterNotification({
      type: 'BET_PLACED',
      spotterEmail,
      spotterName,
      userName: session.user.name || 'Someone',
      goal,
      stakeCents,
      deadline: new Date(deadline),
    });

    await prisma.betNotification.create({
      data: {
        betId: bet.id,
        type: 'BET_PLACED',
        recipient: 'spotter',
      },
    });
  }

  return NextResponse.json({ bet });
}
```

### Claim Win

```typescript
// app/api/bets/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getBankingProvider } from '@/lib/banking';
import { authOptions } from '@/lib/auth';
import { sendSpotterNotification } from '@/lib/email';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bet = await prisma.bet.findUnique({
    where: { id: params.id },
  });

  if (!bet || bet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
  }

  if (bet.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Bet is not active' }, { status: 400 });
  }

  // Release the funds back to user
  const banking = getBankingProvider();
  const { transferId } = await banking.releaseBet(session.user.id, bet.stakeCents, bet.id);

  // Update bet status
  const updatedBet = await prisma.bet.update({
    where: { id: bet.id },
    data: {
      status: 'WON',
      completedAt: new Date(),
      returnTransferId: transferId,
    },
  });

  // Notify spotter
  if (bet.spotterEmail) {
    await sendSpotterNotification({
      type: 'WIN',
      spotterEmail: bet.spotterEmail,
      spotterName: bet.spotterName,
      userName: session.user.name || 'Someone',
      goal: bet.goal,
      stakeCents: bet.stakeCents,
    });
  }

  return NextResponse.json({ bet: updatedBet });
}
```

### Process Loss

```typescript
// app/api/bets/[id]/lose/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getBankingProvider } from '@/lib/banking';
import { authOptions } from '@/lib/auth';
import { getCharityById } from '@/lib/charities';
import { sendSpotterNotification } from '@/lib/email';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { charityId } = body;

  const bet = await prisma.bet.findUnique({
    where: { id: params.id },
  });

  if (!bet || bet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
  }

  if (bet.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Bet is not active' }, { status: 400 });
  }

  const charity = getCharityById(charityId);
  if (!charity) {
    return NextResponse.json({ error: 'Invalid charity' }, { status: 400 });
  }

  // Forfeit the funds to charity
  const banking = getBankingProvider();
  const { donationTransferId, donationCents, platformFeeCents } = await banking.forfeitBet(
    session.user.id,
    bet.stakeCents,
    bet.id,
    charityId
  );

  // Update bet status
  const updatedBet = await prisma.bet.update({
    where: { id: bet.id },
    data: {
      status: 'LOST',
      failedAt: new Date(),
      charityId: charity.id,
      charityName: charity.name,
      donationCents,
      platformFeeCents,
      donationTransferId,
    },
  });

  // Notify spotter
  if (bet.spotterEmail) {
    await sendSpotterNotification({
      type: 'LOSS',
      spotterEmail: bet.spotterEmail,
      spotterName: bet.spotterName,
      userName: session.user.name || 'Someone',
      goal: bet.goal,
      charityName: charity.name,
      donationCents,
    });
  }

  return NextResponse.json({ bet: updatedBet });
}
```

---

## Email Templates

```typescript
// lib/email/templates/bet-placed.tsx

import { formatCurrency } from '@/lib/utils/currency';

interface BetPlacedEmailProps {
  spotterName?: string;
  userName: string;
  goal: string;
  stakeCents: number;
  deadline: Date;
}

export function BetPlacedEmail({
  spotterName,
  userName,
  goal,
  stakeCents,
  deadline,
}: BetPlacedEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h1 style="color: #10b981;">🎰 ${userName} just bet on themselves</h1>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Goal:</strong> ${goal}</p>
        <p style="margin: 0 0 10px 0;"><strong>Amount at stake:</strong> ${formatCurrency(stakeCents)}</p>
        <p style="margin: 0;"><strong>Deadline:</strong> ${deadline.toLocaleDateString()}</p>
      </div>

      <p>They added you as their spotter. No pressure, but a little encouragement goes a long way!</p>

      <p style="color: #6b7280; font-size: 14px;">
        Reply to this email and we'll forward your message to ${userName}.
      </p>
    </div>
  `;
}
```

---

## Environment Variables

```bash
# .env.example

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

## Demo Mode Features

When `DEMO_MODE=true`:

1. **New users get $100 starting balance** — No need to "fund" account
2. **Add funds is instant** — No ACH simulation delay
3. **All banking is stubbed** — No real money moves
4. **Charities are simulated** — No actual donations
5. **Emails can be previewed** — Console log instead of send (optional)

This lets you demo the full experience without any financial integration.

---

## Commands to Get Started

```bash
# Create project
npx create-next-app@latest fundmelater --typescript --tailwind --app --src-dir

# Install dependencies
cd fundmelater
npm install prisma @prisma/client next-auth framer-motion resend

# Set up Prisma
npx prisma init
# Copy schema from this doc to prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate

# Run development server
npm run dev
```
