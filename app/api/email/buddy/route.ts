import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables are not configured')
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 503 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { betId, userId } = await request.json()

    if (!betId || !userId) {
      return NextResponse.json(
        { error: 'Missing betId or userId' },
        { status: 400 }
      )
    }

    // Fetch the bet with user profile
    const { data: bet, error: betError } = await supabaseAdmin
      .from('bets')
      .select('*, profiles(*)')
      .eq('id', betId)
      .single()

    if (betError || !bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      )
    }

    // Check if bet belongs to the user
    if (bet.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if buddy email exists
    if (!bet.buddy_email) {
      return NextResponse.json(
        { error: 'No buddy email configured for this bet' },
        { status: 400 }
      )
    }

    const userName = bet.profiles?.display_name ?? 'Your friend'
    const buddyRelationship = bet.buddy_relationship ?? 'friend'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://betonyou.app'

    // Create the email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check-in Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 32px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 8px;">🎯</div>
      <h1 style="color: white; margin: 0; font-size: 24px;">Check-in Update!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hey there! Great news from your ${buddyRelationship}:
      </p>

      <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
          ${userName} just checked in!
        </p>
        <p style="color: #78350f; font-size: 14px; margin: 0 0 12px 0;">
          <strong>Habit:</strong> ${bet.habit_description}
        </p>
        <p style="color: #78350f; font-size: 14px; margin: 0;">
          <strong>Progress:</strong> Week ${bet.current_week} of ${bet.duration_weeks}
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Your accountability matters! A quick message of encouragement can make all the difference in helping ${userName} reach their goal.
      </p>

      <!-- Progress Bar -->
      <div style="background-color: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden; margin-bottom: 8px;">
        <div style="background: linear-gradient(90deg, #f59e0b, #f97316); height: 100%; width: ${Math.round(((bet.current_week - 1) / bet.duration_weeks) * 100)}%; border-radius: 9999px;"></div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 24px 0;">
        ${bet.current_week - 1} of ${bet.duration_weeks} weeks completed
      </p>

      <div style="text-align: center;">
        <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #f97316); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View on Bet On Yourself
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        You're receiving this because ${userName} added you as their accountability buddy on Bet On Yourself.
      </p>
    </div>
  </div>
</body>
</html>
`

    // Send the email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Bet On Yourself <notifications@betonyou.app>',
      to: bet.buddy_email,
      subject: `${userName} just checked in on their habit!`,
      html: emailHtml,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: emailData?.id })
  } catch (error) {
    console.error('Error sending buddy email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
