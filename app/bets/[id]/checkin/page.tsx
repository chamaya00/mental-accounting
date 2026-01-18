'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [bet, setBet] = useState<{
    id: string
    habit_description: string
    current_week: number
    duration_weeks: number
    stake_amount: number
    buddy_email: string | null
  } | null>(null)
  const [avatar, setAvatar] = useState<{
    emoji: string
    name: string
    encouragement_messages: string[] | null
  } | null>(null)
  const [notifyBuddy, setNotifyBuddy] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: betData } = await supabase
        .from('bets')
        .select('*')
        .eq('id', id)
        .single() as { data: {
          id: string
          habit_description: string
          current_week: number
          duration_weeks: number
          stake_amount: number
          buddy_email: string | null
        } | null }

      if (betData) {
        setBet(betData)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_avatar_id')
        .eq('id', user.id)
        .single() as { data: { active_avatar_id: number | null } | null }

      if (profile?.active_avatar_id) {
        const { data: avatarData } = await supabase
          .from('avatars')
          .select('emoji, name, encouragement_messages')
          .eq('id', profile.active_avatar_id)
          .single() as { data: { emoji: string; name: string; encouragement_messages: string[] | null } | null }

        if (avatarData) {
          setAvatar(avatarData)
        }
      }
    }

    fetchData()
  }, [id])

  const handleCheckin = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase.rpc as any)('checkin_week', {
        p_bet_id: id,
        p_notify_buddy: notifyBuddy && !!bet?.buddy_email,
      })

      if (rpcError) {
        throw rpcError
      }

      // Send buddy email notification if enabled
      if (notifyBuddy && bet?.buddy_email && user) {
        try {
          await fetch('/api/email/buddy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              betId: id,
              userId: user.id,
            }),
          })
        } catch (emailError) {
          // Don't fail the check-in if email fails
          console.error('Failed to send buddy notification:', emailError)
        }
      }

      setSuccess(true)

      // Redirect after a moment
      setTimeout(() => {
        router.push(`/bets/${id}`)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!bet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  const encouragement = avatar?.encouragement_messages
    ? avatar.encouragement_messages[Math.floor(Math.random() * avatar.encouragement_messages.length)]
    : "You're doing great!"

  const isFinalWeek = bet.current_week >= bet.duration_weeks

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {isFinalWeek ? '🏆' : '🎉'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isFinalWeek ? 'Congratulations!' : 'Week Complete!'}
          </h1>
          <p className="text-gray-600 mb-4">
            {isFinalWeek
              ? `You won ${bet.stake_amount * bet.duration_weeks} GC!`
              : `Week ${bet.current_week} of ${bet.duration_weeks} done!`}
          </p>
          {avatar && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{avatar.emoji}</span>
                <div className="text-left">
                  <p className="text-purple-800 italic">"{encouragement}"</p>
                  <p className="text-sm text-purple-600">— {avatar.name}</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/bets/${id}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Weekly Check-in</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span>🗓️</span>
              <span>Week {bet.current_week} of {bet.duration_weeks}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {bet.habit_description}
            </h2>
            <p className="text-gray-600">
              Did you complete your habit this week?
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {avatar && (
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{avatar.emoji}</span>
                <div>
                  <p className="text-purple-800 italic">"{encouragement}"</p>
                  <p className="text-sm text-purple-600">— {avatar.name}</p>
                </div>
              </div>
            </div>
          )}

          {bet.buddy_email && (
            <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyBuddy}
                onChange={(e) => setNotifyBuddy(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-blue-800">Notify your buddy</p>
                <p className="text-sm text-blue-600">{bet.buddy_email}</p>
              </div>
            </label>
          )}

          {isFinalWeek && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-medium text-green-800">This is your final week!</p>
                  <p className="text-sm text-green-600">
                    Complete this check-in to win {bet.stake_amount * bet.duration_weeks} GC
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckin}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Checking in...' : 'Yes, I did it!'}
          </button>
        </div>
      </main>
    </div>
  )
}
