
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000,
  daily_protein_goal INTEGER NOT NULL DEFAULT 150,
  daily_carbs_goal INTEGER NOT NULL DEFAULT 250,
  daily_fat_goal INTEGER NOT NULL DEFAULT 65,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Meal',
  photo_url TEXT,
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein NUMERIC(8,1) NOT NULL DEFAULT 0,
  total_carbs NUMERIC(8,1) NOT NULL DEFAULT 0,
  total_fat NUMERIC(8,1) NOT NULL DEFAULT 0,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_meals_user_eaten ON public.meals(user_id, eaten_at DESC);

-- Meal items table
CREATE TABLE public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(8,1) NOT NULL DEFAULT 0,
  carbs NUMERIC(8,1) NOT NULL DEFAULT 0,
  fat NUMERIC(8,1) NOT NULL DEFAULT 0,
  quantity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal items" ON public.meal_items FOR SELECT
USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can insert own meal items" ON public.meal_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can update own meal items" ON public.meal_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can delete own meal items" ON public.meal_items FOR DELETE
USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

-- Storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

CREATE POLICY "Anyone can view meal photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');
CREATE POLICY "Authenticated users can upload meal photos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own meal photos" ON storage.objects FOR UPDATE
USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own meal photos" ON storage.objects FOR DELETE
USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
