import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎯</span>
          <span className="font-bold text-xl text-gray-900">Bet On Yourself</span>
        </div>
        <Link
          href="/login"
          className="px-6 py-2 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors"
        >
          Get Started
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Stake Gold on Your Habits.<br />
            <span className="text-amber-600">Win When You Follow Through.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            A commitment device that turns your goals into bets. Put your Gold Coins where your mouth is.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-amber-500 text-white text-lg rounded-full font-semibold hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
          >
            Start with 1,000 Free Coins
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stake Your Coins</h3>
            <p className="text-gray-600">
              Bet 10-500 Gold Coins on completing a weekly habit for 2-12 weeks.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check In Weekly</h3>
            <p className="text-gray-600">
              Confirm you completed your habit each week. Miss a check-in and lose your stake.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Win Big</h3>
            <p className="text-gray-600">
              Complete all weeks and get your stake multiplied by the number of weeks!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How Winnings Work</h2>
          <div className="flex items-center justify-center gap-4 text-lg">
            <div className="bg-amber-100 px-4 py-2 rounded-lg">
              <span className="font-semibold">100 GC</span>
              <span className="text-gray-600"> stake</span>
            </div>
            <span className="text-2xl">×</span>
            <div className="bg-amber-100 px-4 py-2 rounded-lg">
              <span className="font-semibold">4</span>
              <span className="text-gray-600"> weeks</span>
            </div>
            <span className="text-2xl">=</span>
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <span className="font-semibold text-green-700">400 GC</span>
              <span className="text-gray-600"> payout!</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-gray-500">
        <p>Commit. Check-in. Collect.</p>
      </footer>
    </div>
  )
}
