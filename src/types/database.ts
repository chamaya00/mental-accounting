export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      avatars: {
        Row: {
          id: number
          emoji: string
          name: string
          category: 'starter' | 'motivator' | 'legend' | 'premium'
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
          category: 'starter' | 'motivator' | 'legend' | 'premium'
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
          category?: 'starter' | 'motivator' | 'legend' | 'premium'
          price?: number
          personality_voice?: string | null
          is_premium?: boolean
          encouragement_messages?: string[] | null
          created_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          habit_description: string
          category: 'health' | 'learning' | 'creative' | 'social' | 'financial' | 'other' | null
          stake_amount: number
          duration_weeks: number
          current_week: number
          status: 'active' | 'won' | 'lost'
          buddy_email: string | null
          buddy_relationship: 'friend' | 'family' | 'coworker' | 'coach' | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_description: string
          category?: 'health' | 'learning' | 'creative' | 'social' | 'financial' | 'other' | null
          stake_amount: number
          duration_weeks: number
          current_week?: number
          status?: 'active' | 'won' | 'lost'
          buddy_email?: string | null
          buddy_relationship?: 'friend' | 'family' | 'coworker' | 'coach' | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_description?: string
          category?: 'health' | 'learning' | 'creative' | 'social' | 'financial' | 'other' | null
          stake_amount?: number
          duration_weeks?: number
          current_week?: number
          status?: 'active' | 'won' | 'lost'
          buddy_email?: string | null
          buddy_relationship?: 'friend' | 'family' | 'coworker' | 'coach' | null
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
      collectibles: {
        Row: {
          id: number
          emoji: string
          name: string
          tier: 'accessory' | 'vehicle' | 'property'
          price: number
          created_at: string
        }
        Insert: {
          id?: number
          emoji: string
          name: string
          tier: 'accessory' | 'vehicle' | 'property'
          price: number
          created_at?: string
        }
        Update: {
          id?: number
          emoji?: string
          name?: string
          tier?: 'accessory' | 'vehicle' | 'property'
          price?: number
          created_at?: string
        }
      }
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
          event_type: 'signup' | 'bet_created' | 'bet_won' | 'bet_lost' | 'milestone'
          user_id: string | null
          bet_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'signup' | 'bet_created' | 'bet_won' | 'bet_lost' | 'milestone'
          user_id?: string | null
          bet_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: 'signup' | 'bet_created' | 'bet_won' | 'bet_lost' | 'milestone'
          user_id?: string | null
          bet_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Functions: {
      checkin_week: {
        Args: {
          p_bet_id: string
          p_notify_buddy?: boolean
        }
        Returns: boolean
      }
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
      resolve_bet_loss: {
        Args: {
          p_bet_id: string
        }
        Returns: undefined
      }
      resolve_bet_win: {
        Args: {
          p_bet_id: string
        }
        Returns: undefined
      }
      set_active_avatar: {
        Args: {
          p_avatar_id: number
        }
        Returns: boolean
      }
      support_bet: {
        Args: {
          p_bet_id: string
          p_stake_amount: number
        }
        Returns: string
      }
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Bet = Tables<'bets'>
export type Checkin = Tables<'checkins'>
export type Support = Tables<'supports'>
export type Avatar = Tables<'avatars'>
export type Collectible = Tables<'collectibles'>
export type WallEvent = Tables<'wall_events'>
