import { useState, useEffect, useCallback } from "react";

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
  duration: number; // minutes
  caloriesBurned: number;
  secondaryMetric?: number; // km, steps, laps, etc.
  secondaryUnit?: string; // "km", "steps", "laps", etc.
}

export interface MealEntry {
  type: "breakfast" | "lunch" | "dinner" | "snack" | "supplements" | "drinks";
  items: FoodItem[];
}

export interface PoopEntry {
  id: string;
  type: number; // Bristol Stool Scale 1-7
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
  diaryText: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  meals: MealEntry[];
  exercises: Exercise[];
}

export interface SavedMeal {
  id: string;
  name: string;
  items: FoodItem[];
}

export interface SavedExercise {
  id: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  secondaryMetric?: number;
  secondaryUnit?: string;
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
  subscription: "free" | "pro";
  aiScansUsed: number;
  cycleStartDate?: string;
  cycleDuration: number;
  trackedNutrients: string[];
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
  subscription: "free",
  aiScansUsed: 0,
  trackedNutrients: ["calories", "protein", "fiber"],
};

function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem("nuria_profile");
    if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PROFILE;
}

function loadDiary(): Record<string, DayEntry> {
  try {
    const stored = localStorage.getItem("nuria_diary");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function loadHealth(): Record<string, HealthEntry> {
  try {
    const stored = localStorage.getItem("nuria_health");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

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
  diaryText: "",
};

export function useUserStore() {
  const [profile, setProfileState] = useState<UserProfile>(loadProfile);
  const [diary, setDiaryState] = useState<Record<string, DayEntry>>(loadDiary);
  const [health, setHealthState] = useState<Record<string, HealthEntry>>(loadHealth);

  useEffect(() => {
    localStorage.setItem("nuria_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("nuria_diary", JSON.stringify(diary));
  }, [diary]);

  useEffect(() => {
    localStorage.setItem("nuria_health", JSON.stringify(health));
  }, [health]);

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
  }, []);

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
        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
  );

  const addExercise = useCallback((date: string, exercise: Exercise) => {
    setDiaryState((prev) => {
      const day = prev[date] || { date, meals: [], exercises: [] };
      return {
        ...prev,
        [date]: { ...day, exercises: [...day.exercises, exercise] },
      };
    });
  }, []);

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
        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
  );

  const removeExercise = useCallback((date: string, exerciseId: string) => {
    setDiaryState((prev) => {
      const day = prev[date];
      if (!day) return prev;
      return {
        ...prev,
        [date]: { ...day, exercises: day.exercises.filter((e) => e.id !== exerciseId) },
      };
    });
  }, []);

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
        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
  );

  const updateExercise = useCallback((date: string, updatedExercise: Exercise) => {
    setDiaryState((prev) => {
      const day = prev[date];
      if (!day) return prev;
      return {
        ...prev,
        [date]: {
          ...day,
          exercises: day.exercises.map((e) => (e.id === updatedExercise.id ? updatedExercise : e)),
        },
      };
    });
  }, []);

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

        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
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

        const groupId = Date.now().toString();

        const srcMeal = day.meals.find((m) => m.type === sourceItem.mealType);
        const srcIt = srcMeal?.items.find((i) => i.id === sourceItem.itemId);
        if (!srcIt) return prev;

        // Remove source item
        let meals = day.meals.map((m) =>
          m.type === sourceItem.mealType
            ? { ...m, items: m.items.filter((i) => i.id !== sourceItem.itemId) }
            : m
        );

        // Update target item with group info and add source item
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

        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
  );

  const getDayTotals = useCallback(
    (date: string) => {
      const day = getDayEntry(date);
      let calories = 0, protein = 0, carbs = 0, fat = 0, exerciseCals = 0;
      let fiber = 0, iron = 0, vitamin_d = 0, magnesium = 0, omega3 = 0, b12 = 0;
      day.meals.forEach((m) =>
        m.items.forEach((i) => {
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
        })
      );
      day.exercises.forEach((e) => (exerciseCals += e.caloriesBurned));
      return { calories, protein, carbs, fat, exerciseCals, fiber, iron, vitamin_d, magnesium, omega3, b12 };
    },
    [getDayEntry]
  );

  const getHealthEntry = useCallback(
    (date: string): HealthEntry => {
      return { ...DEFAULT_HEALTH, ...(health[date] || {}) };
    },
    [health]
  );

  const setHealthEntry = useCallback((date: string, entry: HealthEntry) => {
    setHealthState((prev) => ({ ...prev, [date]: entry }));
  }, []);

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
        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
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
        return { ...prev, [date]: { ...day, meals } };
      });
    },
    []
  );

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
  };
}
