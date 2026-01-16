import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { CheckinButton } from './CheckinButton'
import Link from 'next/link'
import type { Profile, Avatar, Bet, Checkin } from '@/types/database'

interface BetPageProps {
  params: Promise<{ id: string }>
}

export default async function BetPage({ params }: BetPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch profile with active avatar
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as Profile | null

  // Fetch active avatar details
  let avatar: Avatar | null = null
  if (profile && profile.active_avatar_id) {
    const { data: avatarData } = await supabase
      .from('avatars')
      .select('*')
      .eq('id', profile.active_avatar_id)
      .single()
    avatar = avatarData as Avatar | null
  }

  // Fetch bet
  const { data: betData } = await supabase
    .from('bets')
    .select('*')
    .eq('id', id)
    .single()
  const bet = betData as Bet | null

  if (!bet) {
    notFound()
  }

  // Check if this is the user's bet
  const isOwner = bet.user_id === user.id

  // Fetch checkins
  const { data: checkinsData } = await supabase
    .from('checkins')
    .select('*')
    .eq('bet_id', id)
    .order('week_number', { ascending: true })
  const checkins = checkinsData as Checkin[] | null

  // Get current week's checkin
  const currentCheckin = checkins?.find(c => c.week_number === bet.current_week)
  const canCheckin = bet.status === 'active' && isOwner && !currentCheckin?.completed

  // Get encouragement message
  const encouragementMessage = avatar?.encouragement_messages
    ? avatar.encouragement_messages[Math.floor(Math.random() * avatar.encouragement_messages.length)]
    : 'Keep going!'

  const potentialPayout = bet.stake_amount * bet.duration_weeks
  const weeksRemaining = bet.duration_weeks - bet.current_week + 1

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/bets"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Bets
        </Link>

        {/* Bet Status Banner */}
        {bet.status === 'won' && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-bold text-green-700">Bet Won!</h2>
            <p className="text-green-600">You earned {potentialPayout} GC!</p>
          </div>
        )}

        {bet.status === 'lost' && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-2">💔</div>
            <h2 className="text-xl font-bold text-red-700">Bet Lost</h2>
            <p className="text-red-600">You lost {bet.stake_amount} GC. Keep trying!</p>
          </div>
        )}

        {/* Main Bet Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                  bet.status === 'active' ? 'bg-amber-100 text-amber-700' :
                  bet.status === 'won' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                </span>
                <h1 className="text-xl font-bold text-gray-900 mb-1">{bet.habit_description}</h1>
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                  {bet.category}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>Week {bet.current_week} of {bet.duration_weeks}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${
                  bet.status === 'won' ? 'bg-green-500' :
                  bet.status === 'lost' ? 'bg-red-400' :
                  'bg-amber-500'
                }`}
                style={{ width: `${(Math.max(0, bet.current_week - 1) / bet.duration_weeks) * 100}%` }}
              />
            </div>

            {/* Week Indicators */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: bet.duration_weeks }, (_, i) => {
                const weekNum = i + 1
                const checkin = checkins?.find(c => c.week_number === weekNum)
                const isCurrentWeek = weekNum === bet.current_week && bet.status === 'active'
                const isCompleted = checkin?.completed
                const isFailed = bet.status === 'lost' && weekNum >= bet.current_week

                return (
                  <div
                    key={weekNum}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : isCurrentWeek
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
                        : isFailed
                        ? 'bg-red-100 text-red-500 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isCompleted ? '✓' : weekNum}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500">Staked</div>
              <div className="text-lg font-bold text-amber-600">{bet.stake_amount} GC</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500">Payout</div>
              <div className="text-lg font-bold text-green-600">{potentialPayout} GC</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500">{bet.status === 'active' ? 'Weeks Left' : 'Duration'}</div>
              <div className="text-lg font-bold text-gray-700">
                {bet.status === 'active' ? weeksRemaining : bet.duration_weeks}
              </div>
            </div>
          </div>

          {/* Check-in Section */}
          {bet.status === 'active' && isOwner && (
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100">
              {canCheckin ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">{avatar?.emoji ?? '🎯'}</div>
                  <p className="text-gray-700 mb-1 italic">&ldquo;{encouragementMessage}&rdquo;</p>
                  <p className="text-gray-600 mb-4">
                    Did you complete <strong>{bet.habit_description}</strong> this week?
                  </p>
                  <CheckinButton betId={bet.id} />
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-700 font-semibold mb-1">Week {bet.current_week - 1} Complete!</p>
                  <p className="text-gray-600">
                    {weeksRemaining > 0
                      ? `Come back next week to check in for Week ${bet.current_week}.`
                      : 'Waiting for final resolution...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buddy Info */}
        {bet.buddy_email && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Accountability Buddy</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                👤
              </div>
              <div>
                <div className="text-gray-900">{bet.buddy_email}</div>
                <div className="text-sm text-gray-500 capitalize">{bet.buddy_relationship}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
