
-- 1. diary_entries
CREATE TABLE public.diary_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date text NOT NULL,
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diary entries" ON public.diary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diary entries" ON public.diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diary entries" ON public.diary_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diary entries" ON public.diary_entries FOR DELETE USING (auth.uid() = user_id);

-- 2. health_entries
CREATE TABLE public.health_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own health entries" ON public.health_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health entries" ON public.health_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health entries" ON public.health_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health entries" ON public.health_entries FOR DELETE USING (auth.uid() = user_id);

-- 3. saved_meals
CREATE TABLE public.saved_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved meals" ON public.saved_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved meals" ON public.saved_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved meals" ON public.saved_meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved meals" ON public.saved_meals FOR DELETE USING (auth.uid() = user_id);

-- 4. saved_exercises
CREATE TABLE public.saved_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  calories_burned integer NOT NULL DEFAULT 0,
  secondary_metric numeric,
  secondary_unit text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved exercises" ON public.saved_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved exercises" ON public.saved_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved exercises" ON public.saved_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved exercises" ON public.saved_exercises FOR DELETE USING (auth.uid() = user_id);

-- 5. default_meals
CREATE TABLE public.default_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  meal_type text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequency text NOT NULL DEFAULT 'everyday',
  specific_days integer[],
  created_at_date text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.default_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own default meals" ON public.default_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own default meals" ON public.default_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own default meals" ON public.default_meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own default meals" ON public.default_meals FOR DELETE USING (auth.uid() = user_id);

-- 6. default_meal_overrides
CREATE TABLE public.default_meal_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  default_meal_id text NOT NULL,
  date text NOT NULL,
  removed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, default_meal_id, date)
);
ALTER TABLE public.default_meal_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own overrides" ON public.default_meal_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own overrides" ON public.default_meal_overrides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own overrides" ON public.default_meal_overrides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own overrides" ON public.default_meal_overrides FOR DELETE USING (auth.uid() = user_id);

-- 7. Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cycle_start_date text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cycle_duration integer DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tracked_nutrients text[] DEFAULT '{calories,protein,fiber}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nutrient_target_overrides jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cholesterol_level text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_scans_used integer DEFAULT 0;
