'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { BetCategory } from '@/types/database'

const categories: { value: BetCategory; label: string; emoji: string }[] = [
  { value: 'health', label: 'Health & Fitness', emoji: '💪' },
  { value: 'learning', label: 'Learning & Skills', emoji: '📚' },
  { value: 'creative', label: 'Creative Projects', emoji: '🎨' },
  { value: 'social', label: 'Social & Relationships', emoji: '👥' },
  { value: 'financial', label: 'Financial Goals', emoji: '💰' },
  { value: 'other', label: 'Other', emoji: '✨' },
]

export default function NewBetPage() {
  const router = useRouter()

  const [habitDescription, setHabitDescription] = useState('')
  const [category, setCategory] = useState<BetCategory>('health')
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [stakeAmount, setStakeAmount] = useState(100)
  const [buddyEmail, setBuddyEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const potentialWin = stakeAmount * durationWeeks

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase.rpc as any)('create_bet', {
        p_habit_description: habitDescription,
        p_category: category,
        p_stake_amount: stakeAmount,
        p_duration_weeks: durationWeeks,
        p_buddy_email: buddyEmail || null,
        p_buddy_relationship: buddyEmail ? 'friend' : null,
      })

      if (rpcError) {
        throw rpcError
      }

      router.push(`/bets/${data}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bet')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Create New Bet</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Habit Description */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What habit will you commit to?
            </label>
            <textarea
              value={habitDescription}
              onChange={(e) => setHabitDescription(e.target.value)}
              placeholder="e.g., Go to the gym 3 times per week"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              rows={3}
              required
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-2">
              Be specific! The clearer your goal, the better you can track it.
            </p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    category === cat.value
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="font-medium text-gray-900">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Duration: {durationWeeks} weeks
            </label>
            <input
              type="range"
              min={2}
              max={12}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>2 weeks</span>
              <span>12 weeks</span>
            </div>
          </div>

          {/* Stake Amount */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Stake: {stakeAmount} GC
            </label>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>10 GC</span>
              <span>500 GC</span>
            </div>
          </div>

          {/* Buddy Email (Optional) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accountability Buddy (optional)
            </label>
            <input
              type="email"
              value={buddyEmail}
              onChange={(e) => setBuddyEmail(e.target.value)}
              placeholder="buddy@email.com"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              They&apos;ll get notified of your check-ins to keep you accountable.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Your Bet Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Your stake:</span>
                <span className="font-bold">{stakeAmount} GC</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-bold">{durationWeeks} weeks</span>
              </div>
              <div className="border-t border-amber-400/50 pt-2 mt-2">
                <div className="flex justify-between text-lg">
                  <span>Potential win:</span>
                  <span className="font-bold">{potentialWin} GC</span>
                </div>
                <p className="text-sm text-amber-100 mt-1">
                  ({durationWeeks}x multiplier)
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !habitDescription.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Place Bet'}
          </button>
        </form>
      </main>
    </div>
  )
}
