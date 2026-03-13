ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'sedentary';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goal_timeline text DEFAULT 'moderate';