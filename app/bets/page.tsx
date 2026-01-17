import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

export default async function BetsPage() {
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

  // Fetch all bets
  const { data: bets } = await supabase
    .from('bets')
    .select('*, checkins(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeBets = bets?.filter(b => b.status === 'active') ?? []
  const wonBets = bets?.filter(b => b.status === 'won') ?? []
  const lostBets = bets?.filter(b => b.status === 'lost') ?? []

  // Stats
  const totalWon = wonBets.reduce((sum, b) => sum + (b.stake_amount * b.duration_weeks), 0)
  const totalLost = lostBets.reduce((sum, b) => sum + b.stake_amount, 0)
  const winRate = bets && bets.length > activeBets.length
    ? Math.round((wonBets.length / (wonBets.length + lostBets.length)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">+{totalWon}</div>
            <div className="text-sm text-gray-500">GC Won</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">-{totalLost}</div>
            <div className="text-sm text-gray-500">GC Lost</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{winRate}%</div>
            <div className="text-sm text-gray-500">Win Rate</div>
          </div>
        </div>

        {/* New Bet Button */}
        <div className="mb-8">
          <Link
            href="/new-bet"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            <span>➕</span>
            <span>Create New Bet</span>
          </Link>
        </div>

        {/* Active Bets */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Active Bets ({activeBets.length})
          </h2>

          {activeBets.length > 0 ? (
            <div className="space-y-4">
              {activeBets.map((bet) => {
                const currentCheckin = bet.checkins?.find(
                  (c: { week_number: number }) => c.week_number === bet.current_week
                )
                const canCheckIn = currentCheckin && !currentCheckin.completed

                return (
                  <Link
                    key={bet.id}
                    href={`/bets/${bet.id}`}
                    className="block bg-white rounded-xl p-6 border border-gray-200 hover:border-amber-300 transition-all"
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
                      </div>
                    </div>

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                        style={{
                          width: `${((bet.current_week - 1) / bet.duration_weeks) * 100}%`,
                        }}
                      />
                    </div>

                    {canCheckIn && (
                      <div className="text-sm text-green-600 font-medium">
                        Ready to check in
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-500">
              No active bets
            </div>
          )}
        </section>

        {/* Won Bets */}
        {wonBets.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Won ({wonBets.length})
            </h2>
            <div className="space-y-3">
              {wonBets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className="block bg-green-50 rounded-xl p-4 border border-green-200 hover:border-green-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {bet.habit_description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {bet.duration_weeks} weeks
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-green-600">
                      +{bet.stake_amount * bet.duration_weeks} GC
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lost Bets */}
        {lostBets.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Lost ({lostBets.length})
            </h2>
            <div className="space-y-3">
              {lostBets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className="block bg-red-50 rounded-xl p-4 border border-red-200 hover:border-red-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💔</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {bet.habit_description}
                        </p>
                        <p className="text-sm text-gray-500">
                          Failed at week {bet.current_week} of {bet.duration_weeks}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-red-600">
                      -{bet.stake_amount} GC
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {bets && bets.length === 0 && (
          <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-600 mb-4">You haven&apos;t created any bets yet.</p>
            <Link
              href="/new-bet"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Create Your First Bet
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
