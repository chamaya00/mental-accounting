import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

export default async function ProfilePage() {
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

  // Fetch owned avatars with details
  const { data: ownedAvatars } = await supabase
    .from('user_avatars')
    .select('avatar_id, acquired_at, avatars(*)')
    .eq('user_id', user.id)
    .order('acquired_at', { ascending: false })

  // Fetch owned collectibles with details
  const { data: ownedCollectibles } = await supabase
    .from('user_collectibles')
    .select('collectible_id, acquired_at, collectibles(*)')
    .eq('user_id', user.id)
    .order('acquired_at', { ascending: false })

  // Fetch bet stats
  const { data: bets } = await supabase
    .from('bets')
    .select('status, stake_amount, duration_weeks')
    .eq('user_id', user.id)

  const wonBets = bets?.filter(b => b.status === 'won') ?? []
  const lostBets = bets?.filter(b => b.status === 'lost') ?? []
  const activeBets = bets?.filter(b => b.status === 'active') ?? []

  const totalWon = wonBets.reduce((sum, b) => sum + (b.stake_amount * b.duration_weeks), 0)
  const totalLost = lostBets.reduce((sum, b) => sum + b.stake_amount, 0)
  const winRate = bets && (wonBets.length + lostBets.length) > 0
    ? Math.round((wonBets.length / (wonBets.length + lostBets.length)) * 100)
    : 0

  // Type helpers for the joined data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type OwnedAvatarRow = { avatar_id: number; acquired_at: string; avatars: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type OwnedCollectibleRow = { collectible_id: number; acquired_at: string; collectibles: any }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-6">
            <div className="text-7xl">{avatar?.emoji ?? '👤'}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">
                {profile?.display_name ?? 'Champion'}
              </h1>
              <p className="text-indigo-200">
                {avatar?.name ?? 'No avatar selected'} • Member since{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <span className="text-2xl">🪙</span>
                <span className="text-2xl font-bold">
                  {profile?.balance?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-2xl font-bold text-gray-900">{activeBets.length}</div>
            <div className="text-sm text-gray-500">Active Bets</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-green-600">{wonBets.length}</div>
            <div className="text-sm text-gray-500">Bets Won</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-2xl font-bold text-amber-600">{winRate}%</div>
            <div className="text-sm text-gray-500">Win Rate</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl mb-1">💰</div>
            <div className="text-2xl font-bold text-indigo-600">
              {(totalWon - totalLost).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Net Earnings</div>
          </div>
        </div>

        {/* Owned Avatars */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🎭</span> My Avatars
            </h2>
            <Link
              href="/avatar-mall"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Browse Mall →
            </Link>
          </div>
          {ownedAvatars && ownedAvatars.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {(ownedAvatars as OwnedAvatarRow[]).map((ua) => {
                const avatarData = ua.avatars
                if (!avatarData) return null
                const isActive = profile?.active_avatar_id === ua.avatar_id
                return (
                  <div
                    key={ua.avatar_id}
                    className={`bg-white rounded-xl p-4 border-2 text-center transition-all ${
                      isActive
                        ? 'border-amber-400 ring-2 ring-amber-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-4xl mb-2">{avatarData.emoji}</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {avatarData.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {avatarData.category}
                    </div>
                    {isActive && (
                      <div className="mt-2 text-xs text-amber-600 font-medium">
                        Active
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <p className="text-gray-600 mb-4">No avatars yet</p>
              <Link
                href="/avatar-mall"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Visit Avatar Mall
              </Link>
            </div>
          )}
        </section>

        {/* Owned Collectibles */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🛍️</span> My Collectibles
            </h2>
            <Link
              href="/collectibles-mall"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Browse Mall →
            </Link>
          </div>
          {ownedCollectibles && ownedCollectibles.length > 0 ? (
            <div className="space-y-4">
              {/* Group by tier */}
              {(['accessory', 'vehicle', 'property'] as const).map((tier) => {
                const tierCollectibles = (ownedCollectibles as OwnedCollectibleRow[]).filter(
                  (uc) => uc.collectibles?.tier === tier
                )
                if (tierCollectibles.length === 0) return null

                const tierLabels = {
                  accessory: { label: 'Accessories', emoji: '🎩' },
                  vehicle: { label: 'Vehicles', emoji: '🚗' },
                  property: { label: 'Properties', emoji: '🏠' },
                }

                return (
                  <div key={tier}>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <span>{tierLabels[tier].emoji}</span>
                      {tierLabels[tier].label}
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                      {tierCollectibles.map((uc) => {
                        const collectibleData = uc.collectibles
                        if (!collectibleData) return null
                        return (
                          <div
                            key={uc.collectible_id}
                            className="bg-white rounded-lg p-3 border border-gray-200 text-center hover:border-gray-300 transition-all"
                            title={collectibleData.name}
                          >
                            <div className="text-3xl">{collectibleData.emoji}</div>
                            <div className="text-xs text-gray-600 truncate mt-1">
                              {collectibleData.name}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <div className="text-4xl mb-4">🛍️</div>
              <p className="text-gray-600 mb-4">No collectibles yet</p>
              <Link
                href="/collectibles-mall"
                className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
              >
                Visit Collectibles Mall
              </Link>
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/avatar-mall"
              className="flex items-center gap-4 bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
            >
              <div className="text-4xl">🎭</div>
              <div>
                <h3 className="font-bold text-gray-900">Avatar Mall</h3>
                <p className="text-sm text-gray-600">
                  Browse and purchase new avatars
                </p>
              </div>
            </Link>
            <Link
              href="/collectibles-mall"
              className="flex items-center gap-4 bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
            >
              <div className="text-4xl">🛍️</div>
              <div>
                <h3 className="font-bold text-gray-900">Collectibles Mall</h3>
                <p className="text-sm text-gray-600">
                  Expand your collection
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
