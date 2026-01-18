import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import DailyBonusButton from '@/components/DailyBonusButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile with active avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch active avatar details
  const { data: avatar } = profile?.active_avatar_id
    ? await supabase
        .from('avatars')
        .select('*')
        .eq('id', profile.active_avatar_id)
        .single()
    : { data: null }

  // Fetch active bets
  const { data: activeBets } = await supabase
    .from('bets')
    .select('*, checkins(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Fetch recent completed bets
  const { data: recentBets } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'active')
    .order('completed_at', { ascending: false })
    .limit(5)

  // Fetch recent wall events for community activity
  const { data: recentWallEvents } = await supabase
    .from('wall_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get random encouragement from avatar
  const encouragement = avatar?.encouragement_messages
    ? avatar.encouragement_messages[Math.floor(Math.random() * avatar.encouragement_messages.length)]
    : "Let's get started!"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{avatar?.emoji ?? '👤'}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">
                Welcome back, {profile?.display_name ?? 'Champion'}!
              </h1>
              <p className="text-amber-100 italic">"{encouragement}"</p>
              <p className="text-sm text-amber-200 mt-1">— {avatar?.name ?? 'Your Avatar'}</p>
            </div>
          </div>
        </div>

        {/* Daily Bonus */}
        <div className="mb-8">
          <DailyBonusButton lastClaimedAt={profile?.last_login_bonus_at ?? null} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/new-bet"
            className="flex items-center gap-4 bg-white p-6 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-all"
          >
            <div className="text-4xl">➕</div>
            <div>
              <h2 className="font-bold text-gray-900">Create New Bet</h2>
              <p className="text-sm text-gray-600">Stake coins on a new habit</p>
            </div>
          </Link>

          <Link
            href="/wall"
            className="flex items-center gap-4 bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <div className="text-4xl">📜</div>
            <div>
              <h2 className="font-bold text-gray-900">Community Wall</h2>
              <p className="text-sm text-gray-600">See what others are betting on</p>
            </div>
          </Link>

          <Link
            href="/bets"
            className="flex items-center gap-4 bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <div className="text-4xl">📋</div>
            <div>
              <h2 className="font-bold text-gray-900">My Bets</h2>
              <p className="text-sm text-gray-600">View all your bets</p>
            </div>
          </Link>
        </div>

        {/* Active Bets */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Bets</h2>

          {activeBets && activeBets.length > 0 ? (
            <div className="space-y-4">
              {activeBets.map((bet) => {
                const currentCheckin = bet.checkins?.find(
                  (c: { week_number: number }) => c.week_number === bet.current_week
                )
                const canCheckIn = currentCheckin && !currentCheckin.completed

                return (
                  <div
                    key={bet.id}
                    className="bg-white rounded-xl p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {bet.habit_description}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{bet.category}</span>
                          <span>•</span>
                          <span>Week {bet.current_week} of {bet.duration_weeks}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-600 font-bold">
                          <span>🪙</span>
                          <span>{bet.stake_amount} GC</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Win: {bet.stake_amount * bet.duration_weeks} GC
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{
                            width: `${((bet.current_week - 1) / bet.duration_weeks) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {canCheckIn && (
                      <Link
                        href={`/bets/${bet.id}/checkin`}
                        className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                      >
                        Check In for Week {bet.current_week}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-gray-600 mb-4">No active bets yet. Start betting on yourself!</p>
              <Link
                href="/new-bet"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Create Your First Bet
              </Link>
            </div>
          )}
        </section>

        {/* Recent Completed Bets */}
        {recentBets && recentBets.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Results</h2>
            <div className="space-y-3">
              {recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className={`bg-white rounded-xl p-4 border ${
                    bet.status === 'won'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {bet.status === 'won' ? '🏆' : '💔'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {bet.habit_description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {bet.duration_weeks} weeks
                        </p>
                      </div>
                    </div>
                    <div
                      className={`font-bold ${
                        bet.status === 'won' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {bet.status === 'won'
                        ? `+${bet.stake_amount * bet.duration_weeks} GC`
                        : `-${bet.stake_amount} GC`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Community Activity Preview */}
        {recentWallEvents && recentWallEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Community Activity</h2>
              <Link href="/wall" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {recentWallEvents.slice(0, 3).map((event) => {
                const metadata = event.metadata as Record<string, unknown>
                return (
                  <div key={event.id} className="p-4 flex items-center gap-3">
                    <span className="text-2xl">
                      {event.event_type === 'signup' && '🎉'}
                      {event.event_type === 'bet_created' && '🎯'}
                      {event.event_type === 'bet_won' && '🏆'}
                      {event.event_type === 'bet_lost' && '💔'}
                      {event.event_type === 'milestone' && '⭐'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {event.event_type === 'signup' && 'New member joined!'}
                        {event.event_type === 'bet_created' && `New bet: ${metadata.habit}`}
                        {event.event_type === 'bet_won' && `Bet completed: ${metadata.habit}`}
                        {event.event_type === 'bet_lost' && `Bet missed: ${metadata.habit}`}
                        {event.event_type === 'milestone' && (metadata.description as string)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {event.event_type === 'bet_created' && (
                      <Link
                        href={`/bets/${event.bet_id}/support`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                      >
                        Support →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
