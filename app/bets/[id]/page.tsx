import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

type SupportWithProfile = {
  id: string
  bet_id: string
  supporter_id: string
  stake_amount: number
  payout_amount: number | null
  created_at: string
  profiles: {
    id: string
    display_name: string | null
    avatars: {
      emoji: string
      name: string
    } | null
  } | null
}

export default async function BetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch bet with checkins
  const { data: bet } = await supabase
    .from('bets')
    .select('*, checkins(*)')
    .eq('id', id)
    .single()

  if (!bet) {
    notFound()
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch avatar
  const { data: avatar } = profile?.active_avatar_id
    ? await supabase
        .from('avatars')
        .select('*')
        .eq('id', profile.active_avatar_id)
        .single()
    : { data: null }

  // Fetch supporters
  const { data: supports } = await supabase
    .from('supports')
    .select('*, profiles(id, display_name, avatars(emoji, name))')
    .eq('bet_id', id)
    .order('created_at', { ascending: false })

  const currentCheckin = bet.checkins?.find(
    (c: { week_number: number }) => c.week_number === bet.current_week
  )
  const canCheckIn = bet.status === 'active' && currentCheckin && !currentCheckin.completed
  const isOwner = bet.user_id === user.id

  // Check if user can support this bet
  const canSupport = () => {
    if (isOwner) return false
    if (bet.status !== 'active') return false
    // Check if user already supports
    if (supports?.some((s: SupportWithProfile) => s.supporter_id === user.id)) return false
    // Check if less than 2 weeks old
    const betDate = new Date(bet.created_at)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return betDate > twoWeeksAgo
  }

  const totalSupportStake = supports?.reduce((sum: number, s: SupportWithProfile) => sum + s.stake_amount, 0) ?? 0

  // Get encouragement message
  const encouragement = avatar?.encouragement_messages
    ? avatar.encouragement_messages[Math.floor(Math.random() * avatar.encouragement_messages.length)]
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/bets"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Bets
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {bet.status !== 'active' && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              bet.status === 'won'
                ? 'bg-green-100 border border-green-200'
                : 'bg-red-100 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{bet.status === 'won' ? '🏆' : '💔'}</span>
              <div>
                <p className={`font-bold ${bet.status === 'won' ? 'text-green-800' : 'text-red-800'}`}>
                  {bet.status === 'won' ? 'Bet Won!' : 'Bet Lost'}
                </p>
                <p className={`text-sm ${bet.status === 'won' ? 'text-green-600' : 'text-red-600'}`}>
                  {bet.status === 'won'
                    ? `You earned ${bet.stake_amount * bet.duration_weeks} GC!`
                    : `You lost ${bet.stake_amount} GC.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bet Details Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full capitalize mb-2">
                {bet.category}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                {bet.habit_description}
              </h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-600 font-bold text-xl">
                <span>🪙</span>
                <span>{bet.stake_amount} GC</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Win: {bet.stake_amount * bet.duration_weeks} GC
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>Week {bet.current_week} of {bet.duration_weeks}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  bet.status === 'won'
                    ? 'bg-green-500'
                    : bet.status === 'lost'
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                }`}
                style={{
                  width: bet.status === 'active'
                    ? `${((bet.current_week - 1) / bet.duration_weeks) * 100}%`
                    : '100%',
                }}
              />
            </div>
          </div>

          {/* Week-by-week breakdown */}
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: bet.duration_weeks }, (_, i) => {
              const weekNum = i + 1
              const checkin = bet.checkins?.find(
                (c: { week_number: number }) => c.week_number === weekNum
              )
              const isCompleted = checkin?.completed
              const isCurrent = weekNum === bet.current_week && bet.status === 'active'
              const isFuture = weekNum > bet.current_week

              return (
                <div
                  key={weekNum}
                  className={`p-2 rounded-lg text-center ${
                    isCompleted
                      ? 'bg-green-100 text-green-800'
                      : isCurrent
                      ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                      : isFuture
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="text-xs">Week</div>
                  <div className="font-bold">{weekNum}</div>
                  <div className="text-lg">
                    {isCompleted ? '✓' : isCurrent ? '•' : isFuture ? '○' : '✗'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Avatar Encouragement */}
        {bet.status === 'active' && avatar && encouragement && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{avatar.emoji}</div>
              <div>
                <p className="italic">"{encouragement}"</p>
                <p className="text-sm text-purple-200 mt-1">— {avatar.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Button */}
        {isOwner && canCheckIn && (
          <Link
            href={`/bets/${bet.id}/checkin`}
            className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            Check In for Week {bet.current_week}
          </Link>
        )}

        {/* Buddy Info */}
        {bet.buddy_email && (
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-medium text-blue-800">Accountability Buddy</p>
                <p className="text-sm text-blue-600">{bet.buddy_email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Supporters Section */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <h2 className="font-semibold text-gray-900">Supporters</h2>
                {supports && supports.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {supports.length}
                  </span>
                )}
              </div>
              {totalSupportStake > 0 && (
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-amber-600">{totalSupportStake} GC</span>
                </div>
              )}
            </div>
          </div>

          {supports && supports.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {(supports as SupportWithProfile[]).map((support) => (
                <div key={support.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{support.profiles?.avatars?.emoji ?? '👤'}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {support.profiles?.display_name ?? 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(support.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold text-amber-600">
                      <span>🪙</span>
                      <span>{support.stake_amount} GC</span>
                    </div>
                    {bet.status === 'won' && support.payout_amount && (
                      <p className="text-xs text-green-600">Won +{support.payout_amount} GC</p>
                    )}
                    {bet.status === 'lost' && (
                      <p className="text-xs text-red-600">Lost</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-3">No supporters yet</p>
              {canSupport() && (
                <p className="text-sm text-gray-400">
                  Share this bet to get support from friends!
                </p>
              )}
            </div>
          )}

          {/* Support Button for non-owners */}
          {canSupport() && (
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Link
                href={`/bets/${bet.id}/support`}
                className="block w-full text-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
              >
                Support This Bet
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
