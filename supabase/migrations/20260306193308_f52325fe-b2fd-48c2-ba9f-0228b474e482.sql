
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer DEFAULT 25,
  ADD COLUMN IF NOT EXISTS gender text DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_weight numeric DEFAULT 70,
  ADD COLUMN IF NOT EXISTS target_weight numeric DEFAULT 65,
  ADD COLUMN IF NOT EXISTS height numeric DEFAULT 170,
  ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS height_unit text DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_preferences text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS health_concerns text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goal_date text DEFAULT '',
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
