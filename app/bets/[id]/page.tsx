import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

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

  const currentCheckin = bet.checkins?.find(
    (c: { week_number: number }) => c.week_number === bet.current_week
  )
  const canCheckIn = bet.status === 'active' && currentCheckin && !currentCheckin.completed
  const isOwner = bet.user_id === user.id

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
      </main>
    </div>
  )
}
