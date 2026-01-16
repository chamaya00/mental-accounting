'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBet(formData: FormData) {
  const supabase = await createClient()

  const habitDescription = formData.get('habit_description') as string
  const category = formData.get('category') as string
  const stakeAmount = parseInt(formData.get('stake_amount') as string)
  const durationWeeks = parseInt(formData.get('duration_weeks') as string)
  const buddyEmail = formData.get('buddy_email') as string | null
  const buddyRelationship = formData.get('buddy_relationship') as string | null

  // Use type assertion to bypass strict type checking for RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_bet', {
    p_habit_description: habitDescription,
    p_category: category,
    p_stake_amount: stakeAmount,
    p_duration_weeks: durationWeeks,
    p_buddy_email: buddyEmail || null,
    p_buddy_relationship: buddyRelationship || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/bets')

  return { betId: data }
}

export async function checkinBet(betId: string) {
  const supabase = await createClient()

  // Use type assertion to bypass strict type checking for RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('checkin_week', {
    p_bet_id: betId,
    p_notify_buddy: false,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/bets')
  revalidatePath(`/bets/${betId}`)

  return { success: data }
}
