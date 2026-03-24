
CREATE TABLE public.default_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  calories_burned integer NOT NULL DEFAULT 0,
  secondary_metric numeric,
  secondary_unit text,
  frequency text NOT NULL DEFAULT 'everyday',
  specific_days integer[],
  created_at timestamptz NOT NULL DEFAULT now(),
  created_at_date text
);

ALTER TABLE public.default_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own default exercises" ON public.default_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own default exercises" ON public.default_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own default exercises" ON public.default_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own default exercises" ON public.default_exercises FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.default_exercise_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  default_exercise_id text NOT NULL,
  date text NOT NULL,
  removed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, default_exercise_id, date)
);

ALTER TABLE public.default_exercise_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise overrides" ON public.default_exercise_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise overrides" ON public.default_exercise_overrides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise overrides" ON public.default_exercise_overrides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise overrides" ON public.default_exercise_overrides FOR DELETE USING (auth.uid() = user_id);
