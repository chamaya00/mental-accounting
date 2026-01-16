import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import type { Profile, Avatar, Bet } from '@/types/database'

export default async function BetsPage() {
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

  // Fetch all bets
  const { data: betsData } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const bets = betsData as Bet[] | null

  const activeBets = bets?.filter(b => b.status === 'active') ?? []
  const completedBets = bets?.filter(b => b.status !== 'active') ?? []

  // Calculate stats
  const totalWins = completedBets.filter(b => b.status === 'won').length
  const totalLosses = completedBets.filter(b => b.status === 'lost').length
  const totalEarned = completedBets
    .filter(b => b.status === 'won')
    .reduce((sum, b) => sum + (b.stake_amount * b.duration_weeks), 0)
  const totalLost = completedBets
    .filter(b => b.status === 'lost')
    .reduce((sum, b) => sum + b.stake_amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Bets</h1>
          <Link
            href="/bets/new"
            className="px-6 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors"
          >
            + New Bet
          </Link>
        </div>

        {/* Stats Overview */}
        {(bets?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-amber-600">{activeBets.length}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-green-600">{totalWins}</div>
              <div className="text-sm text-gray-500">Won</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <div className="text-2xl font-bold text-red-500">{totalLosses}</div>
              <div className="text-sm text-gray-500">Lost</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <div className={`text-2xl font-bold ${totalEarned - totalLost >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalEarned - totalLost >= 0 ? '+' : ''}{totalEarned - totalLost}
              </div>
              <div className="text-sm text-gray-500">Net GC</div>
            </div>
          </div>
        )}

        {/* Active Bets */}
        {activeBets.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Bets</h2>
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{bet.habit_description}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                          {bet.category}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          Active
                        </span>
                      </div>
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
                      Week {bet.current_week} / {bet.duration_weeks}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-green-600">
                      Potential: +{bet.stake_amount * bet.duration_weeks} GC
                    </span>
                    <span className="text-amber-600 font-medium">
                      Check in →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Completed Bets */}
        {completedBets.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {completedBets.map((bet, index) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    index !== completedBets.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl ${bet.status === 'won' ? '' : 'opacity-50'}`}>
                        {bet.status === 'won' ? '🏆' : '💔'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{bet.habit_description}</div>
                        <div className="text-sm text-gray-500">
                          {bet.duration_weeks} weeks · {bet.stake_amount} GC staked
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold ${bet.status === 'won' ? 'text-green-600' : 'text-red-500'}`}>
                      {bet.status === 'won'
                        ? `+${bet.stake_amount * bet.duration_weeks} GC`
                        : `-${bet.stake_amount} GC`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(bets?.length ?? 0) === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-300">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bets yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ready to commit to something? Create your first bet and put your Gold Coins where your goals are.
            </p>
            <Link
              href="/bets/new"
              className="inline-block px-8 py-4 bg-amber-500 text-white rounded-full font-bold text-lg hover:bg-amber-600 transition-colors"
            >
              Create Your First Bet
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
