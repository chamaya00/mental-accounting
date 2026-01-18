'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Bet, Profile, Avatar, Support } from '@/types/database'

type BetWithProfile = Bet & {
  profiles: (Profile & { avatars: Avatar | null }) | null
}

export default function SupportBetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: betId } = use(params)
  const router = useRouter()
  const [bet, setBet] = useState<BetWithProfile | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [existingSupport, setExistingSupport] = useState<Support | null>(null)
  const [stakeAmount, setStakeAmount] = useState(50)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      if (profileData?.active_avatar_id) {
        const { data: avatarData } = await supabase
          .from('avatars')
          .select('*')
          .eq('id', profileData.active_avatar_id)
          .single()
        setAvatar(avatarData)
      }

      // Fetch bet with owner profile
      const { data: betData } = await supabase
        .from('bets')
        .select('*, profiles(*, avatars(*))')
        .eq('id', betId)
        .single()

      if (betData) {
        setBet(betData as BetWithProfile)

        // Check if user already supports this bet
        const { data: supportData } = await supabase
          .from('supports')
          .select('*')
          .eq('bet_id', betId)
          .eq('supporter_id', user.id)
          .single()

        if (supportData) {
          setExistingSupport(supportData)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [betId, router])

  const handleSupport = async () => {
    if (!profile || !bet) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: supportError } = await supabase.rpc('support_bet', {
        p_bet_id: betId,
        p_stake_amount: stakeAmount,
      })

      if (supportError) {
        throw supportError
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to support bet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSupport = () => {
    if (!bet || !profile) return false
    if (bet.user_id === profile.id) return false
    if (bet.status !== 'active') return false
    if (existingSupport) return false
    if (profile.balance < stakeAmount) return false

    // Check if less than 2 weeks old
    const betDate = new Date(bet.created_at)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return betDate > twoWeeksAgo
  }

  const getReason = () => {
    if (!bet || !profile) return null
    if (bet.user_id === profile.id) return "You can't support your own bet"
    if (bet.status !== 'active') return 'This bet is no longer active'
    if (existingSupport) return "You're already supporting this bet"

    const betDate = new Date(bet.created_at)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    if (betDate <= twoWeeksAgo) return 'This bet is older than 2 weeks and can no longer be supported'

    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🤝</div>
          <p className="text-gray-600">Loading bet...</p>
        </div>
      </div>
    )
  }

  if (!bet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-900 font-semibold mb-2">Bet not found</p>
          <Link href="/wall" className="text-amber-600 hover:text-amber-700">
            Return to Wall
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    const potentialWin = stakeAmount * bet.duration_weeks

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Supporting!
          </h1>
          <p className="text-gray-600 mb-6">
            You've staked {stakeAmount} GC on {bet.profiles?.display_name ?? 'this user'}'s bet
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">If they succeed:</p>
            <p className="text-2xl font-bold text-green-600">+{potentialWin} GC</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/wall"
              className="block w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Back to Wall
            </Link>
            <Link
              href={`/bets/${betId}`}
              className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all"
            >
              View Bet Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const betOwner = bet.profiles
  const betOwnerAvatar = betOwner?.avatars
  const reason = getReason()
  const potentialWin = stakeAmount * bet.duration_weeks

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/wall" className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-gray-900">Bet On Yourself</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
                <span className="text-xl">🪙</span>
                <span className="font-bold text-amber-700">
                  {profile?.balance?.toLocaleString() ?? 0} GC
                </span>
              </div>

              <Link href="/dashboard" className="text-3xl" title={avatar?.name ?? 'Dashboard'}>
                {avatar?.emoji ?? '👤'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/wall"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <span>←</span>
          <span>Back to Wall</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{betOwnerAvatar?.emoji ?? '👤'}</div>
              <div>
                <h1 className="text-2xl font-bold">Support {betOwner?.display_name ?? 'Someone'}</h1>
                <p className="text-blue-100">Bet on their success and win together!</p>
              </div>
            </div>
          </div>

          {/* Bet Details */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">The Commitment</h2>
              <p className="text-gray-700 text-lg mb-3">{bet.habit_description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-200 rounded capitalize">{bet.category}</span>
                <span className="flex items-center gap-1">
                  <span>🪙</span>
                  <span>{bet.stake_amount} GC stake</span>
                </span>
                <span>•</span>
                <span>{bet.duration_weeks} weeks</span>
                <span>•</span>
                <span>Week {bet.current_week} of {bet.duration_weeks}</span>
              </div>
            </div>

            {reason ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-yellow-800">{reason}</p>
                </div>
                {existingSupport && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      Your stake: {existingSupport.stake_amount} GC
                      {' • '}
                      Potential win: {existingSupport.stake_amount * bet.duration_weeks} GC
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Stake Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Support Stake
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={10}
                      max={Math.min(500, profile?.balance ?? 0)}
                      step={10}
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-lg min-w-[100px] justify-center">
                      <span className="text-xl">🪙</span>
                      <span className="font-bold text-blue-700">{stakeAmount}</span>
                    </div>
                  </div>
                  {profile && profile.balance < stakeAmount && (
                    <p className="text-red-500 text-sm mt-2">
                      Insufficient balance. You have {profile.balance} GC.
                    </p>
                  )}
                </div>

                {/* Payout Preview */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">If they complete all {bet.duration_weeks} weeks:</p>
                      <p className="text-2xl font-bold text-green-600">+{potentialWin} GC</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Multiplier</p>
                      <p className="text-xl font-bold text-gray-900">{bet.duration_weeks}x</p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💸</span>
                    <div>
                      <p className="font-medium text-red-800">Risk Warning</p>
                      <p className="text-sm text-red-600">
                        If they miss a check-in, you'll lose your {stakeAmount} GC stake.
                        Only support bets you believe in!
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Link
                    href="/wall"
                    className="flex-1 text-center bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleSupport}
                    disabled={!canSupport() || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Supporting...' : `Support with ${stakeAmount} GC`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
