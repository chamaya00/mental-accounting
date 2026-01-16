'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBet } from '../actions'

const CATEGORIES = [
  { value: 'health', label: 'Health & Fitness', emoji: '💪' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'financial', label: 'Financial', emoji: '💰' },
  { value: 'other', label: 'Other', emoji: '✨' },
]

const BUDDY_RELATIONSHIPS = [
  { value: 'friend', label: 'Friend' },
  { value: 'family', label: 'Family' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'coach', label: 'Coach' },
]

interface CreateBetFormProps {
  balance: number
}

export function CreateBetForm({ balance }: CreateBetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBuddyFields, setShowBuddyFields] = useState(false)

  // Form state for preview
  const [stakeAmount, setStakeAmount] = useState(50)
  const [durationWeeks, setDurationWeeks] = useState(4)

  const potentialPayout = stakeAmount * durationWeeks

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createBet(formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      router.push(`/bets/${result.betId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Habit Description */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What habit will you commit to?
        </label>
        <input
          type="text"
          name="habit_description"
          required
          placeholder="e.g., Go to the gym 3x per week"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          maxLength={200}
        />
        <p className="mt-2 text-sm text-gray-500">
          Be specific about what you&apos;ll do each week
        </p>
      </div>

      {/* Category */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className="relative flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-amber-300 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50"
            >
              <input
                type="radio"
                name="category"
                value={cat.value}
                defaultChecked={cat.value === 'health'}
                className="sr-only"
              />
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Duration: {durationWeeks} weeks
        </label>
        <input
          type="range"
          name="duration_weeks"
          min="2"
          max="12"
          value={durationWeeks}
          onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>2 weeks</span>
          <span>12 weeks</span>
        </div>
      </div>

      {/* Stake Amount */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Stake Amount: {stakeAmount} GC
        </label>
        <input
          type="range"
          name="stake_amount"
          min="10"
          max={Math.min(500, balance)}
          step="10"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>10 GC</span>
          <span>Max: {Math.min(500, balance)} GC</span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Your balance: <span className="font-semibold text-amber-600">{balance} GC</span>
        </p>
      </div>

      {/* Payout Preview */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="text-center">
          <div className="text-sm text-green-700 mb-1">If you complete all {durationWeeks} weeks:</div>
          <div className="text-3xl font-bold text-green-600">
            +{potentialPayout} GC
          </div>
          <div className="text-sm text-green-600 mt-1">
            ({stakeAmount} GC × {durationWeeks} weeks = {potentialPayout} GC payout)
          </div>
        </div>
      </div>

      {/* Accountability Buddy (Optional) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Accountability Buddy (Optional)
            </label>
            <p className="text-sm text-gray-500">Someone to notify about your progress</p>
          </div>
          <button
            type="button"
            onClick={() => setShowBuddyFields(!showBuddyFields)}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            {showBuddyFields ? 'Remove' : 'Add buddy'}
          </button>
        </div>

        {showBuddyFields && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                name="buddy_email"
                placeholder="buddy@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Relationship</label>
              <select
                name="buddy_relationship"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              >
                <option value="">Select...</option>
                {BUDDY_RELATIONSHIPS.map((rel) => (
                  <option key={rel.value} value={rel.value}>
                    {rel.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || balance < 10}
        className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating Bet...' : `Stake ${stakeAmount} GC & Start Bet`}
      </button>

      {balance < 10 && (
        <p className="text-center text-red-500 text-sm">
          You need at least 10 GC to create a bet.
        </p>
      )}
    </form>
  )
}
