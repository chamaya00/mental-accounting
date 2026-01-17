'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, Avatar } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
  avatar: Avatar | null
}

export default function Header({ profile, avatar }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-gray-900">Bet On Yourself</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
              <span className="text-xl">🪙</span>
              <span className="font-bold text-amber-700">
                {profile?.balance?.toLocaleString() ?? 0} GC
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-3xl" title={avatar?.name ?? 'Avatar'}>
                {avatar?.emoji ?? '👤'}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
