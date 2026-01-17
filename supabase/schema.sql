-- ============================================
-- BET ON YOURSELF - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- AVATARS (must be created before profiles due to FK)
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
