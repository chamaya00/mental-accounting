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
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="text-7xl mb-6">🎯</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bet On Yourself
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stake Gold Coins on your habits. Build streaks. Win rewards.
            The only bet where you always win by following through.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-4 rounded-xl text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🪙</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stake Your Coins</h3>
            <p className="text-gray-600">
              Put your Gold Coins where your mouth is. Stake 10-500 GC on a habit commitment.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check In Weekly</h3>
            <p className="text-gray-600">
              Complete your habit each week and check in. Build your streak from 2-12 weeks.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Win Big</h3>
            <p className="text-gray-600">
              Complete your bet and win stake × weeks. A 100 GC, 4-week bet pays 400 GC!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Sign Up & Get 1,000 GC</h3>
                <p className="text-gray-600">Start with 1,000 Gold Coins. Earn 200 more daily just by logging in.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Create a Bet</h3>
                <p className="text-gray-600">Choose a habit, set your stakes (10-500 GC), and commit to 2-12 weeks.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stay Accountable</h3>
                <p className="text-gray-600">Check in weekly to mark your progress. Add a buddy for extra motivation.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Collect Your Winnings</h3>
                <p className="text-gray-600">Complete all weeks and multiply your stake. Build better habits, earn rewards.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">Ready to bet on yourself?</p>
          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-4 rounded-xl text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
          >
            Start Now
          </Link>
        </div>
      </div>
    </div>
  )
}
