import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import type { Profile, Avatar, Bet } from '@/types/database'

export default async function DashboardPage() {
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

  // Fetch active bets
  const { data: activeBetsData } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  const activeBets = activeBetsData as Bet[] | null

  // Fetch recent completed bets
  const { data: completedBetsData } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'active')
    .order('completed_at', { ascending: false })
    .limit(5)
  const completedBets = completedBetsData as Bet[] | null

  // Get random encouragement message from avatar
  const encouragementMessage = avatar?.encouragement_messages
    ? avatar.encouragement_messages[Math.floor(Math.random() * avatar.encouragement_messages.length)]
    : 'Keep going!'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{avatar?.emoji ?? '🎯'}</span>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {profile?.display_name ?? 'Champion'}!
              </h1>
              <p className="text-amber-100 italic">&ldquo;{encouragementMessage}&rdquo;</p>
            </div>
          </div>
          <div className="flex items-center gap-8 mt-6">
            <div>
              <div className="text-amber-100 text-sm">Your Balance</div>
              <div className="text-3xl font-bold flex items-center gap-2">
                <span>💰</span>
                {profile?.balance?.toLocaleString() ?? 1000} GC
              </div>
            </div>
            <div>
              <div className="text-amber-100 text-sm">Active Bets</div>
              <div className="text-3xl font-bold">{activeBets?.length ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Active Bets */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Bets</h2>
            <Link
              href="/bets/new"
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              + Create New Bet
            </Link>
          </div>

          {activeBets && activeBets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeBets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{bet.habit_description}</h3>
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                        {bet.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-600 font-bold">{bet.stake_amount} GC</div>
                      <div className="text-xs text-gray-500">staked</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${((bet.current_week - 1) / bet.duration_weeks) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-gray-600 whitespace-nowrap">
                      Week {bet.current_week} of {bet.duration_weeks}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-green-600 font-medium">
                    Potential payout: {bet.stake_amount * bet.duration_weeks} GC
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bets yet</h3>
              <p className="text-gray-600 mb-4">
                Ready to commit to something? Start a bet and put your coins where your goals are.
              </p>
              <Link
                href="/bets/new"
                className="inline-block px-6 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors"
              >
                Create Your First Bet
              </Link>
            </div>
          )}
        </section>

        {/* Recent History */}
        {completedBets && completedBets.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent History</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {completedBets.map((bet, index) => (
                <div
                  key={bet.id}
                  className={`p-4 flex items-center justify-between ${
                    index !== completedBets.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${bet.status === 'won' ? '' : 'opacity-50'}`}>
                      {bet.status === 'won' ? '🏆' : '💔'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">{bet.habit_description}</div>
                      <div className="text-sm text-gray-500">
                        {bet.duration_weeks} weeks · {bet.stake_amount} GC
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${bet.status === 'won' ? 'text-green-600' : 'text-red-500'}`}>
                    {bet.status === 'won' ? `+${bet.stake_amount * bet.duration_weeks} GC` : `-${bet.stake_amount} GC`}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
