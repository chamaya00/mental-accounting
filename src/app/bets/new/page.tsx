import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { CreateBetForm } from './CreateBetForm'
import type { Profile, Avatar } from '@/types/database'

export default async function NewBetPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch profile with active avatar
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as Profile | null

  // Fetch active avatar details
  let avatar: Avatar | null = null
  if (profile && profile.active_avatar_id) {
    const { data: avatarData } = await supabase
      .from('avatars')
      .select('*')
      .eq('id', profile.active_avatar_id)
      .single()
    avatar = avatarData as Avatar | null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} avatar={avatar} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a New Bet</h1>
          <p className="text-gray-600">
            Commit to a weekly habit and stake your Gold Coins. Complete all weeks to win big!
          </p>
        </div>

        <CreateBetForm balance={profile?.balance ?? 0} />
      </main>
    </div>
  )
}
