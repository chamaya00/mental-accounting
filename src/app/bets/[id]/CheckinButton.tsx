'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkinBet } from '../actions'

interface CheckinButtonProps {
  betId: string
}

export function CheckinButton({ betId }: CheckinButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckin = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await checkinBet(betId)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      setShowConfirm(false)
    } else {
      router.refresh()
    }
  }

  if (showConfirm) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <p className="text-gray-700 font-medium">Are you sure you completed this habit?</p>
        <p className="text-sm text-gray-500">Be honest with yourself - that&apos;s the whole point!</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Not Yet
          </button>
          <button
            onClick={handleCheckin}
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Confirming...' : 'Yes, I Did It!'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-8 py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
    >
      Check In for This Week
    </button>
  )
}
