'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, Avatar } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
  avatar: Avatar | null
}

export function Header({ profile, avatar }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="font-bold text-lg text-gray-900 hidden sm:inline">Bet On Yourself</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/bets"
            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            My Bets
          </Link>
          <Link
            href="/bets/new"
            className="px-4 py-2 bg-amber-500 text-white rounded-full font-semibold text-sm hover:bg-amber-600 transition-colors"
          >
            + New Bet
          </Link>
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <span className="text-lg">💰</span>
              <span>{profile?.balance?.toLocaleString() ?? 0}</span>
            </div>
            {avatar && (
              <span className="text-2xl" title={avatar.name}>
                {avatar.emoji}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700 text-sm ml-2"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
