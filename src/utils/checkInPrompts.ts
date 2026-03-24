import type { DayEntry, HealthEntry, DefaultMeal, MealEntry } from "@/stores/useUserStore";
import { format, subDays } from "date-fns";

export type TimeWindow = "morning" | "midday" | "evening";

export type PromptType =
  | "missing_yesterday_dinner"
  | "sleep"
  | "sleep_wakeups"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "exercise"
  | "mood";

export interface CheckInPrompt {
  id: string;
  type: PromptType;
  question: string;
  buttons: { label: string; value: string; variant?: "default" | "subtle" }[];
  dismissLabel?: string;
  feedback?: string;
}

const FEEDBACK: Record<PromptType, string> = {
  missing_yesterday_dinner: "Logged. Small actions add up.",
  sleep: "Nice. Tracking your sleep helps spot patterns.",
  sleep_wakeups: "Noted. This helps identify sleep quality trends.",
  breakfast: "Logged. Small actions add up.",
  lunch: "Logged. Small actions add up.",
  dinner: "Logged. Small actions add up.",
  exercise: "Great consistency.",
  mood: "Noticing your emotions builds awareness.",
};

export function getTimeWindow(now: Date = new Date()): TimeWindow {
  const h = now.getHours();
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "midday";
  return "evening";
}

export function getEffectiveDinnerDate(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 4) {
    return format(subDays(now, 1), "yyyy-MM-dd");
  }
  return format(now, "yyyy-MM-dd");
}

function hasMealItems(dayEntry: DayEntry | undefined, mealType: string): boolean {
  if (!dayEntry) return false;
  const meal = dayEntry.meals.find(m => m.type === mealType);
  return !!meal && meal.items.length > 0;
}

function getDefaultMealNamesForType(
  defaultMeals: DefaultMeal[],
  mealType: string,
  dateKey: string,
  getDefaultMealsForDate: (date: string) => DefaultMeal[]
): string[] {
  const defaults = getDefaultMealsForDate(dateKey);
  return defaults.filter(dm => dm.mealType === mealType).map(dm => dm.name);
}

function hasDefaultMealForType(
  defaultMeals: DefaultMeal[],
  mealType: string,
  dateKey: string,
  getDefaultMealsForDate: (date: string) => DefaultMeal[]
): boolean {
  const defaults = getDefaultMealsForDate(dateKey);
  return defaults.some(dm => dm.mealType === mealType);
}

function hasSleepLogged(healthEntry: HealthEntry | undefined): boolean {
  return !!healthEntry && healthEntry.sleepQuality > 0;
}

function hasExerciseLogged(dayEntry: DayEntry | undefined): boolean {
  return !!dayEntry && dayEntry.exercises.length > 0;
}

function hasMoodLogged(healthEntry: HealthEntry | undefined): boolean {
  if (!healthEntry) return false;
  return (
    healthEntry.positiveEmotions?.length > 0 ||
    healthEntry.negativeEmotions?.length > 0 ||
    healthEntry.mood > 0
  );
}

export interface PromptContext {
  now: Date;
  todayKey: string;
  yesterdayKey: string;
  todayEntry?: DayEntry;
  yesterdayEntry?: DayEntry;
  todayHealth?: HealthEntry;
  defaultMeals: DefaultMeal[];
  getDefaultMealsForDate: (date: string) => DefaultMeal[];
  dismissedPrompts: Set<string>;
}

function buildMealPrompt(
  type: PromptType,
  mealType: string,
  question: string,
  confirmQuestion: string,
  ctx: PromptContext,
  dateKey: string,
  dayEntry: DayEntry | undefined,
): CheckInPrompt | null {
  const hasLogged = hasMealItems(dayEntry, mealType);
  if (hasLogged) return null;

  const hasDefault = hasDefaultMealForType(ctx.defaultMeals, mealType, dateKey, ctx.getDefaultMealsForDate);
  const defaultNames = getDefaultMealNamesForType(ctx.defaultMeals, mealType, dateKey, ctx.getDefaultMealsForDate);

  if (hasDefault) {
    const name = defaultNames[0] || mealType;
    return {
      id: type,
      type,
      question: `${confirmQuestion} ${name}?`,
      buttons: [
        { label: "Yes", value: "confirm" },
        { label: "No — add different", value: "add" },
        { label: "Didn't eat", value: "skip" },
      ],
      feedback: FEEDBACK[type],
    };
  }

  const hasAnyDefault = ctx.defaultMeals.some(dm => dm.mealType === mealType);

  return {
    id: type,
    type,
    question,
    buttons: hasAnyDefault
      ? [
          { label: "Yes — log default", value: "default" },
          { label: "Add something different", value: "add" },
          { label: "Not yet", value: "dismiss", variant: "subtle" as const },
        ]
      : [
          { label: "Add", value: "add" },
          { label: "Not yet", value: "dismiss", variant: "subtle" as const },
        ],
    feedback: FEEDBACK[type],
  };
}

export function generatePrompts(ctx: PromptContext): CheckInPrompt[] {
  const prompts: CheckInPrompt[] = [];
  const window = getTimeWindow(ctx.now);
  const h = ctx.now.getHours();

  const isDismissed = (type: PromptType) => ctx.dismissedPrompts.has(type);
  const add = (p: CheckInPrompt | null) => {
    if (p && prompts.length < 3 && !isDismissed(p.type)) prompts.push(p);
  };

  // 1. Missing previous-day dinner (morning only)
  if (window === "morning") {
    const dinnerDateKey = ctx.yesterdayKey;
    const yesterdayHasDinner = hasMealItems(ctx.yesterdayEntry, "dinner");
    if (!yesterdayHasDinner) {
      add({
        id: "missing_yesterday_dinner",
        type: "missing_yesterday_dinner",
        question: "Did you have dinner yesterday?",
        buttons: [
          { label: "Yes — add", value: "add" },
          { label: "No", value: "skip" },
        ],
        dismissLabel: "Skip",
        feedback: FEEDBACK.missing_yesterday_dinner,
      });
    }
  }

  // 2. Sleep (morning only)
  if (window === "morning" && !hasSleepLogged(ctx.todayHealth)) {
    add({
      id: "sleep",
      type: "sleep",
      question: "How did you sleep?",
      buttons: [
        { label: "Terrible", value: "1" },
        { label: "Poor", value: "2" },
        { label: "Fair", value: "3" },
        { label: "Good", value: "4" },
        { label: "Great", value: "5" },
      ],
      dismissLabel: "Not now",
      feedback: FEEDBACK.sleep,
    });
  }

  // 3. Time-relevant meal
  if (window === "morning") {
    add(buildMealPrompt(
      "breakfast", "breakfast",
      "Breakfast same as usual?",
      "Had your usual",
      ctx, ctx.todayKey, ctx.todayEntry
    ));
  }

  if (window === "midday") {
    // Check breakfast first
    add(buildMealPrompt(
      "breakfast", "breakfast",
      "Have you had breakfast?",
      "Had your usual",
      ctx, ctx.todayKey, ctx.todayEntry
    ));

    add(buildMealPrompt(
      "lunch", "lunch",
      "Have you had lunch?",
      "Had your usual",
      ctx, ctx.todayKey, ctx.todayEntry
    ));
  }

  if (window === "evening") {
    const dinnerDateKey = getEffectiveDinnerDate(ctx.now);
    const dinnerEntry = h < 4 ? ctx.yesterdayEntry : ctx.todayEntry;
    add(buildMealPrompt(
      "dinner", "dinner",
      "Have you had dinner?",
      "Had your usual",
      ctx, dinnerDateKey, dinnerEntry
    ));
  }

  // 4. Exercise
  if (!hasExerciseLogged(ctx.todayEntry)) {
    if (window === "midday") {
      add({
        id: "exercise",
        type: "exercise",
        question: "Workout today?",
        buttons: [
          { label: "Strength", value: "strength" },
          { label: "Cardio", value: "cardio" },
          { label: "Not today", value: "dismiss", variant: "subtle" },
        ],
        feedback: FEEDBACK.exercise,
      });
    } else if (window === "evening") {
      add({
        id: "exercise",
        type: "exercise",
        question: "Any movement today?",
        buttons: [
          { label: "Strength", value: "strength" },
          { label: "Cardio", value: "cardio" },
          { label: "Walked", value: "walked" },
          { label: "No", value: "dismiss", variant: "subtle" },
        ],
        feedback: FEEDBACK.exercise,
      });
    }
  }

  // 5. Mood (once daily)
  if (!hasMoodLogged(ctx.todayHealth)) {
    if (window === "evening") {
      add({
        id: "mood",
        type: "mood",
        question: "Quick mood check?",
        buttons: [
          { label: "Great", value: "5" },
          { label: "Good", value: "4" },
          { label: "Okay", value: "3" },
          { label: "Low", value: "2" },
          { label: "Overwhelmed", value: "1" },
        ],
        dismissLabel: "Not now",
        feedback: FEEDBACK.mood,
      });
    } else if (window === "morning") {
      add({
        id: "mood",
        type: "mood",
        question: "How are you feeling today?",
        buttons: [
          { label: "Great", value: "5" },
          { label: "Good", value: "4" },
          { label: "Okay", value: "3" },
          { label: "Low", value: "2" },
          { label: "Overwhelmed", value: "1" },
        ],
        dismissLabel: "Not now",
        feedback: FEEDBACK.mood,
      });
    }
  }

  return prompts;
}
