export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BetCategory = 'health' | 'learning' | 'creative' | 'social' | 'financial' | 'other'
export type BetStatus = 'active' | 'won' | 'lost'
export type BuddyRelationship = 'friend' | 'family' | 'coworker' | 'coach'
export type AvatarCategory = 'starter' | 'motivator' | 'legend' | 'premium'
export type CollectibleTier = 'accessory' | 'vehicle' | 'property'
export type WallEventType = 'signup' | 'bet_created' | 'bet_won' | 'bet_lost' | 'milestone'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          balance: number
          active_avatar_id: number | null
          timezone: string
          last_login_bonus_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          balance?: number
          active_avatar_id?: number | null
          timezone?: string
          last_login_bonus_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          balance?: number
          active_avatar_id?: number | null
          timezone?: string
          last_login_bonus_at?: string | null
          created_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          habit_description: string
          category: BetCategory | null
          stake_amount: number
          duration_weeks: number
          current_week: number
          status: BetStatus
          buddy_email: string | null
          buddy_relationship: BuddyRelationship | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_description: string
          category?: BetCategory | null
          stake_amount: number
          duration_weeks: number
          current_week?: number
          status?: BetStatus
          buddy_email?: string | null
          buddy_relationship?: BuddyRelationship | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_description?: string
          category?: BetCategory | null
          stake_amount?: number
          duration_weeks?: number
          current_week?: number
          status?: BetStatus
          buddy_email?: string | null
          buddy_relationship?: BuddyRelationship | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      checkins: {
        Row: {
          id: string
          bet_id: string
          week_number: number
          completed: boolean
          checked_in_at: string | null
          buddy_notified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          week_number: number
          completed?: boolean
          checked_in_at?: string | null
          buddy_notified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          week_number?: number
          completed?: boolean
          checked_in_at?: string | null
          buddy_notified?: boolean
          created_at?: string
        }
      }
      supports: {
        Row: {
          id: string
          bet_id: string
          supporter_id: string
          stake_amount: number
          payout_amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          supporter_id: string
          stake_amount: number
          payout_amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          supporter_id?: string
          stake_amount?: number
          payout_amount?: number | null
          created_at?: string
        }
      }
      avatars: {
        Row: {
          id: number
          emoji: string
          name: string
          category: AvatarCategory
          price: number
          personality_voice: string | null
          is_premium: boolean
          encouragement_messages: string[] | null
          created_at: string
        }
        Insert: {
          id?: number
          emoji: string
          name: string
          category: AvatarCategory
          price?: number
          personality_voice?: string | null
          is_premium?: boolean
          encouragement_messages?: string[] | null
          created_at?: string
        }
        Update: {
          id?: number
          emoji?: string
          name?: string
          category?: AvatarCategory
          price?: number
          personality_voice?: string | null
          is_premium?: boolean
          encouragement_messages?: string[] | null
          created_at?: string
        }
      }
      user_avatars: {
        Row: {
          user_id: string
          avatar_id: number
          acquired_at: string
        }
        Insert: {
          user_id: string
          avatar_id: number
          acquired_at?: string
        }
        Update: {
          user_id?: string
          avatar_id?: number
          acquired_at?: string
        }
      }
      collectibles: {
        Row: {
          id: number
          emoji: string
          name: string
          tier: CollectibleTier
          price: number
          created_at: string
        }
        Insert: {
          id?: number
          emoji: string
          name: string
          tier: CollectibleTier
          price: number
          created_at?: string
        }
        Update: {
          id?: number
          emoji?: string
          name?: string
          tier?: CollectibleTier
          price?: number
          created_at?: string
        }
      }
      user_collectibles: {
        Row: {
          user_id: string
          collectible_id: number
          acquired_at: string
        }
        Insert: {
          user_id: string
          collectible_id: number
          acquired_at?: string
        }
        Update: {
          user_id?: string
          collectible_id?: number
          acquired_at?: string
        }
      }
      wall_events: {
        Row: {
          id: string
          event_type: WallEventType
          user_id: string | null
          bet_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: WallEventType
          user_id?: string | null
          bet_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: WallEventType
          user_id?: string | null
          bet_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Functions: {
      claim_login_bonus: {
        Args: Record<string, never>
        Returns: number
      }
      create_bet: {
        Args: {
          p_habit_description: string
          p_category: string
          p_stake_amount: number
          p_duration_weeks: number
          p_buddy_email?: string | null
          p_buddy_relationship?: string | null
        }
        Returns: string
      }
      support_bet: {
        Args: {
          p_bet_id: string
          p_stake_amount: number
        }
        Returns: string
      }
      checkin_week: {
        Args: {
          p_bet_id: string
          p_notify_buddy?: boolean
        }
        Returns: boolean
      }
      resolve_bet_win: {
        Args: {
          p_bet_id: string
        }
        Returns: void
      }
      resolve_bet_loss: {
        Args: {
          p_bet_id: string
        }
        Returns: void
      }
      purchase_avatar: {
        Args: {
          p_avatar_id: number
        }
        Returns: boolean
      }
      purchase_collectible: {
        Args: {
          p_collectible_id: number
        }
        Returns: boolean
      }
      set_active_avatar: {
        Args: {
          p_avatar_id: number
        }
        Returns: boolean
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type Checkin = Database['public']['Tables']['checkins']['Row']
export type Support = Database['public']['Tables']['supports']['Row']
export type Avatar = Database['public']['Tables']['avatars']['Row']
export type UserAvatar = Database['public']['Tables']['user_avatars']['Row']
export type Collectible = Database['public']['Tables']['collectibles']['Row']
export type UserCollectible = Database['public']['Tables']['user_collectibles']['Row']
export type WallEvent = Database['public']['Tables']['wall_events']['Row']

export type BetWithCheckins = Bet & {
  checkins: Checkin[]
}

export type ProfileWithAvatar = Profile & {
  active_avatar: Avatar | null
}
