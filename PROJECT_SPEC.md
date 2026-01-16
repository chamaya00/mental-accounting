# Bet On Yourself - Project Specification

## Overview

A commitment device app where users stake digital currency ("Gold Coins") on habit streaks. Social proof mechanics and avatar rewards create meaning for the digital economy. Users bet on themselves to complete weekly habits, and can support others' bets for shared rewards.

## Core Mechanics

### Currency: Gold Coins (GC)

- Starting balance: 1,000 GC on signup
- Daily login bonus: 200 GC
- Earning: Win bets (stake × weeks multiplier)
- Spending: Stake on bets, buy avatars/collectibles
- Supporting others: Stake on others' bets (same multiplier payout)

### Bet System

- User stakes GC on a habit commitment
- Format: "Do X every week for Y weeks" (minimum 2 weeks, max 12)
- Weekly check-in required to confirm completion
- Win: Get stake × weeks returned (e.g., 100 GC × 4 weeks = 400 GC)
- Lose: Miss a weekly check-in, lose stake
- Others can "support" a bet by staking their own GC (same multiplier)

### Social Features

- Public wall showing signups, new bets, wins, losses
- Support window: Can only support bets less than 2 weeks old
- Optional accountability buddy via email notifications
- Profile displays avatar + collectibles

-----

## Technical Stack

```
Framework:  Next.js 14+ (App Router)
Database:   Supabase Postgres
Auth:       Supabase Auth
Hosting:    Vercel
Email:      Resend
Push:       Firebase Cloud Messaging (future)
```

### Auth Providers (Supabase)

1. Google - primary, highest conversion
1. Apple - required for iOS
1. Discord - young demo, no app review
1. Twitter/X - viral sharing potential

-----

## Database Schema

```sql
-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users primary key,
  display_name text,
  avatar_url text,
  balance integer default 1000 not null,
  active_avatar_id integer references public.avatars,
  timezone text default 'UTC',
  last_login_bonus_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- ============================================
-- BETS
-- ============================================
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  habit_description text not null,
  category text check (category in ('health', 'learning', 'creative', 'social', 'financial', 'other')),
  stake_amount integer not null check (stake_amount >= 10 and stake_amount <= 500),
  duration_weeks integer not null check (duration_weeks >= 2 and duration_weeks <= 12),
  current_week integer default 1,
  status text default 'active' check (status in ('active', 'won', 'lost')),
  buddy_email text,
  buddy_relationship text check (buddy_relationship in ('friend', 'family', 'coworker', 'coach')),
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index bets_user_id_idx on public.bets(user_id);
create index bets_status_idx on public.bets(status);
create index bets_created_at_idx on public.bets(created_at desc);

-- ============================================
-- CHECK-INS
-- ============================================
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid references public.bets on delete cascade not null,
  week_number integer not null,
  completed boolean default false,
  checked_in_at timestamp with time zone,
  buddy_notified boolean default false,
  created_at timestamp with time zone default now(),
  unique(bet_id, week_number)
);

create index checkins_bet_id_idx on public.checkins(bet_id);

-- ============================================
-- SUPPORTS (others staking on your bet)
-- ============================================
create table public.supports (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid references public.bets on delete cascade not null,
  supporter_id uuid references public.profiles not null,
  stake_amount integer not null check (stake_amount >= 10),
  payout_amount integer, -- null until bet resolves
  created_at timestamp with time zone default now(),
  unique(bet_id, supporter_id)
);

create index supports_bet_id_idx on public.supports(bet_id);
create index supports_supporter_id_idx on public.supports(supporter_id);

-- ============================================
-- AVATARS
-- ============================================
create table public.avatars (
  id serial primary key,
  emoji text not null,
  name text not null,
  category text not null check (category in ('starter', 'motivator', 'legend', 'premium')),
  price integer not null default 0,
  personality_voice text, -- e.g., "calm and zen-like", "high energy coach"
  is_premium boolean default false, -- premium avatars use on-device LLM
  encouragement_messages text[], -- canned messages for non-premium
  created_at timestamp with time zone default now()
);

-- Seed starter avatars (free, canned messages)
insert into public.avatars (emoji, name, category, price, personality_voice, is_premium, encouragement_messages) values
  ('🐙', 'Cosmo', 'starter', 0, 'calm and zen-like', false,
   array['One tentacle at a time.', 'Slow and steady wins the race.', 'You are doing great, keep flowing.', 'Breathe. Focus. Achieve.', 'The ocean rewards patience.']),
  ('🦊', 'Felix', 'starter', 0, 'clever and encouraging', false,
   array['Clever moves win the game!', 'Outsmart yesterday''s you.', 'Quick thinking, strong doing.', 'You''ve got the smarts for this.', 'Stay sharp, stay winning.']),
  ('🐻', 'Bruno', 'starter', 0, 'warm and supportive', false,
   array['Big bear hug energy for you!', 'You''re stronger than you know.', 'Keep going, I believe in you.', 'Cozy up to your goals.', 'Hibernate later, hustle now.']),
  ('🐱', 'Mochi', 'starter', 0, 'playful and cute', false,
   array['Purrfect effort today!', 'You''re the cat''s meow!', 'Land on your feet, always.', 'Curiosity leads to success.', 'Nine lives worth of tries!']);

-- Seed motivator avatars (paid, canned messages)
insert into public.avatars (emoji, name, category, price, personality_voice, is_premium, encouragement_messages) values
  ('🦁', 'Coach Leo', 'motivator', 200, 'high energy coach', false,
   array['Champions show up EVERY day!', 'No excuses, only results!', 'You were BORN for this!', 'Leave it all on the field!', 'ROAR your way to victory!']),
  ('🦉', 'Wise Owl', 'motivator', 200, 'thoughtful and wise', false,
   array['Progress, not perfection.', 'Wisdom is doing it anyway.', 'The night is darkest before dawn.', 'Knowledge without action is nothing.', 'Patience is a superpower.']),
  ('🐕', 'Buddy', 'motivator', 200, 'loyal and enthusiastic', false,
   array['You got this, best friend!', 'I''ll never stop believing in you!', 'Tail wagging for your success!', 'Fetch those goals!', 'Good human, GREAT effort!']),
  ('🦋', 'Grace', 'motivator', 200, 'transformative and uplifting', false,
   array['Transform and rise.', 'Your wings are ready.', 'Beauty comes from struggle.', 'Emerge stronger today.', 'Float above the doubts.']);

-- Seed legend avatars (expensive, canned messages)
insert into public.avatars (emoji, name, category, price, personality_voice, is_premium, encouragement_messages) values
  ('🐉', 'Dragon', 'legend', 500, 'epic and powerful', false,
   array['You are UNSTOPPABLE.', 'Forged in fire, ready for anything.', 'Breathe fire on your doubts.', 'Legends are made, not born.', 'Rule your kingdom.']),
  ('🦅', 'Phoenix', 'legend', 500, 'resilient and inspiring', false,
   array['Rise from the ashes.', 'Every setback is a setup.', 'Born to soar again.', 'The fire only makes you stronger.', 'Rebirth is your superpower.']),
  ('🐺', 'Alpha', 'legend', 500, 'leader and determined', false,
   array['Lead the pack.', 'Lone wolves don''t win—you do.', 'Hunt your goals relentlessly.', 'The pack follows strength.', 'Howl at your victories.']),
  ('🦄', 'Mystic', 'legend', 500, 'magical and believing', false,
   array['Believe in the impossible.', 'Magic is just effort in disguise.', 'Your dreams are valid.', 'Sparkle through the struggle.', 'Rare and unstoppable—that''s you.']);

-- Premium avatars (use on-device LLM for custom messages)
insert into public.avatars (emoji, name, category, price, personality_voice, is_premium, encouragement_messages) values
  ('🧙', 'Sage', 'premium', 1000, 'You are Sage, a wise and mystical mentor who speaks in thoughtful metaphors. You reference the user''s specific habit and progress. Keep messages under 20 words. Be profound but warm.', true, null),
  ('🤖', 'Axiom', 'premium', 1000, 'You are Axiom, a friendly AI companion who is analytical but encouraging. Reference the user''s streak data and statistics. Keep messages under 20 words. Be logical but supportive.', true, null),
  ('👑', 'Royal', 'premium', 2000, 'You are Royal, a regal and dignified monarch who treats the user as worthy of greatness. Reference their specific commitment. Keep messages under 20 words. Be noble and inspiring.', true, null),
  ('🌟', 'Nova', 'premium', 2000, 'You are Nova, a cosmic being of pure energy and optimism. Reference the user''s habit and frame it as part of their larger journey. Keep messages under 20 words. Be cosmic and uplifting.', true, null);

-- ============================================
-- USER AVATARS (owned)
-- ============================================
create table public.user_avatars (
  user_id uuid references public.profiles on delete cascade,
  avatar_id integer references public.avatars on delete cascade,
  acquired_at timestamp with time zone default now(),
  primary key (user_id, avatar_id)
);

-- ============================================
-- COLLECTIBLES (accessories, vehicles, properties)
-- ============================================
create table public.collectibles (
  id serial primary key,
  emoji text not null,
  name text not null,
  tier text not null check (tier in ('accessory', 'vehicle', 'property')),
  price integer not null,
  created_at timestamp with time zone default now()
);

-- Seed collectibles
insert into public.collectibles (emoji, name, tier, price) values
  -- Accessories (50-300 GC)
  ('🎩', 'Top Hat', 'accessory', 100),
  ('🕶️', 'Cool Shades', 'accessory', 75),
  ('🎀', 'Fancy Bow', 'accessory', 50),
  ('🏅', 'Gold Medal', 'accessory', 150),
  ('⚡', 'Lightning Bolt', 'accessory', 200),
  ('🌟', 'Halo', 'accessory', 300),
  ('👑', 'Crown', 'accessory', 250),
  ('🎧', 'Headphones', 'accessory', 125),
  -- Vehicles (500-2000 GC)
  ('🚗', 'Sports Car', 'vehicle', 500),
  ('🏍️', 'Motorcycle', 'vehicle', 600),
  ('🛥️', 'Yacht', 'vehicle', 1500),
  ('🚁', 'Helicopter', 'vehicle', 2000),
  ('🏎️', 'Race Car', 'vehicle', 1200),
  ('🛵', 'Scooter', 'vehicle', 400),
  -- Properties (5000+ GC)
  ('🏠', 'Beach House', 'property', 5000),
  ('🏰', 'Castle', 'property', 10000),
  ('🏝️', 'Private Island', 'property', 20000),
  ('🌆', 'Penthouse', 'property', 8000),
  ('🏔️', 'Mountain Lodge', 'property', 6000);

-- ============================================
-- USER COLLECTIBLES (owned)
-- ============================================
create table public.user_collectibles (
  user_id uuid references public.profiles on delete cascade,
  collectible_id integer references public.collectibles on delete cascade,
  acquired_at timestamp with time zone default now(),
  primary key (user_id, collectible_id)
);

-- ============================================
-- WALL EVENTS (denormalized for fast reads)
-- ============================================
create table public.wall_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('signup', 'bet_created', 'bet_won', 'bet_lost', 'milestone')),
  user_id uuid references public.profiles on delete cascade,
  bet_id uuid references public.bets on delete cascade,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

create index wall_events_created_at_idx on public.wall_events(created_at desc);
create index wall_events_event_type_idx on public.wall_events(event_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.bets enable row level security;
alter table public.checkins enable row level security;
alter table public.supports enable row level security;
alter table public.avatars enable row level security;
alter table public.user_avatars enable row level security;
alter table public.collectibles enable row level security;
alter table public.user_collectibles enable row level security;
alter table public.wall_events enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Bets: everyone can read, users can create/update own
create policy "Bets are viewable by everyone" on public.bets for select using (true);
create policy "Users can create own bets" on public.bets for insert with check (auth.uid() = user_id);
create policy "Users can update own bets" on public.bets for update using (auth.uid() = user_id);

-- Checkins: everyone can read, users can manage for own bets
create policy "Checkins are viewable by everyone" on public.checkins for select using (true);
create policy "Users can create checkins for own bets" on public.checkins for insert
  with check (exists (select 1 from public.bets where id = bet_id and user_id = auth.uid()));
create policy "Users can update checkins for own bets" on public.checkins for update
  using (exists (select 1 from public.bets where id = bet_id and user_id = auth.uid()));

-- Supports: everyone can read, users can create own
create policy "Supports are viewable by everyone" on public.supports for select using (true);
create policy "Users can create own supports" on public.supports for insert with check (auth.uid() = supporter_id);

-- Avatars & Collectibles: everyone can read (catalog)
create policy "Avatars are viewable by everyone" on public.avatars for select using (true);
create policy "Collectibles are viewable by everyone" on public.collectibles for select using (true);

-- User avatars/collectibles: everyone can read, users can manage own
create policy "User avatars are viewable by everyone" on public.user_avatars for select using (true);
create policy "Users can manage own avatars" on public.user_avatars for insert with check (auth.uid() = user_id);
create policy "User collectibles are viewable by everyone" on public.user_collectibles for select using (true);
create policy "Users can manage own collectibles" on public.user_collectibles for insert with check (auth.uid() = user_id);

-- Wall events: everyone can read
create policy "Wall events are viewable by everyone" on public.wall_events for select using (true);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Give user a random starter avatar
  insert into public.user_avatars (user_id, avatar_id)
  select new.id, id from public.avatars where category = 'starter' order by random() limit 1;

  -- Set active avatar to the one they just got
  update public.profiles set active_avatar_id = (
    select avatar_id from public.user_avatars where user_id = new.id limit 1
  ) where id = new.id;

  -- Post signup event to wall
  insert into public.wall_events (event_type, user_id, metadata)
  values ('signup', new.id, jsonb_build_object(
    'provider', new.raw_app_meta_data->>'provider'
  ));

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Claim daily login bonus
create or replace function public.claim_login_bonus()
returns integer as $$
declare
  user_profile record;
  bonus_amount integer := 200;
begin
  select * into user_profile from public.profiles where id = auth.uid();

  -- Check if already claimed today
  if user_profile.last_login_bonus_at is not null
     and user_profile.last_login_bonus_at::date = current_date then
    return 0; -- Already claimed
  end if;

  -- Grant bonus
  update public.profiles
  set balance = balance + bonus_amount,
      last_login_bonus_at = now()
  where id = auth.uid();

  return bonus_amount;
end;
$$ language plpgsql security definer;

-- Create a new bet
create or replace function public.create_bet(
  p_habit_description text,
  p_category text,
  p_stake_amount integer,
  p_duration_weeks integer,
  p_buddy_email text default null,
  p_buddy_relationship text default null
)
returns uuid as $$
declare
  new_bet_id uuid;
  user_balance integer;
begin
  -- Check balance
  select balance into user_balance from public.profiles where id = auth.uid();
  if user_balance < p_stake_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct stake
  update public.profiles set balance = balance - p_stake_amount where id = auth.uid();

  -- Create bet
  insert into public.bets (user_id, habit_description, category, stake_amount, duration_weeks, buddy_email, buddy_relationship)
  values (auth.uid(), p_habit_description, p_category, p_stake_amount, p_duration_weeks, p_buddy_email, p_buddy_relationship)
  returning id into new_bet_id;

  -- Create first week's checkin record
  insert into public.checkins (bet_id, week_number) values (new_bet_id, 1);

  -- Post to wall
  insert into public.wall_events (event_type, user_id, bet_id, metadata)
  values ('bet_created', auth.uid(), new_bet_id, jsonb_build_object(
    'habit', p_habit_description,
    'weeks', p_duration_weeks,
    'stake', p_stake_amount
  ));

  return new_bet_id;
end;
$$ language plpgsql security definer;

-- Support someone's bet
create or replace function public.support_bet(
  p_bet_id uuid,
  p_stake_amount integer
)
returns uuid as $$
declare
  new_support_id uuid;
  user_balance integer;
  bet_record record;
begin
  -- Get bet info
  select * into bet_record from public.bets where id = p_bet_id;

  -- Validate bet is supportable (active, less than 2 weeks old)
  if bet_record.status != 'active' then
    raise exception 'Bet is not active';
  end if;
  if bet_record.created_at < now() - interval '14 days' then
    raise exception 'Bet is too old to support';
  end if;
  if bet_record.user_id = auth.uid() then
    raise exception 'Cannot support your own bet';
  end if;

  -- Check balance
  select balance into user_balance from public.profiles where id = auth.uid();
  if user_balance < p_stake_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct stake
  update public.profiles set balance = balance - p_stake_amount where id = auth.uid();

  -- Create support
  insert into public.supports (bet_id, supporter_id, stake_amount)
  values (p_bet_id, auth.uid(), p_stake_amount)
  returning id into new_support_id;

  return new_support_id;
end;
$$ language plpgsql security definer;

-- Check in for a week
create or replace function public.checkin_week(
  p_bet_id uuid,
  p_notify_buddy boolean default false
)
returns boolean as $$
declare
  bet_record record;
  checkin_record record;
begin
  -- Get bet
  select * into bet_record from public.bets where id = p_bet_id and user_id = auth.uid();
  if not found then
    raise exception 'Bet not found or not owned by user';
  end if;
  if bet_record.status != 'active' then
    raise exception 'Bet is not active';
  end if;

  -- Mark checkin complete
  update public.checkins
  set completed = true, checked_in_at = now(), buddy_notified = p_notify_buddy
  where bet_id = p_bet_id and week_number = bet_record.current_week;

  -- Check if this was the final week
  if bet_record.current_week >= bet_record.duration_weeks then
    -- BET WON!
    perform public.resolve_bet_win(p_bet_id);
  else
    -- Advance to next week
    update public.bets set current_week = current_week + 1 where id = p_bet_id;
    -- Create next week's checkin record
    insert into public.checkins (bet_id, week_number) values (p_bet_id, bet_record.current_week + 1);
  end if;

  return true;
end;
$$ language plpgsql security definer;

-- Resolve bet as win (internal function)
create or replace function public.resolve_bet_win(p_bet_id uuid)
returns void as $$
declare
  bet_record record;
  support_record record;
  payout integer;
begin
  select * into bet_record from public.bets where id = p_bet_id;
  payout := bet_record.stake_amount * bet_record.duration_weeks;

  -- Pay the bet creator
  update public.profiles set balance = balance + payout where id = bet_record.user_id;

  -- Pay all supporters
  for support_record in select * from public.supports where bet_id = p_bet_id loop
    update public.supports
    set payout_amount = support_record.stake_amount * bet_record.duration_weeks
    where id = support_record.id;

    update public.profiles
    set balance = balance + (support_record.stake_amount * bet_record.duration_weeks)
    where id = support_record.supporter_id;
  end loop;

  -- Mark bet as won
  update public.bets set status = 'won', completed_at = now() where id = p_bet_id;

  -- Post to wall
  insert into public.wall_events (event_type, user_id, bet_id, metadata)
  values ('bet_won', bet_record.user_id, p_bet_id, jsonb_build_object(
    'habit', bet_record.habit_description,
    'weeks', bet_record.duration_weeks,
    'payout', payout,
    'supporters', (select count(*) from public.supports where bet_id = p_bet_id)
  ));
end;
$$ language plpgsql security definer;

-- Resolve bet as loss (called by cron or manually)
create or replace function public.resolve_bet_loss(p_bet_id uuid)
returns void as $$
declare
  bet_record record;
begin
  select * into bet_record from public.bets where id = p_bet_id;

  -- Mark bet as lost (stakes already deducted at bet creation)
  update public.bets set status = 'lost', completed_at = now() where id = p_bet_id;

  -- Mark supporters as lost (payout = 0)
  update public.supports set payout_amount = 0 where bet_id = p_bet_id;

  -- Post to wall
  insert into public.wall_events (event_type, user_id, bet_id, metadata)
  values ('bet_lost', bet_record.user_id, p_bet_id, jsonb_build_object(
    'habit', bet_record.habit_description,
    'weeks', bet_record.duration_weeks,
    'failed_at_week', bet_record.current_week,
    'lost', bet_record.stake_amount,
    'supporters', (select count(*) from public.supports where bet_id = p_bet_id)
  ));
end;
$$ language plpgsql security definer;

-- Purchase avatar
create or replace function public.purchase_avatar(p_avatar_id integer)
returns boolean as $$
declare
  avatar_price integer;
  user_balance integer;
begin
  -- Check if already owned
  if exists (select 1 from public.user_avatars where user_id = auth.uid() and avatar_id = p_avatar_id) then
    raise exception 'Avatar already owned';
  end if;

  -- Get price
  select price into avatar_price from public.avatars where id = p_avatar_id;
  if not found then
    raise exception 'Avatar not found';
  end if;

  -- Check balance
  select balance into user_balance from public.profiles where id = auth.uid();
  if user_balance < avatar_price then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct and grant
  update public.profiles set balance = balance - avatar_price where id = auth.uid();
  insert into public.user_avatars (user_id, avatar_id) values (auth.uid(), p_avatar_id);

  return true;
end;
$$ language plpgsql security definer;

-- Purchase collectible
create or replace function public.purchase_collectible(p_collectible_id integer)
returns boolean as $$
declare
  collectible_price integer;
  user_balance integer;
begin
  -- Check if already owned
  if exists (select 1 from public.user_collectibles where user_id = auth.uid() and collectible_id = p_collectible_id) then
    raise exception 'Collectible already owned';
  end if;

  -- Get price
  select price into collectible_price from public.collectibles where id = p_collectible_id;
  if not found then
    raise exception 'Collectible not found';
  end if;

  -- Check balance
  select balance into user_balance from public.profiles where id = auth.uid();
  if user_balance < collectible_price then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct and grant
  update public.profiles set balance = balance - collectible_price where id = auth.uid();
  insert into public.user_collectibles (user_id, collectible_id) values (auth.uid(), p_collectible_id);

  return true;
end;
$$ language plpgsql security definer;

-- Set active avatar
create or replace function public.set_active_avatar(p_avatar_id integer)
returns boolean as $$
begin
  -- Check ownership
  if not exists (select 1 from public.user_avatars where user_id = auth.uid() and avatar_id = p_avatar_id) then
    raise exception 'Avatar not owned';
  end if;

  update public.profiles set active_avatar_id = p_avatar_id where id = auth.uid();
  return true;
end;
$$ language plpgsql security definer;
```

-----

## User Flows

### Flow 1: Signup

1. User lands on app, sees auth options: Google / Apple / Discord / Twitter / Email
1. On successful auth, `handle_new_user` trigger fires:
- Creates profile with 1,000 GC
- Assigns random starter avatar
- Posts "signup" event to wall
1. User lands on dashboard

### Flow 2: Create Bet

1. User taps "+ New Bet"
1. Enters habit description (e.g., "Go to gym 3x per week")
1. Selects category (health/learning/creative/social/financial/other)
1. Sets duration (2-12 weeks)
1. Sets stake (10-500 GC)
1. Optionally adds accountability buddy email
1. Confirms → `create_bet()` function:
- Deducts stake from balance
- Creates bet + first week's checkin
- Posts to wall
1. User sees bet in "My Bets" as active

### Flow 3: Weekly Check-in

1. User opens app (or gets push notification)
1. Goes to active bet
1. Taps "Yes, I did it" → `checkin_week()` function:
- Marks week complete
- If final week: triggers `resolve_bet_win()`
- Otherwise: advances to next week
1. Optional: sends email to buddy

### Flow 4: Miss Check-in (Cron Job)

1. Daily cron runs at midnight
1. Finds bets where current week's checkin is uncompleted and >7 days old
1. Calls `resolve_bet_loss()` for each
1. Posts loss to wall

### Flow 5: Support a Bet

1. User browses wall, sees new bet (<2 weeks old)
1. Enters support amount
1. Taps "Support" → `support_bet()` function:
- Validates bet is supportable
- Deducts stake from supporter's balance
- Creates support record
1. If bet wins: supporter gets stake × weeks
1. If bet loses: supporter loses stake

### Flow 6: Avatar Mall

1. User browses avatar catalog
1. Sees owned vs available avatars
1. Taps to purchase → `purchase_avatar()` function
1. Taps to equip → `set_active_avatar()` function

### Flow 7: Avatar Encouragement Messages

1. **Basic avatars (non-premium)**:
- Select random message from `encouragement_messages` array in DB
- Display in check-in screen, win/loss screens, notifications
1. **Premium avatars (is_premium = true)**:
- Call on-device LLM (e.g., Apple Intelligence, Chrome built-in AI)
- Pass system prompt from `personality_voice` column
- Include context: habit description, current week, total weeks, streak status
- Generate personalized message under 20 words

-----

## Premium Avatar LLM Integration (Post-MVP)

### On-Device LLM Options

1. **Apple Intelligence** (iOS 18+) - Private, on-device
1. **Chrome Built-in AI** (Chrome 127+) - Web, on-device
1. **Fallback**: Use canned messages if no on-device LLM available

### Prompt Structure for Premium Avatars

```javascript
const generatePremiumMessage = async (avatar, betContext) => {
  const systemPrompt = avatar.personality_voice;
  // e.g., "You are Sage, a wise and mystical mentor who speaks in thoughtful metaphors..."

  const userPrompt = `
    User's habit: "${betContext.habit}"
    Current progress: Week ${betContext.currentWeek} of ${betContext.totalWeeks}
    Status: ${betContext.justCheckedIn ? 'Just completed a check-in' : 'Viewing their bet'}

    Generate one short encouragement message (under 20 words).
  `;

  // Try on-device LLM
  if (window.ai?.languageModel) {
    // Chrome Built-in AI
    const session = await window.ai.languageModel.create({ systemPrompt });
    return await session.prompt(userPrompt);
  } else if (window.AppleIntelligence) {
    // Apple Intelligence (hypothetical API)
    return await window.AppleIntelligence.generate(systemPrompt, userPrompt);
  } else {
    // Fallback to random canned message from any non-premium avatar
    return getRandomCannedMessage();
  }
};
```

-----

## API Routes (Next.js App Router)

```
/api/auth/callback     - Supabase OAuth callback
/api/cron/check-bets   - Daily cron to resolve missed check-ins (Vercel Cron)
/api/email/buddy       - Send buddy notification email (Resend)
```

-----

## MVP Phases

### Phase 1: Core Loop

- [ ] Supabase project + run schema SQL
- [ ] Next.js project with Supabase client
- [ ] Google OAuth only
- [ ] Dashboard showing balance
- [ ] Create bet flow
- [ ] Weekly check-in flow
- [ ] Win/loss resolution
- [ ] Basic "My Bets" page

### Phase 2: Social

- [ ] Public wall feed (realtime with Supabase)
- [ ] Support others' bets
- [ ] Add Apple, Discord, Twitter auth
- [ ] Buddy email notifications (Resend)

### Phase 3: Retention

- [ ] Daily login bonus
- [ ] Avatar mall (starter + motivator + legend)
- [ ] Canned encouragement messages
- [ ] Collectibles mall
- [ ] Profile page showing owned items

### Phase 4: Premium Avatars (Post-MVP)

- [ ] On-device LLM integration
- [ ] Premium avatar purchases
- [ ] Dynamic encouragement messages
- [ ] Fallback handling for unsupported devices

### Phase 5: Growth (Post-MVP)

- [ ] Push notifications
- [ ] Share wins to Twitter
- [ ] Achievements/badges
- [ ] Leaderboards
- [ ] Charity donations (hard currency)

-----

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OAuth (configured in Supabase dashboard, but may need for custom flows)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx

# Email
RESEND_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://betonyou.app
```

-----

## Supabase Setup Checklist

1. [ ] Create new Supabase project
1. [ ] Run the SQL schema above in SQL Editor
1. [ ] Auth → Providers → Enable:
- [ ] Google (paste client ID + secret)
- [ ] Apple (paste Services ID + secret)
- [ ] Discord (paste client ID + secret)
- [ ] Twitter (paste client ID + secret)
1. [ ] Auth → URL Configuration → Set redirect URLs
1. [ ] Enable Realtime for `wall_events` table
1. [ ] Create Vercel project, connect repo
1. [ ] Add environment variables to Vercel
1. [ ] Set up Vercel Cron for `/api/cron/check-bets` (daily at midnight)
