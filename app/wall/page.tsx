'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { WallEvent, Profile, Avatar, Bet } from '@/types/database'

type WallEventWithRelations = WallEvent & {
  profile: (Profile & { active_avatar: Avatar | null }) | null
  bet: Bet | null
}

export default function WallPage() {
  const [events, setEvents] = useState<WallEventWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatar, setAvatar] = useState<Avatar | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id ?? null)

      if (user) {
        // Fetch profile with avatar
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)

        if (profileData?.active_avatar_id) {
          const { data: avatarData } = await supabase
            .from('avatars')
            .select('*')
            .eq('id', profileData.active_avatar_id)
            .single()
          setAvatar(avatarData)
        }
      }

      // Fetch wall events with related data
      await fetchEvents()
    }

    const fetchEvents = async () => {
      const { data: eventsData } = await supabase
        .from('wall_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (eventsData) {
        // Fetch related profiles and bets
        const userIds = [...new Set(eventsData.map(e => e.user_id).filter(Boolean))]
        const betIds = [...new Set(eventsData.map(e => e.bet_id).filter(Boolean))]

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*, active_avatar:avatars(*)')
          .in('id', userIds)

        const { data: bets } = betIds.length > 0
          ? await supabase.from('bets').select('*').in('id', betIds)
          : { data: [] }

        const enrichedEvents = eventsData.map(event => ({
          ...event,
          profile: profiles?.find(p => p.id === event.user_id) ?? null,
          bet: bets?.find(b => b.id === event.bet_id) ?? null,
        }))

        setEvents(enrichedEvents as WallEventWithRelations[])
      }
      setIsLoading(false)
    }

    loadData()

    // Set up realtime subscription
    const channel = supabase
      .channel('wall_events_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wall_events',
        },
        async (payload) => {
          const newEvent = payload.new as WallEvent

          // Fetch related data for the new event
          let profileData = null
          let betData = null

          if (newEvent.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('*, active_avatar:avatars(*)')
              .eq('id', newEvent.user_id)
              .single()
            profileData = data
          }

          if (newEvent.bet_id) {
            const { data } = await supabase
              .from('bets')
              .select('*')
              .eq('id', newEvent.bet_id)
              .single()
            betData = data
          }

          const enrichedEvent: WallEventWithRelations = {
            ...newEvent,
            profile: profileData,
            bet: betData,
          }

          setEvents(prev => [enrichedEvent, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const canSupport = (event: WallEventWithRelations) => {
    if (!currentUser) return false
    if (event.event_type !== 'bet_created') return false
    if (!event.bet) return false
    if (event.bet.user_id === currentUser) return false
    if (event.bet.status !== 'active') return false

    // Check if less than 2 weeks old
    const betDate = new Date(event.bet.created_at)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return betDate > twoWeeksAgo
  }

  const renderEventContent = (event: WallEventWithRelations) => {
    const metadata = event.metadata as Record<string, unknown>
    const userName = event.profile?.display_name ?? 'Someone'
    const avatarEmoji = (event.profile as { active_avatar?: Avatar | null })?.active_avatar?.emoji ?? '👤'

    switch (event.event_type) {
      case 'signup':
        return (
          <div className="flex items-start gap-4">
            <div className="text-4xl">{avatarEmoji}</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{userName}</span>
                {' '}just joined the community!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Started with 1,000 GC
              </p>
            </div>
            <div className="text-3xl">🎉</div>
          </div>
        )

      case 'bet_created':
        return (
          <div className="flex items-start gap-4">
            <div className="text-4xl">{avatarEmoji}</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{userName}</span>
                {' '}is betting on themselves!
              </p>
              <div className="bg-amber-50 rounded-lg p-3 mt-2">
                <p className="font-medium text-gray-900">{metadata.habit as string}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span>🪙</span>
                    <span>{metadata.stake as number} GC</span>
                  </span>
                  <span>•</span>
                  <span>{metadata.weeks as number} weeks</span>
                  <span>•</span>
                  <span className="text-green-600">Win: {(metadata.stake as number) * (metadata.weeks as number)} GC</span>
                </div>
              </div>
              {canSupport(event) && (
                <Link
                  href={`/bets/${event.bet_id}/support`}
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  <span>🤝</span>
                  Support this bet
                </Link>
              )}
            </div>
          </div>
        )

      case 'bet_won':
        return (
          <div className="flex items-start gap-4">
            <div className="text-4xl">{avatarEmoji}</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{userName}</span>
                {' '}completed their bet!
              </p>
              <div className="bg-green-50 rounded-lg p-3 mt-2">
                <p className="font-medium text-gray-900">{metadata.habit as string}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <span>🏆</span>
                    +{metadata.payout as number} GC
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{metadata.weeks as number} weeks completed</span>
                  {(metadata.supporters as number) > 0 && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{metadata.supporters as number} supporters won too!</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-3xl">🎊</div>
          </div>
        )

      case 'bet_lost':
        return (
          <div className="flex items-start gap-4">
            <div className="text-4xl">{avatarEmoji}</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{userName}</span>
                {' '}missed their check-in
              </p>
              <div className="bg-red-50 rounded-lg p-3 mt-2">
                <p className="font-medium text-gray-900">{metadata.habit as string}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <span>💔</span>
                    -{metadata.lost as number} GC
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">Failed at week {metadata.failed_at_week as number} of {metadata.weeks as number}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'milestone':
        return (
          <div className="flex items-start gap-4">
            <div className="text-4xl">{avatarEmoji}</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{userName}</span>
                {' '}reached a milestone!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {metadata.description as string}
              </p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📜</div>
          <p className="text-gray-600">Loading wall...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-gray-900">Bet On Yourself</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
                  <span className="text-xl">🪙</span>
                  <span className="font-bold text-amber-700">
                    {profile?.balance?.toLocaleString() ?? 0} GC
                  </span>
                </div>

                <Link href="/dashboard" className="text-3xl" title={avatar?.name ?? 'Dashboard'}>
                  {avatar?.emoji ?? '👤'}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Wall</h1>
          <p className="text-gray-600">
            See what everyone is betting on and cheer them on!
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live updates</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/wall"
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium"
          >
            <span>📜</span>
            <span>Wall</span>
          </Link>
          {currentUser && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                <span>🏠</span>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/bets"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                <span>📋</span>
                <span>My Bets</span>
              </Link>
            </>
          )}
        </div>

        {/* Events Feed */}
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl p-6 border border-gray-200 transition-all hover:shadow-md"
              >
                {renderEventContent(event)}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(event.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              The wall is quiet... for now
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a bet and inspire others!
            </p>
            {currentUser ? (
              <Link
                href="/new-bet"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Create Your First Bet
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Join Now & Start Betting
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
