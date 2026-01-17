import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This route should be called daily by Vercel Cron
// vercel.json config: { "crons": [{ "path": "/api/cron/check-bets", "schedule": "0 0 * * *" }] }

interface ActiveBet {
  id: string
  current_week: number
  started_at: string
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get all active bets
    const { data: activeBets, error: betsError } = await supabase
      .from('bets')
      .select('id, current_week, started_at')
      .eq('status', 'active')
      .returns<ActiveBet[]>()

    if (betsError) {
      throw betsError
    }

    if (!activeBets || activeBets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active bets found',
      })
    }

    let lostCount = 0

    for (const bet of activeBets) {
      // Calculate when the current week started
      const betStart = new Date(bet.started_at)
      const currentWeekStart = new Date(betStart)
      currentWeekStart.setDate(betStart.getDate() + (bet.current_week - 1) * 7)

      // Calculate deadline (7 days after week start)
      const deadline = new Date(currentWeekStart)
      deadline.setDate(deadline.getDate() + 7)

      // Check if deadline has passed
      if (new Date() > deadline) {
        // Check if the current week's checkin is incomplete
        const { data: checkin } = await supabase
          .from('checkins')
          .select('completed')
          .eq('bet_id', bet.id)
          .eq('week_number', bet.current_week)
          .single()

        if (checkin && !checkin.completed) {
          // Mark bet as lost
          const { error: lossError } = await supabase.rpc('resolve_bet_loss', {
            p_bet_id: bet.id,
          })

          if (!lossError) {
            lostCount++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${activeBets.length} active bets, ${lostCount} marked as lost`,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process bets' },
      { status: 500 }
    )
  }
}
