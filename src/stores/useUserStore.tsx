import { useState, useCallback, useRef, createContext, useContext, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  iron?: number;
  vitamin_d?: number;
  magnesium?: number;
  omega3?: number;
  b12?: number;
  quantity?: string;
  groupId?: string;
  groupName?: string;
  availableUnits?: string[];
  wholeItemGrams?: number;
}

export interface Exercise {
  id: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  secondaryMetric?: number;
  secondaryUnit?: string;
}

export interface MealEntry {
  type: "breakfast" | "lunch" | "dinner" | "snack" | "supplements" | "drinks";
  items: FoodItem[];
}

export interface PoopEntry {
  id: string;
  type: number;
}

export interface HealthEntry {
  poopCount: number;
  poopEntries: PoopEntry[];
  sleepQuality: number;
  stressLevel: number;
  mood: number;
  positiveEmotions: string[];
  positiveReasons: string[];
  positiveOtherText: string;
  negativeEmotions: string[];
  negativeReasons: string[];
  negativeOtherText: string;
  wakeUps: number;
  diaryText: string;
}

export interface DayEntry {
  date: string;
  meals: MealEntry[];
  exercises: Exercise[];
}

export interface SavedMeal {
  id: string;
  name: string;
  items: FoodItem[];
}

export type DefaultMealFrequency = "everyday" | "weekdays" | "weekends" | "specific";

export interface DefaultMeal {
  id: string;
  name: string;
  mealType: MealEntry["type"];
  items: FoodItem[];
  frequency: DefaultMealFrequency;
  specificDays?: number[];
  createdAt?: string;
}

export interface DefaultMealOverride {
  defaultMealId: string;
  date: string;
  removed: boolean;
}

export interface SavedExercise {
  id: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  secondaryMetric?: number;
  secondaryUnit?: string;
}

export interface DefaultExercise {
  id: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  secondaryMetric?: number;
  secondaryUnit?: string;
  frequency: DefaultMealFrequency;
  specificDays?: number[];
  createdAt?: string;
}

export interface DefaultExerciseOverride {
  defaultExerciseId: string;
  date: string;
  removed: boolean;
}

export interface UserProfile {
  onboardingComplete: boolean;
  goal: string;
  goals: string[];
  gender: string;
  age: number;
  currentWeight: number;
  weightUnit: "kg" | "lbs";
  height: number;
  heightUnit: "cm" | "ft";
  targetWeight: number;
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  dietaryRestrictionsOther?: string;
  healthConcerns: string[];
  healthConcernsOther?: string;
  activityLevel: "sedentary" | "lightly_active" | "active";
  goalTimeline: "1_2_months" | "3_4_months" | "5_6_months" | "7_plus_months";
  dailyCalorieTarget: number;
  goalDate: string;
  weightHistory: { date: string; weight: number }[];
  savedMeals: SavedMeal[];
  savedExercises: SavedExercise[];
  defaultMeals: DefaultMeal[];
  defaultMealOverrides: DefaultMealOverride[];
  subscription: "free" | "pro";
  aiScansUsed: number;
  cycleStartDate?: string;
  cycleDuration: number;
  trackedNutrients: string[];
  nutrientTargetOverrides: Record<string, number>;
  cholesterolLevel: "low" | "medium" | "high" | "";
}

const DEFAULT_PROFILE: UserProfile = {
  onboardingComplete: false,
  goal: "",
  goals: [],
  gender: "",
  age: 25,
  currentWeight: 70,
  weightUnit: "kg",
  height: 170,
  heightUnit: "cm",
  targetWeight: 65,
  dietaryPreferences: [],
  dietaryRestrictions: [],
  healthConcerns: [],
  activityLevel: "sedentary",
  goalTimeline: "3_4_months",
  dailyCalorieTarget: 2000,
  goalDate: "",
  weightHistory: [],
  savedMeals: [],
  savedExercises: [],
  defaultMeals: [],
  defaultMealOverrides: [],
  subscription: "free",
  aiScansUsed: 0,
  cycleDuration: 5,
  trackedNutrients: ["calories", "protein", "fiber"],
  nutrientTargetOverrides: {},
  cholesterolLevel: "",
};

function getLocalDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1).getDay();
}

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ===== Store value type =====
type UserStoreValue = ReturnType<typeof useUserStoreInternal>;

const UserStoreContext = createContext<UserStoreValue | null>(null);

function useUserStoreInternal() {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [diary, setDiaryState] = useState<Record<string, DayEntry>>({});
  const [health, setHealthState] = useState<Record<string, HealthEntry>>({});

  const diaryRef = useRef(diary);
  diaryRef.current = diary;
  const healthRef = useRef(health);
  healthRef.current = health;

  const persistDiaryEntry = useCallback(
    debounce(async (date: string, entry: DayEntry) => {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from("diary_entries").upsert(
        { user_id: userId, date, meals: entry.meals as any, exercises: entry.exercises as any },
        { onConflict: "user_id,date" }
      );
    }, 500),
    []
  );

  const persistHealthEntry = useCallback(
    debounce(async (date: string, entry: HealthEntry) => {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from("health_entries").upsert(
        { user_id: userId, date, data: entry as any },
        { onConflict: "user_id,date" }
      );
    }, 500),
    []
  );

  const setProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updates }));
  }, []);

  const getDayEntry = useCallback(
    (date: string): DayEntry => {
      return diary[date] || { date, meals: [], exercises: [] };
    },
    [diary]
  );

  const setDayEntry = useCallback((date: string, entry: DayEntry) => {
    setDiaryState((prev) => ({ ...prev, [date]: entry }));
    persistDiaryEntry(date, entry);
  }, [persistDiaryEntry]);

  const addFoodToMeal = useCallback(
    (date: string, mealType: MealEntry["type"], item: FoodItem) => {
      setDiaryState((prev) => {
        const day = prev[date] || { date, meals: [], exercises: [] };
        const mealIndex = day.meals.findIndex((m) => m.type === mealType);
        const meals = [...day.meals];
        if (mealIndex >= 0) {
          meals[mealIndex] = {
            ...meals[mealIndex],
            items: [...meals[mealIndex].items, item],
          };
        } else {
          meals.push({ type: mealType, items: [item] });
        }
        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const addExercise = useCallback((date: string, exercise: Exercise) => {
    setDiaryState((prev) => {
      const day = prev[date] || { date, meals: [], exercises: [] };
      const updated = { ...day, exercises: [...day.exercises, exercise] };
      persistDiaryEntry(date, updated);
      return { ...prev, [date]: updated };
    });
  }, [persistDiaryEntry]);

  const removeFoodFromMeal = useCallback(
    (date: string, mealType: MealEntry["type"], itemId: string) => {
      setDiaryState((prev) => {
        const day = prev[date];
        if (!day) return prev;
        const meals = day.meals.map((m) =>
          m.type === mealType
            ? { ...m, items: m.items.filter((i) => i.id !== itemId) }
            : m
        );
        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const removeExercise = useCallback((date: string, exerciseId: string) => {
    setDiaryState((prev) => {
      const day = prev[date];
      if (!day) return prev;
      const updated = { ...day, exercises: day.exercises.filter((e) => e.id !== exerciseId) };
      persistDiaryEntry(date, updated);
      return { ...prev, [date]: updated };
    });
  }, [persistDiaryEntry]);

  const updateFoodInMeal = useCallback(
    (date: string, mealType: MealEntry["type"], updatedItem: FoodItem) => {
      setDiaryState((prev) => {
        const day = prev[date];
        if (!day) return prev;
        const meals = day.meals.map((m) =>
          m.type === mealType
            ? { ...m, items: m.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)) }
            : m
        );
        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const updateExercise = useCallback((date: string, updatedExercise: Exercise) => {
    setDiaryState((prev) => {
      const day = prev[date];
      if (!day) return prev;
      const updated = {
        ...day,
        exercises: day.exercises.map((e) => (e.id === updatedExercise.id ? updatedExercise : e)),
      };
      persistDiaryEntry(date, updated);
      return { ...prev, [date]: updated };
    });
  }, [persistDiaryEntry]);

  const moveFoodBetweenMeals = useCallback(
    (date: string, fromMealType: MealEntry["type"], toMealType: MealEntry["type"], itemId: string) => {
      setDiaryState((prev) => {
        const day = prev[date];
        if (!day) return prev;

        const sourceMeal = day.meals.find((m) => m.type === fromMealType);
        const item = sourceMeal?.items.find((i) => i.id === itemId);
        if (!item) return prev;

        const movedItem = { ...item, groupId: undefined, groupName: undefined };

        let meals = day.meals.map((m) => {
          if (m.type === fromMealType) {
            return { ...m, items: m.items.filter((i) => i.id !== itemId) };
          }
          return m;
        });

        const targetMeal = meals.find((m) => m.type === toMealType);
        if (targetMeal) {
          meals = meals.map((m) =>
            m.type === toMealType ? { ...m, items: [...m.items, movedItem] } : m
          );
        } else {
          meals.push({ type: toMealType, items: [movedItem] });
        }

        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const mergeItemsIntoGroup = useCallback(
    (
      date: string,
      sourceItem: { mealType: MealEntry["type"]; itemId: string },
      targetItem: { mealType: MealEntry["type"]; itemId: string },
      groupName: string
    ) => {
      setDiaryState((prev) => {
        const day = prev[date];
        if (!day) return prev;

        const groupId = crypto.randomUUID();

        const srcMeal = day.meals.find((m) => m.type === sourceItem.mealType);
        const srcIt = srcMeal?.items.find((i) => i.id === sourceItem.itemId);
        if (!srcIt) return prev;

        let meals = day.meals.map((m) =>
          m.type === sourceItem.mealType
            ? { ...m, items: m.items.filter((i) => i.id !== sourceItem.itemId) }
            : m
        );

        const tgtIdx = meals.findIndex((m) => m.type === targetItem.mealType);
        if (tgtIdx >= 0) {
          meals[tgtIdx] = {
            ...meals[tgtIdx],
            items: [
              ...meals[tgtIdx].items.map((i) =>
                i.id === targetItem.itemId ? { ...i, groupId, groupName } : i
              ),
              { ...srcIt, groupId, groupName },
            ],
          };
        }

        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const isDefaultMealActiveForDate = useCallback(
    (defaultMeal: DefaultMeal, date: string): boolean => {
      const dayOfWeek = getLocalDayOfWeek(date);
      switch (defaultMeal.frequency) {
        case "everyday": return true;
        case "weekdays": return dayOfWeek >= 1 && dayOfWeek <= 5;
        case "weekends": return dayOfWeek === 0 || dayOfWeek === 6;
        case "specific": return (defaultMeal.specificDays || []).includes(dayOfWeek);
        default: return false;
      }
    },
    []
  );

  const getDefaultMealsForDate = useCallback(
    (date: string): { mealType: MealEntry["type"]; items: FoodItem[]; defaultMealId: string; name: string }[] => {
      const overrides = profile.defaultMealOverrides || [];
      return (profile.defaultMeals || [])
        .filter((dm) => {
          if (dm.createdAt && date < dm.createdAt) return false;
          const isRemoved = overrides.some((o) => o.defaultMealId === dm.id && o.date === date && o.removed);
          return !isRemoved && isDefaultMealActiveForDate(dm, date);
        })
        .map((dm) => ({
          mealType: dm.mealType,
          items: dm.items.map((item) => ({
            ...item,
            id: `default-${dm.id}-${item.id}`,
            groupId: `default-${dm.id}`,
            groupName: dm.name,
          })),
          defaultMealId: dm.id,
          name: dm.name,
        }));
    },
    [profile.defaultMeals, profile.defaultMealOverrides, isDefaultMealActiveForDate]
  );

  const getDefaultExercisesForDate = useCallback(
    (date: string): { name: string; duration: number; caloriesBurned: number; secondaryMetric?: number; secondaryUnit?: string; defaultExerciseId: string }[] => {
      const overrides = profile.defaultExerciseOverrides || [];
      return (profile.defaultExercises || [])
        .filter((de) => {
          if (de.createdAt && date < de.createdAt) return false;
          const isRemoved = overrides.some((o) => o.defaultExerciseId === de.id && o.date === date && o.removed);
          if (isRemoved) return false;
          return isDefaultMealActiveForDate(de as any, date);
        })
        .map((de) => ({
          name: de.name,
          duration: de.duration,
          caloriesBurned: de.caloriesBurned,
          secondaryMetric: de.secondaryMetric,
          secondaryUnit: de.secondaryUnit,
          defaultExerciseId: de.id,
        }));
    },
    [profile.defaultExercises, profile.defaultExerciseOverrides, isDefaultMealActiveForDate]
  );

  const getDayTotals = useCallback(
    (date: string) => {
      const day = getDayEntry(date);
      let calories = 0, protein = 0, carbs = 0, fat = 0, exerciseCals = 0;
      let fiber = 0, iron = 0, vitamin_d = 0, magnesium = 0, omega3 = 0, b12 = 0;

      const addItem = (i: FoodItem) => {
        calories += i.calories;
        protein += i.protein;
        carbs += i.carbs;
        fat += i.fat;
        fiber += i.fiber || 0;
        iron += i.iron || 0;
        vitamin_d += i.vitamin_d || 0;
        magnesium += i.magnesium || 0;
        omega3 += i.omega3 || 0;
        b12 += i.b12 || 0;
      };

      day.meals.forEach((m) => m.items.forEach(addItem));

      const defaultMeals = getDefaultMealsForDate(date);
      const materializedDefaultMealIds = new Set<string>();
      day.meals.forEach((meal) => {
        meal.items.forEach((item) => {
          const match = item.groupId?.match(/^logged-default-(.+)-\d+$/);
          if (match?.[1]) {
            materializedDefaultMealIds.add(match[1]);
          }
        });
      });

      defaultMeals.forEach((dm) => {
        if (materializedDefaultMealIds.has(dm.defaultMealId)) return;
        dm.items.forEach(addItem);
      });

      day.exercises.forEach((e) => (exerciseCals += e.caloriesBurned));
      return {
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        exerciseCals: Math.round(exerciseCals),
        fiber: Math.round(fiber * 10) / 10,
        iron: Math.round(iron),
        vitamin_d: Math.round(vitamin_d),
        magnesium: Math.round(magnesium),
        omega3: Math.round(omega3),
        b12: Math.round(b12),
      };
    },
    [getDayEntry, getDefaultMealsForDate]
  );

  const DEFAULT_HEALTH: HealthEntry = {
    poopCount: 0,
    poopEntries: [],
    sleepQuality: 0,
    stressLevel: 0,
    mood: 0,
    positiveEmotions: [],
    positiveReasons: [],
    positiveOtherText: "",
    negativeEmotions: [],
    negativeReasons: [],
    negativeOtherText: "",
    wakeUps: 0,
    diaryText: "",
  };

  const getHealthEntry = useCallback(
    (date: string): HealthEntry => {
      return { ...DEFAULT_HEALTH, ...(health[date] || {}) };
    },
    [health]
  );

  const setHealthEntry = useCallback((date: string, entry: HealthEntry) => {
    setHealthState((prev) => ({ ...prev, [date]: entry }));
    persistHealthEntry(date, entry);
  }, [persistHealthEntry]);

  const addFoodToGroup = useCallback(
    (date: string, mealType: MealEntry["type"], groupId: string, groupName: string, item: FoodItem) => {
      setDiaryState((prev) => {
        const day = prev[date];
        if (!day) return prev;
        const meals = day.meals.map((m) =>
          m.type === mealType
            ? { ...m, items: [...m.items, { ...item, groupId, groupName }] }
            : m
        );
        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const removeFoodFromGroup = useCallback(
    (date: string, mealType: MealEntry["type"], itemId: string) => {
      setDiaryState((prev) => {
        const day = prev[date];
        if (!day) return prev;
        const meals = day.meals.map((m) =>
          m.type === mealType
            ? { ...m, items: m.items.map((i) => i.id === itemId ? { ...i, groupId: undefined, groupName: undefined } : i) }
            : m
        );
        const updated = { ...day, meals };
        persistDiaryEntry(date, updated);
        return { ...prev, [date]: updated };
      });
    },
    [persistDiaryEntry]
  );

  const loadAllFromDB = useCallback(async (userId: string) => {
    const { data: diaryRows } = await supabase
      .from("diary_entries")
      .select("date, meals, exercises")
      .eq("user_id", userId);

    if (diaryRows) {
      const diaryMap: Record<string, DayEntry> = {};
      for (const row of diaryRows) {
        diaryMap[row.date] = {
          date: row.date,
          meals: (row.meals as any) || [],
          exercises: (row.exercises as any) || [],
        };
      }
      setDiaryState(diaryMap);
    }

    const { data: healthRows } = await supabase
      .from("health_entries")
      .select("date, data")
      .eq("user_id", userId);

    if (healthRows) {
      const healthMap: Record<string, HealthEntry> = {};
      for (const row of healthRows) {
        healthMap[row.date] = (row.data as any) || {};
      }
      setHealthState(healthMap);
    }

    const { data: savedMealRows } = await supabase
      .from("saved_meals")
      .select("id, name, items")
      .eq("user_id", userId);

    const { data: savedExRows } = await supabase
      .from("saved_exercises")
      .select("id, name, duration, calories_burned, secondary_metric, secondary_unit")
      .eq("user_id", userId);

    const { data: defaultMealRows } = await supabase
      .from("default_meals")
      .select("id, name, meal_type, items, frequency, specific_days, created_at_date")
      .eq("user_id", userId);

    const { data: overrideRows } = await supabase
      .from("default_meal_overrides")
      .select("default_meal_id, date, removed")
      .eq("user_id", userId);

    const { data: defaultExRows } = await supabase
      .from("default_exercises")
      .select("id, name, duration, calories_burned, secondary_metric, secondary_unit, frequency, specific_days, created_at_date")
      .eq("user_id", userId);

    const { data: exOverrideRows } = await supabase
      .from("default_exercise_overrides")
      .select("default_exercise_id, date, removed")
      .eq("user_id", userId);

    setProfileState((prev) => ({
      ...prev,
      savedMeals: (savedMealRows || []).map((r) => ({
        id: r.id,
        name: r.name,
        items: (r.items as any) || [],
      })),
      savedExercises: (savedExRows || []).map((r) => ({
        id: r.id,
        name: r.name,
        duration: r.duration,
        caloriesBurned: r.calories_burned,
        secondaryMetric: r.secondary_metric ? Number(r.secondary_metric) : undefined,
        secondaryUnit: r.secondary_unit || undefined,
      })),
      defaultMeals: (defaultMealRows || []).map((r) => ({
        id: r.id,
        name: r.name,
        mealType: r.meal_type as MealEntry["type"],
        items: (r.items as any) || [],
        frequency: r.frequency as DefaultMealFrequency,
        specificDays: r.specific_days || undefined,
        createdAt: r.created_at_date || undefined,
      })),
      defaultMealOverrides: (overrideRows || []).map((r) => ({
        defaultMealId: r.default_meal_id,
        date: r.date,
        removed: r.removed,
      })),
      defaultExercises: (defaultExRows || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        duration: r.duration,
        caloriesBurned: r.calories_burned,
        secondaryMetric: r.secondary_metric ? Number(r.secondary_metric) : undefined,
        secondaryUnit: r.secondary_unit || undefined,
        frequency: r.frequency as DefaultMealFrequency,
        specificDays: r.specific_days || undefined,
        createdAt: r.created_at_date || undefined,
      })),
      defaultExerciseOverrides: (exOverrideRows || []).map((r: any) => ({
        defaultExerciseId: r.default_exercise_id,
        date: r.date,
        removed: r.removed,
      })),
    }));
  }, []);

  const resetStore = useCallback(() => {
    setProfileState(DEFAULT_PROFILE);
    setDiaryState({});
    setHealthState({});
  }, []);

  return {
    profile,
    setProfile,
    diary,
    getDayEntry,
    setDayEntry,
    addFoodToMeal,
    removeFoodFromMeal,
    updateFoodInMeal,
    addExercise,
    removeExercise,
    updateExercise,
    getDayTotals,
    moveFoodBetweenMeals,
    mergeItemsIntoGroup,
    addFoodToGroup,
    removeFoodFromGroup,
    health,
    getHealthEntry,
    setHealthEntry,
    getDefaultMealsForDate,
    loadAllFromDB,
    resetStore,
  };
}

// ===== Provider + Hook =====
export function UserStoreProvider({ children }: { children: ReactNode }) {
  const store = useUserStoreInternal();
  return (
    <UserStoreContext.Provider value={store}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore() {
  const ctx = useContext(UserStoreContext);
  if (!ctx) {
    throw new Error("useUserStore must be used within a UserStoreProvider");
  }
  return ctx;
}
