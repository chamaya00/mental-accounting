// Database enums
export type BetStatus = "ACTIVE" | "WON" | "LOST" | "CANCELLED";
export type NotificationType =
  | "BET_PLACED"
  | "REMINDER_7_DAYS"
  | "REMINDER_3_DAYS"
  | "REMINDER_1_DAY"
  | "REMINDER_6_HOURS"
  | "WIN"
  | "LOSS";

// User type
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  balanceCents: number;
  vaultCents: number;
  lifetimeEarnings: number;
  lifetimeDonations: number;
  columnEntityId: string | null;
  mainAccountId: string | null;
  vaultAccountId: string | null;
}

// Bet type
export interface Bet {
  id: string;
  userId: string;
  goal: string;
  stakeCents: number;
  deadline: Date;
  status: BetStatus;
  spotterEmail: string | null;
  spotterName: string | null;
  completedAt: Date | null;
  failedAt: Date | null;
  charityId: string | null;
  charityName: string | null;
  donationCents: number | null;
  platformFeeCents: number | null;
  stakeTransferId: string | null;
  returnTransferId: string | null;
  donationTransferId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// BetNotification type
export interface BetNotification {
  id: string;
  betId: string;
  type: NotificationType;
  sentAt: Date;
  recipient: string;
}

// Extended types for API responses
export interface UserWithBets extends User {
  bets: Bet[];
}

export interface BetWithUser extends Bet {
  user: User;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BalanceResponse {
  available: number;
  vault: number;
  lifetimeEarnings: number;
  lifetimeDonations: number;
}

// Form types
export interface CreateBetInput {
  goal: string;
  stakeCents: number;
  deadline: string;
  spotterEmail?: string;
  spotterName?: string;
}

// Charity types
export interface Charity {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

// Stats types
export interface UserStats {
  totalBets: number;
  activeBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalWagered: number;
  totalWon: number;
  totalDonated: number;
}

// Animation state types
export type SlotMachineState = "idle" | "spinning" | "stopping" | "complete";
export type GachaState = "intro" | "spinning" | "stopped" | "revealed" | "confirmed";

// Notification types
export type NotificationRecipient = "user" | "spotter";
