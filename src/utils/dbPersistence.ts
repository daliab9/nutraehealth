import { supabase } from "@/integrations/supabase/client";
import type { FoodItem, SavedMeal, SavedExercise, DefaultMeal, DefaultMealFrequency, DefaultMealOverride } from "@/stores/useUserStore";

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ===== Saved Meals =====
export async function dbInsertSavedMeal(meal: SavedMeal) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("saved_meals").insert({
    id: meal.id,
    user_id: userId,
    name: meal.name,
    items: meal.items as any,
  });
}

export async function dbUpdateSavedMeal(meal: SavedMeal) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("saved_meals")
    .update({ name: meal.name, items: meal.items as any })
    .eq("id", meal.id)
    .eq("user_id", userId);
}

export async function dbDeleteSavedMeal(mealId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("saved_meals").delete().eq("id", mealId).eq("user_id", userId);
}

// ===== Saved Exercises =====
export async function dbInsertSavedExercise(ex: SavedExercise) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("saved_exercises").insert({
    id: ex.id,
    user_id: userId,
    name: ex.name,
    duration: ex.duration,
    calories_burned: ex.caloriesBurned,
    secondary_metric: ex.secondaryMetric ?? null,
    secondary_unit: ex.secondaryUnit ?? null,
  });
}

export async function dbDeleteSavedExercise(exerciseId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("saved_exercises").delete().eq("id", exerciseId).eq("user_id", userId);
}

// ===== Default Meals =====
export async function dbInsertDefaultMeal(meal: DefaultMeal) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("default_meals").insert({
    id: meal.id,
    user_id: userId,
    name: meal.name,
    meal_type: meal.mealType,
    items: meal.items as any,
    frequency: meal.frequency,
    specific_days: meal.specificDays ?? null,
    created_at_date: meal.createdAt ?? null,
  });
}

export async function dbUpdateDefaultMeal(meal: DefaultMeal) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("default_meals")
    .update({
      name: meal.name,
      meal_type: meal.mealType,
      items: meal.items as any,
      frequency: meal.frequency,
      specific_days: meal.specificDays ?? null,
    })
    .eq("id", meal.id)
    .eq("user_id", userId);
}

export async function dbDeleteDefaultMeal(mealId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("default_meals").delete().eq("id", mealId).eq("user_id", userId);
  await supabase.from("default_meal_overrides").delete().eq("default_meal_id", mealId).eq("user_id", userId);
}

// ===== Default Meal Overrides =====
export async function dbInsertOverride(override: DefaultMealOverride) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("default_meal_overrides").upsert({
    user_id: userId,
    default_meal_id: override.defaultMealId,
    date: override.date,
    removed: override.removed,
  }, { onConflict: "user_id,default_meal_id,date" });
}

export async function dbDeleteOverridesForMeal(defaultMealId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("default_meal_overrides").delete().eq("default_meal_id", defaultMealId).eq("user_id", userId);
}

// ===== Profile extended columns =====
export async function dbUpdateProfileExtended(updates: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("profiles").update(updates).eq("user_id", userId);
}
