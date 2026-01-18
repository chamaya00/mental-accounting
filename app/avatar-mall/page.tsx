'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Avatar, Profile } from '@/types/database'

type AvatarWithOwnership = Avatar & { owned: boolean }

export default function AvatarMallPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatars, setAvatars] = useState<AvatarWithOwnership[]>([])
  const [ownedAvatarIds, setOwnedAvatarIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [settingActiveId, setSettingActiveId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch all avatars (excluding premium for now as per Phase 3)
      const { data: avatarsData } = await supabase
        .from('avatars')
        .select('*')
        .neq('category', 'premium')
        .order('category')
        .order('price')

      // Fetch user's owned avatars
      const { data: userAvatarsData } = await supabase
        .from('user_avatars')
        .select('avatar_id')
        .eq('user_id', user.id)

      const ownedIds = new Set((userAvatarsData ?? []).map((ua: { avatar_id: number }) => ua.avatar_id))
      setOwnedAvatarIds(ownedIds)

      if (avatarsData) {
        const avatarsWithOwnership = avatarsData.map((avatar: Avatar) => ({
          ...avatar,
          owned: ownedIds.has(avatar.id),
        }))
        setAvatars(avatarsWithOwnership)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const handlePurchase = async (avatarId: number) => {
    setError(null)
    setPurchasingId(avatarId)

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase.rpc as any)('purchase_avatar', {
        p_avatar_id: avatarId,
      })

      if (rpcError) {
        setError(rpcError.message || 'Failed to purchase avatar')
        return
      }

      // Update local state
      setOwnedAvatarIds(prev => new Set([...prev, avatarId]))
      setAvatars(prev =>
        prev.map(a => (a.id === avatarId ? { ...a, owned: true } : a))
      )

      // Refresh profile for updated balance
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profileData) {
          setProfile(profileData)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPurchasingId(null)
    }
  }

  const handleSetActive = async (avatarId: number) => {
    setError(null)
    setSettingActiveId(avatarId)

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase.rpc as any)('set_active_avatar', {
        p_avatar_id: avatarId,
      })

      if (rpcError) {
        setError(rpcError.message || 'Failed to set active avatar')
        return
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, active_avatar_id: avatarId } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSettingActiveId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  const starterAvatars = avatars.filter(a => a.category === 'starter')
  const motivatorAvatars = avatars.filter(a => a.category === 'motivator')
  const legendAvatars = avatars.filter(a => a.category === 'legend')

  const categoryInfo = {
    starter: {
      title: 'Starter Avatars',
      description: 'Free companions to start your journey',
      color: 'bg-gray-100',
      border: 'border-gray-200',
    },
    motivator: {
      title: 'Motivator Avatars',
      description: 'Encouraging companions with unique voices',
      color: 'bg-blue-50',
      border: 'border-blue-200',
    },
    legend: {
      title: 'Legend Avatars',
      description: 'Powerful allies for dedicated achievers',
      color: 'bg-purple-50',
      border: 'border-purple-200',
    },
  }

  const renderAvatarCard = (avatar: AvatarWithOwnership) => {
    const isActive = profile?.active_avatar_id === avatar.id
    const canAfford = (profile?.balance ?? 0) >= avatar.price

    return (
      <div
        key={avatar.id}
        className={`bg-white rounded-xl p-4 border-2 transition-all ${
          isActive ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
        }`}
      >
        <div className="text-center mb-3">
          <div className="text-5xl mb-2">{avatar.emoji}</div>
          <h3 className="font-bold text-gray-900">{avatar.name}</h3>
          {avatar.personality_voice && (
            <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
              {avatar.personality_voice}
            </p>
          )}
        </div>

        {/* Sample message */}
        {avatar.encouragement_messages && avatar.encouragement_messages.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-2 mb-3 text-center">
            <p className="text-sm text-gray-600 italic">
              "{avatar.encouragement_messages[0]}"
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {avatar.owned ? (
            <>
              {isActive ? (
                <div className="w-full py-2 px-4 bg-amber-100 text-amber-700 font-medium rounded-lg text-center text-sm">
                  Active Avatar
                </div>
              ) : (
                <button
                  onClick={() => handleSetActive(avatar.id)}
                  disabled={settingActiveId === avatar.id}
                  className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm disabled:opacity-50"
                >
                  {settingActiveId === avatar.id ? 'Setting...' : 'Set as Active'}
                </button>
              )}
              <div className="text-center text-xs text-green-600 font-medium">
                Owned
              </div>
            </>
          ) : (
            <>
              {avatar.price === 0 ? (
                <div className="w-full py-2 px-4 bg-green-100 text-green-700 font-medium rounded-lg text-center text-sm">
                  Free
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(avatar.id)}
                  disabled={!canAfford || purchasingId === avatar.id}
                  className={`w-full py-2 px-4 font-medium rounded-lg text-sm transition-all ${
                    canAfford
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {purchasingId === avatar.id
                    ? 'Purchasing...'
                    : `Buy for ${avatar.price} GC`}
                </button>
              )}
              {!canAfford && avatar.price > 0 && (
                <p className="text-center text-xs text-red-500">Insufficient balance</p>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const renderCategory = (
    categoryAvatars: AvatarWithOwnership[],
    category: 'starter' | 'motivator' | 'legend'
  ) => {
    const info = categoryInfo[category]
    return (
      <section className="mb-8">
        <div className={`${info.color} rounded-xl p-4 mb-4 border ${info.border}`}>
          <h2 className="text-xl font-bold text-gray-900">{info.title}</h2>
          <p className="text-sm text-gray-600">{info.description}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryAvatars.map(renderAvatarCard)}
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </Link>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🎭</span> Avatar Mall
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
              <span className="text-lg">🪙</span>
              <span className="font-bold text-amber-700 text-sm">
                {profile?.balance?.toLocaleString() ?? 0}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {renderCategory(starterAvatars, 'starter')}
        {renderCategory(motivatorAvatars, 'motivator')}
        {renderCategory(legendAvatars, 'legend')}

        <div className="text-center text-gray-500 text-sm">
          <p>Premium avatars with AI-powered messages coming soon!</p>
        </div>
      </main>
    </div>
  )
}
