'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DailyBonusButtonProps {
  lastClaimedAt: string | null
}

export default function DailyBonusButton({ lastClaimedAt }: DailyBonusButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [justClaimed, setJustClaimed] = useState(false)

  // Check if bonus was already claimed today
  const today = new Date().toDateString()
  const lastClaimedDate = lastClaimedAt ? new Date(lastClaimedAt).toDateString() : null
  const alreadyClaimed = lastClaimedDate === today

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('claim_login_bonus')

      if (error) {
        console.error('Failed to claim bonus:', error)
        return
      }

      if (data > 0) {
        setJustClaimed(true)
        router.refresh()
      }
    } catch (err) {
      console.error('Error claiming bonus:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (alreadyClaimed || justClaimed) {
    return (
      <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-medium text-green-800">Daily bonus claimed!</p>
          <p className="text-sm text-green-600">Come back tomorrow for more</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isLoading}
      className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 px-4 py-3 rounded-xl transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-2xl animate-bounce">🎁</span>
      <div className="text-left">
        <p className="font-bold text-white">
          {isLoading ? 'Claiming...' : 'Claim Daily Bonus!'}
        </p>
        <p className="text-sm text-yellow-100">+200 GC</p>
      </div>
    </button>
  )
}
