import { useState, useEffect, useCallback } from "react";

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity?: string;
}

export interface Exercise {
  id: string;
  name: string;
  duration: number; // minutes
  caloriesBurned: number;
}

export interface MealEntry {
  type: "breakfast" | "lunch" | "dinner" | "snack" | "supplements" | "drinks";
  items: FoodItem[];
}

export interface HealthEntry {
  poopCount: number;
  sleepQuality: number; // 1-5
  stressLevel: number; // 1-5
  mood: number; // 1-5
  positiveEmotions: string[];
  positiveReasons: string[];
  positiveOtherText: string;
  negativeEmotions: string[];
  negativeReasons: string[];
  negativeOtherText: string;
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

export interface UserProfile {
  onboardingComplete: boolean;
  goal: string;
  goals: string[];
  gender: string;
  currentWeight: number;
  height: number;
  heightUnit: "cm" | "ft";
  targetWeight: number;
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  dietaryRestrictionsOther?: string;
  healthConcerns: string[];
  healthConcernsOther?: string;
  dailyCalorieTarget: number;
  goalDate: string;
  weightHistory: { date: string; weight: number }[];
  savedMeals: SavedMeal[];
  subscription: "free" | "pro";
  aiScansUsed: number;
  cycleStartDate?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  onboardingComplete: false,
  goal: "",
  goals: [],
  gender: "",
  currentWeight: 70,
  height: 170,
  heightUnit: "cm",
  targetWeight: 65,
  dietaryPreferences: [],
  dietaryRestrictions: [],
  healthConcerns: [],
  dailyCalorieTarget: 2000,
  goalDate: "",
  weightHistory: [],
  savedMeals: [],
  subscription: "free",
  aiScansUsed: 0,
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
  sleepQuality: 0,
  stressLevel: 0,
  mood: 0,
  positiveEmotions: [],
  positiveReasons: [],
  positiveOtherText: "",
  negativeEmotions: [],
  negativeReasons: [],
  negativeOtherText: "",
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

  const getDayTotals = useCallback(
    (date: string) => {
      const day = getDayEntry(date);
      let calories = 0, protein = 0, carbs = 0, fat = 0, exerciseCals = 0;
      day.meals.forEach((m) =>
        m.items.forEach((i) => {
          calories += i.calories;
          protein += i.protein;
          carbs += i.carbs;
          fat += i.fat;
        })
      );
      day.exercises.forEach((e) => (exerciseCals += e.caloriesBurned));
      return { calories, protein, carbs, fat, exerciseCals };
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
    health,
    getHealthEntry,
    setHealthEntry,
  };
}
