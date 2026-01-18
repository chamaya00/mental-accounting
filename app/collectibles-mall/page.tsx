'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Collectible, Profile } from '@/types/database'

type CollectibleWithOwnership = Collectible & { owned: boolean }

export default function CollectiblesMallPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [collectibles, setCollectibles] = useState<CollectibleWithOwnership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
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

      // Fetch all collectibles
      const { data: collectiblesData } = await supabase
        .from('collectibles')
        .select('*')
        .order('tier')
        .order('price')

      // Fetch user's owned collectibles
      const { data: userCollectiblesData } = await supabase
        .from('user_collectibles')
        .select('collectible_id')
        .eq('user_id', user.id)

      const ownedIds = new Set(
        (userCollectiblesData ?? []).map((uc: { collectible_id: number }) => uc.collectible_id)
      )

      if (collectiblesData) {
        const collectiblesWithOwnership = collectiblesData.map((collectible: Collectible) => ({
          ...collectible,
          owned: ownedIds.has(collectible.id),
        }))
        setCollectibles(collectiblesWithOwnership)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const handlePurchase = async (collectibleId: number) => {
    setError(null)
    setPurchasingId(collectibleId)

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase.rpc as any)('purchase_collectible', {
        p_collectible_id: collectibleId,
      })

      if (rpcError) {
        setError(rpcError.message || 'Failed to purchase collectible')
        return
      }

      // Update local state
      setCollectibles(prev =>
        prev.map(c => (c.id === collectibleId ? { ...c, owned: true } : c))
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    )
  }

  const accessoryCollectibles = collectibles.filter(c => c.tier === 'accessory')
  const vehicleCollectibles = collectibles.filter(c => c.tier === 'vehicle')
  const propertyCollectibles = collectibles.filter(c => c.tier === 'property')

  const tierInfo = {
    accessory: {
      title: 'Accessories',
      description: 'Style up your profile with these cool items',
      emoji: '🎩',
      color: 'bg-pink-50',
      border: 'border-pink-200',
    },
    vehicle: {
      title: 'Vehicles',
      description: 'Show off your rides',
      emoji: '🚗',
      color: 'bg-blue-50',
      border: 'border-blue-200',
    },
    property: {
      title: 'Properties',
      description: 'Ultimate status symbols for top achievers',
      emoji: '🏠',
      color: 'bg-amber-50',
      border: 'border-amber-200',
    },
  }

  const renderCollectibleCard = (collectible: CollectibleWithOwnership) => {
    const canAfford = (profile?.balance ?? 0) >= collectible.price

    return (
      <div
        key={collectible.id}
        className={`bg-white rounded-xl p-4 border-2 transition-all ${
          collectible.owned ? 'border-green-400 bg-green-50' : 'border-gray-200'
        }`}
      >
        <div className="text-center mb-3">
          <div className="text-4xl mb-2">{collectible.emoji}</div>
          <h3 className="font-bold text-gray-900">{collectible.name}</h3>
        </div>

        {collectible.owned ? (
          <div className="text-center">
            <div className="py-2 px-4 bg-green-100 text-green-700 font-medium rounded-lg text-sm">
              Owned
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => handlePurchase(collectible.id)}
              disabled={!canAfford || purchasingId === collectible.id}
              className={`w-full py-2 px-4 font-medium rounded-lg text-sm transition-all ${
                canAfford
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {purchasingId === collectible.id
                ? 'Purchasing...'
                : `Buy for ${collectible.price.toLocaleString()} GC`}
            </button>
            {!canAfford && (
              <p className="text-center text-xs text-red-500">Insufficient balance</p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTier = (
    tierCollectibles: CollectibleWithOwnership[],
    tier: 'accessory' | 'vehicle' | 'property'
  ) => {
    const info = tierInfo[tier]
    const ownedCount = tierCollectibles.filter(c => c.owned).length
    return (
      <section className="mb-8">
        <div className={`${info.color} rounded-xl p-4 mb-4 border ${info.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{info.emoji}</span> {info.title}
              </h2>
              <p className="text-sm text-gray-600">{info.description}</p>
            </div>
            <div className="text-sm text-gray-500">
              {ownedCount}/{tierCollectibles.length} owned
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tierCollectibles.map(renderCollectibleCard)}
        </div>
      </section>
    )
  }

  const totalOwned = collectibles.filter(c => c.owned).length
  const totalCollectibles = collectibles.length

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
                <span>🛍️</span> Collectibles Mall
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
        {/* Collection Progress */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Collection</h2>
              <p className="text-indigo-100">
                {totalOwned} of {totalCollectibles} items collected
              </p>
            </div>
            <div className="text-4xl">
              {totalOwned === totalCollectibles ? '👑' : '🎯'}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${(totalOwned / totalCollectibles) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {renderTier(accessoryCollectibles, 'accessory')}
        {renderTier(vehicleCollectibles, 'vehicle')}
        {renderTier(propertyCollectibles, 'property')}
      </main>
    </div>
  )
}
