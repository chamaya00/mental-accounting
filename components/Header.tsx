'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { Profile, Avatar } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
  avatar: Avatar | null
}

export default function Header({ profile, avatar }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [shopMenuOpen, setShopMenuOpen] = useState(false)
  const shopMenuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path
  const isShopActive = pathname === '/avatar-mall' || pathname === '/collectibles-mall'

  // Close shop menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shopMenuRef.current && !shopMenuRef.current.contains(event.target as Node)) {
        setShopMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-gray-900 hidden sm:inline">Bet On Yourself</span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>🏠</span>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/wall"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/wall')
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>📜</span>
                <span className="hidden sm:inline">Wall</span>
              </Link>
              <Link
                href="/bets"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/bets')
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>📋</span>
                <span className="hidden sm:inline">My Bets</span>
              </Link>

              {/* Shop Dropdown */}
              <div className="relative" ref={shopMenuRef}>
                <button
                  onClick={() => setShopMenuOpen(!shopMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isShopActive
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>🛒</span>
                  <span className="hidden sm:inline">Shop</span>
                  <span className="text-xs">▼</span>
                </button>
                {shopMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-40 z-50">
                    <Link
                      href="/avatar-mall"
                      onClick={() => setShopMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                        isActive('/avatar-mall')
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>🎭</span>
                      Avatar Mall
                    </Link>
                    <Link
                      href="/collectibles-mall"
                      onClick={() => setShopMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                        isActive('/collectibles-mall')
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>🛍️</span>
                      Collectibles Mall
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
              <span className="text-lg">🪙</span>
              <span className="font-bold text-amber-700 text-sm">
                {profile?.balance?.toLocaleString() ?? 0}
              </span>
            </div>

            <Link href="/profile" className="text-2xl hover:scale-110 transition-transform" title={avatar?.name ?? 'Profile'}>
              {avatar?.emoji ?? '👤'}
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
