import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { calculateCalories, calculateGoalDate, ACTIVITY_LABELS, TIMELINE_LABELS, ACTIVITY_OPTIONS, TIMELINE_OPTIONS } from "@/utils/calorieCalculation";
import type { ActivityLevel, GoalTimeline } from "@/utils/calorieCalculation";
import { AVAILABLE_NUTRIENTS, DEFAULT_TRACKED } from "@/utils/nutrientDefaults";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import { FoodEditInput } from "@/components/FoodEditInput";
import { ScrollPicker } from "@/components/ScrollPicker";
import { useUserStore, type FoodItem, type SavedMeal } from "@/stores/useUserStore";
import { Pencil, Heart, Calendar, ChevronDown, ChevronRight, Trash2, Plus, X, Dumbbell, RotateCcw, SlidersHorizontal } from "lucide-react";
import { getCycleInfo, getPhaseDates } from "@/utils/cyclePhase";
import { CycleCalendarView, getPhaseForDay, PHASE_LABELS } from "@/components/CycleCalendarView";
import { ChevronLeft, ChevronRight as ChevRight2 } from "lucide-react";
import { ExerciseEntry } from "@/components/ExerciseEntry";
import type { Exercise, SavedExercise } from "@/stores/useUserStore";
import { cn } from "@/lib/utils";

const GOALS_MAP: Record<string, string> = {
  lose_weight: "Lose weight",
  maintain_weight: "Maintain weight",
  gain_muscle: "Gain muscle",
  reduce_body_fat: "Reduce body fat",
  improve_health: "Improve overall health",
  increase_energy: "Increase energy",
  build_habits: "Build healthier eating habits",
  feel_confident: "Feel more confident",
  improve_mood: "Improve my mood",
  reduce_stress: "Reduce stress",
};

function getMainGoal(goals: string[]): string {
  if (goals.includes("lose_weight") || goals.includes("reduce_body_fat")) return "lose";
  if (goals.includes("gain_muscle")) return "gain";
  if (goals.includes("maintain_weight")) return "maintain";
  return "health";
}

function autoCalcCalories(currentWeight: number, targetWeight: number, age: number, height: number, gender: string, goals: string[], activityLevel: ActivityLevel = "sedentary", goalTimeline: GoalTimeline = "3_4_months"): number {
  return calculateCalories(currentWeight, targetWeight, age, height, gender, goals, activityLevel, goalTimeline);
}

// Weight ranges
const KG_VALUES = Array.from({ length: 201 }, (_, i) => 30 + i);
const LBS_VALUES = Array.from({ length: 441 }, (_, i) => 66 + i);
// Height ranges
const CM_VALUES = Array.from({ length: 121 }, (_, i) => 100 + i);
const FT_INCHES = (() => {
  const vals: string[] = [];
  for (let ft = 3; ft <= 7; ft++) {
    for (let inch = 0; inch < 12; inch++) {
      vals.push(`${ft}'${inch}"`);
    }
  }
  return vals;
})();
// Calorie range
const CAL_VALUES = Array.from({ length: 301 }, (_, i) => 1000 + i * 10);

function kgToLbs(kg: number) { return Math.round(kg * 2.20462); }
function lbsToKg(lbs: number) { return Math.round(lbs / 2.20462); }
function cmToFtStr(cm: number) {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}'${inch}"`;
}
function ftStrToCm(s: string) {
  const match = s.match(/(\d+)'(\d+)"/);
  if (!match) return 170;
  return Math.round((parseInt(match[1]) * 12 + parseInt(match[2])) * 2.54);
}

const Profile = () => {
  const { profile, setProfile } = useUserStore();

  // Unit toggles
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(profile.weightUnit || "kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">(profile.heightUnit || "cm");

  // Edit dialogs
  const [editField, setEditField] = useState<"weight" | "goal" | "height" | "calories" | null>(null);
  const [scrollWeight, setScrollWeight] = useState<number>(profile.currentWeight);
  const [scrollGoalWeight, setScrollGoalWeight] = useState<number>(profile.targetWeight);
  const [scrollHeight, setScrollHeight] = useState<number>(profile.height);
  const [scrollHeightFt, setScrollHeightFt] = useState<string>(cmToFtStr(profile.height));
  const [scrollCalories, setScrollCalories] = useState<number>(profile.dailyCalorieTarget);

  // Other dialogs
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [editGoals, setEditGoals] = useState<string[]>(profile.goals || []);
  const [healthInfoOpen, setHealthInfoOpen] = useState(false);
  const [editGender, setEditGender] = useState(profile.gender || "");
  const [editAge, setEditAge] = useState(profile.age || 25);
  const [editDietPrefs, setEditDietPrefs] = useState<string[]>(profile.dietaryPreferences || []);
  const [editDietRestrictions, setEditDietRestrictions] = useState<string[]>(profile.dietaryRestrictions || []);
  const [editHealthConcerns, setEditHealthConcerns] = useState<string[]>(profile.healthConcerns || []);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [cycleDate, setCycleDate] = useState(profile.cycleStartDate || "");
  const [cycleCalendarMonth, setCycleCalendarMonth] = useState(new Date());
  const [cycleDurationOpen, setCycleDurationOpen] = useState(false);
  const [pendingCycleDuration, setPendingCycleDuration] = useState(profile.cycleDuration || 5);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [createMealName, setCreateMealName] = useState("");
  const [createMealItems, setCreateMealItems] = useState<FoodItem[]>([]);
  const [createMealStep, setCreateMealStep] = useState<"name" | "add">("name");
  const [editingSavedMeal, setEditingSavedMeal] = useState<SavedMeal | null>(null);
  const [editMealItems, setEditMealItems] = useState<FoodItem[]>([]);
  const [editMealName, setEditMealName] = useState("");
  const [editMealAddingItem, setEditMealAddingItem] = useState(false);
  const [editingMealItem, setEditingMealItem] = useState<FoodItem | null>(null);

  // Activity & Timeline modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<ActivityLevel>(profile.activityLevel || "sedentary");
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [pendingTimeline, setPendingTimeline] = useState<GoalTimeline>((profile.goalTimeline as GoalTimeline) || "3_4_months");
  const [nutrientModalOpen, setNutrientModalOpen] = useState(false);
  const [pendingNutrients, setPendingNutrients] = useState<string[]>(profile.trackedNutrients || DEFAULT_TRACKED);
  const [pendingOverrides, setPendingOverrides] = useState<Record<string, number>>(profile.nutrientTargetOverrides || {});
  const [pendingCholesterol, setPendingCholesterol] = useState<string>(profile.cholesterolLevel || "");

  // Weight history management
  const [weightHistoryOpen, setWeightHistoryOpen] = useState(false);
  const [addWeightOpen, setAddWeightOpen] = useState(false);
  const [addWeightDate, setAddWeightDate] = useState<Date | undefined>(new Date());
  const [addWeightValue, setAddWeightValue] = useState<number>(profile.currentWeight);
  const [addWeightUnit, setAddWeightUnit] = useState<"kg" | "lbs">(profile.weightUnit || "kg");
  const [editingWeightDate, setEditingWeightDate] = useState<string | null>(null);

  const bmi = profile.height > 0 ? (profile.currentWeight / ((profile.height / 100) ** 2)).toFixed(1) : "—";

  const displayWeight = weightUnit === "lbs" ? kgToLbs(profile.currentWeight) : profile.currentWeight;
  const displayGoalWeight = weightUnit === "lbs" ? kgToLbs(profile.targetWeight) : profile.targetWeight;
  const displayHeight = heightUnit === "ft" ? cmToFtStr(profile.height) : profile.height;

  const weightData = profile.weightHistory.map((h) => ({
    date: format(new Date(h.date), "MMM d"),
    weight: h.weight,
  }));

  const isWoman = profile.gender === "Female";

  const cycleDay = (() => {
    if (!profile.cycleStartDate) return null;
    const start = new Date(profile.cycleStartDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : null;
  })();

  const toggleInList = (list: string[], item: string) =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const deleteSavedMeal = (mealId: string) => {
    setProfile({ savedMeals: (profile.savedMeals || []).filter((m) => m.id !== mealId) });
  };

  const openEditMeal = (meal: SavedMeal) => {
    setEditingSavedMeal(meal);
    setEditMealName(meal.name);
    setEditMealItems([...meal.items]);
    setEditMealAddingItem(false);
    setEditingMealItem(null);
  };

  const saveEditedMeal = () => {
    if (!editingSavedMeal || editMealItems.length === 0) return;
    const updated = (profile.savedMeals || []).map((m) =>
      m.id === editingSavedMeal.id ? { ...m, name: editMealName.trim() || m.name, items: editMealItems } : m
    );
    setProfile({ savedMeals: updated });
    setEditingSavedMeal(null);
  };

  const removeEditMealItem = (index: number) => {
    setEditMealItems((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteSavedExercise = (exerciseId: string) => {
    setProfile({ savedExercises: (profile.savedExercises || []).filter((e) => e.id !== exerciseId) });
  };

  const savedMeals = profile.savedMeals || [];
  const savedExercises = profile.savedExercises || [];

  // Open edit dialogs
  const openWeightEdit = () => {
    setScrollWeight(weightUnit === "lbs" ? kgToLbs(profile.currentWeight) : profile.currentWeight);
    setEditField("weight");
  };
  const openGoalEdit = () => {
    setScrollGoalWeight(weightUnit === "lbs" ? kgToLbs(profile.targetWeight) : profile.targetWeight);
    setEditField("goal");
  };
  const openHeightEdit = () => {
    if (heightUnit === "ft") {
      setScrollHeightFt(cmToFtStr(profile.height));
    } else {
      setScrollHeight(profile.height);
    }
    setEditField("height");
  };
  const openCaloriesEdit = () => {
    // Snap to nearest 10
    const snapped = Math.round(profile.dailyCalorieTarget / 10) * 10;
    setScrollCalories(Math.max(1000, Math.min(4000, snapped)));
    setEditField("calories");
  };

  const persistToDB = useCallback(async (updates: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("profiles").update(updates).eq("user_id", session.user.id);
  }, []);

  const saveWeight = () => {
    const kgVal = weightUnit === "lbs" ? lbsToKg(scrollWeight) : scrollWeight;
    const today = format(new Date(), "yyyy-MM-dd");
    const newCalories = autoCalcCalories(kgVal, profile.targetWeight, profile.age, profile.height, profile.gender, profile.goals || [], profile.activityLevel, profile.goalTimeline);
    setProfile({
      currentWeight: kgVal,
      weightUnit,
      dailyCalorieTarget: newCalories,
      weightHistory: [
        ...profile.weightHistory.filter((h) => h.date !== today),
        { date: today, weight: kgVal },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    });
    persistToDB({ current_weight: kgVal, weight_unit: weightUnit, daily_calorie_goal: newCalories });
    setEditField(null);
  };

  const saveGoalWeight = () => {
    const kgVal = weightUnit === "lbs" ? lbsToKg(scrollGoalWeight) : scrollGoalWeight;
    const newCalories = autoCalcCalories(profile.currentWeight, kgVal, profile.age, profile.height, profile.gender, profile.goals || [], profile.activityLevel, profile.goalTimeline);
    setProfile({ targetWeight: kgVal, dailyCalorieTarget: newCalories });
    persistToDB({ target_weight: kgVal, daily_calorie_goal: newCalories });
    setEditField(null);
  };

  const saveHeight = () => {
    const cmVal = heightUnit === "ft" ? ftStrToCm(scrollHeightFt) : scrollHeight;
    const newCalories = autoCalcCalories(profile.currentWeight, profile.targetWeight, profile.age, cmVal, profile.gender, profile.goals || [], profile.activityLevel, profile.goalTimeline);
    setProfile({ height: cmVal, heightUnit, dailyCalorieTarget: newCalories });
    persistToDB({ height: cmVal, height_unit: heightUnit, daily_calorie_goal: newCalories });
    setEditField(null);
  };

  const saveCalories = () => {
    setProfile({ dailyCalorieTarget: scrollCalories });
    persistToDB({ daily_calorie_goal: scrollCalories });
    setEditField(null);
  };

  const autoCalcAndSet = () => {
    const cal = autoCalcCalories(profile.currentWeight, profile.targetWeight, profile.age, profile.height, profile.gender, profile.goals || [], profile.activityLevel, profile.goalTimeline);
    const snapped = Math.round(cal / 10) * 10;
    setScrollCalories(Math.max(1000, Math.min(4000, snapped)));
  };

  const EditButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
    >
      <Pencil className="h-3.5 w-3.5 text-foreground" />
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* Row 1: Current KG, Goal KG */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="relative rounded-2xl bg-card border border-border p-4 text-center">
            <EditButton onClick={openWeightEdit} />
            <p className="text-2xl font-bold text-foreground">{displayWeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current {weightUnit}</p>
          </div>
          <div className="relative rounded-2xl bg-card border border-border p-4 text-center">
            <EditButton onClick={openGoalEdit} />
            <p className="text-2xl font-bold text-foreground">{displayGoalWeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Goal {weightUnit}</p>
          </div>
        </div>

        {/* Row 2: BMI, Height */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{bmi}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">BMI</p>
          </div>
          <div className="relative rounded-2xl bg-card border border-border p-4 text-center">
            <EditButton onClick={openHeightEdit} />
            <p className="text-2xl font-bold text-foreground">{displayHeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Height {heightUnit}</p>
          </div>
        </div>

        {/* Row 3: Target daily calories */}
        <div className="relative rounded-2xl bg-card border border-border p-4 text-center mb-6">
          <EditButton onClick={openCaloriesEdit} />
          <p className="text-2xl font-bold text-foreground">{profile.dailyCalorieTarget}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Target net daily calories</p>
        </div>

        {/* Activity Level & Goal Timeline */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="relative rounded-2xl bg-card border border-border p-4 text-center">
            <EditButton onClick={() => setActivityModalOpen(true)} />
            <p className="text-sm font-bold text-foreground">{ACTIVITY_LABELS[profile.activityLevel || "sedentary"]?.label}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Activity Level</p>
          </div>
          <div className="relative rounded-2xl bg-card border border-border p-4 text-center">
            <EditButton onClick={() => setTimelineModalOpen(true)} />
            <p className="text-sm font-bold text-foreground">{TIMELINE_LABELS[(profile.goalTimeline as GoalTimeline) || "3_4_months"]?.label}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Goal Pace</p>
          </div>
        </div>

        {/* Tracked Nutrients */}
        <div className="relative rounded-2xl bg-card border border-border p-4 mb-6">
          <EditButton onClick={() => { setPendingNutrients(profile.trackedNutrients || DEFAULT_TRACKED); setPendingOverrides(profile.nutrientTargetOverrides || {}); setPendingCholesterol(profile.cholesterolLevel || ""); setNutrientModalOpen(true); }} />
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Tracked Nutrients</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(profile.trackedNutrients || DEFAULT_TRACKED).map((key) => {
              const config = AVAILABLE_NUTRIENTS.find((n) => n.key === key);
              return config ? (
                <span key={key} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  {config.label}
                </span>
              ) : null;
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Weight Progress</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeightHistoryOpen(true)}
                className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Pencil className="h-3.5 w-3.5 text-foreground" />
              </button>
            </div>
          </div>
          {weightData.length >= 2 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--foreground))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Log at least 2 weights to see your progress chart</p>
          )}
        </div>

        {/* Cycle tracker */}
        {isWoman && (
          <div className="rounded-2xl bg-card border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">♀</span>
                <h3 className="text-sm font-semibold text-foreground">Cycle Tracker</h3>
              </div>
              <div className="flex items-center gap-2">
                {profile.cycleStartDate && (
                  <button
                    onClick={() => { setProfile({ cycleStartDate: undefined }); }}
                    className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-foreground" />
                  </button>
                )}
                <button
                  onClick={() => { setCycleDate(profile.cycleStartDate || format(new Date(), "yyyy-MM-dd")); setCycleOpen(true); }}
                  className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Pencil className="h-3.5 w-3.5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Period Duration */}
            <button
              onClick={() => { setPendingCycleDuration(profile.cycleDuration || 5); setCycleDurationOpen(true); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-border mb-3 hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm text-foreground">How many days does your period last?</span>
              <span className="text-sm font-semibold text-foreground">{profile.cycleDuration || 5} days</span>
            </button>

            {profile.cycleStartDate ? (
              <div className="space-y-2">
                {/* Current phase badge */}
                {cycleDay !== null && (() => {
                  const currentPhase = getPhaseForDay(cycleDay, profile.cycleDuration || 5);
                  const phaseLabel = PHASE_LABELS.find(p => p.phase === currentPhase);
                  return phaseLabel ? (
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("h-3 w-3 rounded-full", phaseLabel.colorClass)} />
                      <span className="text-sm font-semibold text-foreground">{phaseLabel.label} Phase</span>
                      <span className="text-xs text-muted-foreground">· Day {cycleDay}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Started {format(new Date(profile.cycleStartDate), "MMM d, yyyy")}</span>
                  </div>
                </div>

                {/* Color-coded calendar */}
                <div className="bg-background rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setCycleCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                      <ChevronLeft className="h-4 w-4 text-foreground" />
                    </button>
                    <span className="text-sm font-semibold text-foreground">{format(cycleCalendarMonth, "MMMM yyyy")}</span>
                    <button onClick={() => setCycleCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                      <ChevRight2 className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                  <CycleCalendarView
                    cycleStartDate={profile.cycleStartDate}
                    periodDuration={profile.cycleDuration || 5}
                    currentMonth={cycleCalendarMonth}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Log the first day of your cycle to start tracking</p>
            )}
          </div>
        )}

        {/* Saved Meals */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Saved Meals</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80" onClick={() => { setCreateMealName(""); setCreateMealItems([]); setCreateMealStep("name"); setCreateMealOpen(true); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {savedMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved meals yet.</p>
          ) : (
            <div className="space-y-2">
              {savedMeals.map((meal) => {
                const isExpanded = expandedMeal === meal.id;
                const totalCals = meal.items.reduce((s, i) => s + i.calories, 0);
                return (
                  <div key={meal.id} className="rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setExpandedMeal(isExpanded ? null : meal.id)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-foreground" />}
                        <span className="text-sm font-medium text-foreground">{meal.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{totalCals} kcal</span>
                        <button onClick={(e) => { e.stopPropagation(); openEditMeal(meal); }} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-transform">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteSavedMeal(meal.id); }} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-2 space-y-1 border-t border-border/50">
                        {meal.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-1 pl-5 text-sm">
                            <span className="text-foreground">{item.name}</span>
                            <span className="text-xs text-muted-foreground">{item.quantity ? `${item.quantity} · ` : ""}{item.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saved Exercises */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Saved Exercises</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80" onClick={() => setAddExerciseOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {savedExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved exercises yet.</p>
          ) : (
            <div className="space-y-2">
              {savedExercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{ex.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {ex.secondaryMetric && ex.secondaryUnit
                        ? `${ex.secondaryMetric} ${ex.secondaryUnit} · ${ex.caloriesBurned} kcal`
                        : `${ex.duration}min · ${ex.caloriesBurned} kcal`}
                    </span>
                  </div>
                  <button onClick={() => deleteSavedExercise(ex.id)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Goals */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">My Goals</h3>
            <button
              onClick={() => { setEditGoals(profile.goals || []); setGoalsOpen(true); }}
              className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Pencil className="h-3.5 w-3.5 text-foreground" />
            </button>
          </div>
          {(profile.goals || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(profile.goals || []).map((g) => (
                <span key={g} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{GOALS_MAP[g] || g}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No goals set</p>
          )}
          {profile.goalDate && <p className="text-xs text-muted-foreground mt-2">Target: {profile.goalDate}</p>}
        </div>

        {/* My Information */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">My Information</h3>
            <button
              onClick={() => { setEditGender(profile.gender || ""); setEditAge(profile.age || 25); setEditDietPrefs(profile.dietaryPreferences || []); setEditDietRestrictions(profile.dietaryRestrictions || []); setEditHealthConcerns(profile.healthConcerns || []); setHealthInfoOpen(true); }}
              className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Pencil className="h-3.5 w-3.5 text-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gender</p>
                <p className="text-sm text-foreground">{profile.gender || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Age</p>
                <p className="text-sm text-foreground">{profile.age || "Not set"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dietary Preferences</p>
              {(profile.dietaryPreferences || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">{profile.dietaryPreferences.map((p) => (<span key={p} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">{p}</span>))}</div>
              ) : (<p className="text-sm text-muted-foreground">None</p>)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dietary Restrictions</p>
              {(profile.dietaryRestrictions || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">{profile.dietaryRestrictions.map((r) => (<span key={r} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">{r}</span>))}</div>
              ) : (<p className="text-sm text-muted-foreground">None</p>)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Health Concerns</p>
              {(profile.healthConcerns || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">{profile.healthConcerns.map((h) => (<span key={h} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">{h}</span>))}</div>
              ) : (<p className="text-sm text-muted-foreground">None</p>)}
            </div>
          </div>
        </div>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Edit Weight Dialog */}
      <Dialog open={editField === "weight"} onOpenChange={(o) => { if (!o) setEditField(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit Current Weight</DialogTitle></DialogHeader>
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => { const cur = scrollWeight; setWeightUnit("kg"); setScrollWeight(weightUnit === "lbs" ? lbsToKg(cur) : cur); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${weightUnit === "kg" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>kg</button>
            <button onClick={() => { const cur = scrollWeight; setWeightUnit("lbs"); setScrollWeight(weightUnit === "kg" ? kgToLbs(cur) : cur); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${weightUnit === "lbs" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>lbs</button>
          </div>
          <ScrollPicker
            items={weightUnit === "kg" ? KG_VALUES : LBS_VALUES}
            value={scrollWeight}
            onChange={(v) => setScrollWeight(Number(v))}
            suffix={` ${weightUnit}`}
          />
          <Button onClick={saveWeight} className="w-full rounded-xl h-12 mt-2">Save</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Weight Dialog */}
      <Dialog open={editField === "goal"} onOpenChange={(o) => { if (!o) setEditField(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit Goal Weight</DialogTitle></DialogHeader>
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => { const cur = scrollGoalWeight; setWeightUnit("kg"); setScrollGoalWeight(weightUnit === "lbs" ? lbsToKg(cur) : cur); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${weightUnit === "kg" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>kg</button>
            <button onClick={() => { const cur = scrollGoalWeight; setWeightUnit("lbs"); setScrollGoalWeight(weightUnit === "kg" ? kgToLbs(cur) : cur); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${weightUnit === "lbs" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>lbs</button>
          </div>
          <ScrollPicker
            items={weightUnit === "kg" ? KG_VALUES : LBS_VALUES}
            value={scrollGoalWeight}
            onChange={(v) => setScrollGoalWeight(Number(v))}
            suffix={` ${weightUnit}`}
          />
          <Button onClick={saveGoalWeight} className="w-full rounded-xl h-12 mt-2">Save</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Height Dialog */}
      <Dialog open={editField === "height"} onOpenChange={(o) => { if (!o) setEditField(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit Height</DialogTitle></DialogHeader>
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => { setHeightUnit("cm"); setScrollHeight(heightUnit === "ft" ? ftStrToCm(scrollHeightFt) : scrollHeight); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${heightUnit === "cm" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>cm</button>
            <button onClick={() => { setHeightUnit("ft"); setScrollHeightFt(cmToFtStr(heightUnit === "cm" ? scrollHeight : profile.height)); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${heightUnit === "ft" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>ft</button>
          </div>
          {heightUnit === "cm" ? (
            <ScrollPicker
              items={CM_VALUES}
              value={scrollHeight}
              onChange={(v) => setScrollHeight(Number(v))}
              suffix=" cm"
            />
          ) : (
            <ScrollPicker
              items={FT_INCHES}
              value={scrollHeightFt}
              onChange={(v) => setScrollHeightFt(String(v))}
            />
          )}
          <Button onClick={saveHeight} className="w-full rounded-xl h-12 mt-2">Save</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Calories Dialog */}
      <Dialog open={editField === "calories"} onOpenChange={(o) => { if (!o) setEditField(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Target Net Daily Calories</DialogTitle></DialogHeader>
          <ScrollPicker
            items={CAL_VALUES}
            value={scrollCalories}
            onChange={(v) => setScrollCalories(Number(v))}
            suffix=" kcal"
          />
          <Button variant="outline" onClick={autoCalcAndSet} className="w-full rounded-xl h-10 mt-2 gap-2">
            <RotateCcw className="h-4 w-4" /> Auto-calculate from weight
          </Button>
          <Button onClick={saveCalories} className="w-full rounded-xl h-12 mt-1">Save</Button>
        </DialogContent>
      </Dialog>

      {/* Goals Dialog */}
      <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit Goals</DialogTitle></DialogHeader>
          <div className="space-y-2 pt-2">
            {Object.entries(GOALS_MAP).map(([value, label]) => (
              <button key={value} onClick={() => setEditGoals(toggleInList(editGoals, value))} className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${editGoals.includes(value) ? "border-foreground bg-secondary" : "border-border bg-card"}`}>{label}</button>
            ))}
            <Button onClick={() => { setProfile({ goals: editGoals }); setGoalsOpen(false); }} className="w-full rounded-xl h-12 mt-3">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Information Dialog */}
      <Dialog open={healthInfoOpen} onOpenChange={setHealthInfoOpen}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>My Information</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Gender</p>
              <div className="flex flex-wrap gap-2">
                {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                  <button key={g} onClick={() => setEditGender(g)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${editGender === g ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Age</p>
              <ScrollPicker items={Array.from({ length: 82 }, (_, i) => i + 14)} value={editAge} onChange={(v) => setEditAge(Number(v))} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Dietary Preferences</p>
              <div className="flex flex-wrap gap-2">
                {["Vegetarian", "Vegan", "Pescatarian", "Keto", "Low-carb", "Mediterranean", "None"].map((p) => (
                  <button key={p} onClick={() => setEditDietPrefs(toggleInList(editDietPrefs, p))} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${editDietPrefs.includes(p) ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Dietary Restrictions</p>
              <div className="flex flex-wrap gap-2">
                {["Gluten-free", "Dairy-free", "Lactose intolerance", "Nut allergy", "Shellfish allergy", "Soy allergy", "Egg allergy", "Halal", "Kosher", "None"].map((r) => (
                  <button key={r} onClick={() => setEditDietRestrictions(toggleInList(editDietRestrictions, r))} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${editDietRestrictions.includes(r) ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Health Concerns</p>
              <div className="flex flex-wrap gap-2">
                {["Diabetes", "High blood pressure", "High cholesterol", "Heart disease", "IBS / Digestive issues", "PCOS", "Thyroid issues", "Anemia", "None"].map((h) => (
                  <button key={h} onClick={() => setEditHealthConcerns(toggleInList(editHealthConcerns, h))} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${editHealthConcerns.includes(h) ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}>{h}</button>
                ))}
              </div>
            </div>
            <Button onClick={() => {
              const newCalories = autoCalcCalories(profile.currentWeight, profile.targetWeight, editAge, profile.height, editGender, profile.goals || [], profile.activityLevel, profile.goalTimeline);
              setProfile({ gender: editGender, age: editAge, dietaryPreferences: editDietPrefs, dietaryRestrictions: editDietRestrictions, healthConcerns: editHealthConcerns, dailyCalorieTarget: newCalories });
              setHealthInfoOpen(false);
            }} className="w-full rounded-xl h-12">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cycle Dialog */}
      <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>First Day of Cycle</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input type="date" value={cycleDate} onChange={(e) => setCycleDate(e.target.value)} className="rounded-xl" />
            <Button onClick={() => { setProfile({ cycleStartDate: cycleDate }); setCycleOpen(false); }} className="w-full rounded-xl h-12" disabled={!cycleDate}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Period Duration Dialog */}
      <Dialog open={cycleDurationOpen} onOpenChange={setCycleDurationOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Period Duration</DialogTitle></DialogHeader>
          <ScrollPicker
            items={Array.from({ length: 10 }, (_, i) => i + 1)}
            value={pendingCycleDuration}
            onChange={(v) => setPendingCycleDuration(Number(v))}
            suffix=" days"
          />
          <Button onClick={() => { setProfile({ cycleDuration: pendingCycleDuration }); setCycleDurationOpen(false); }} className="w-full rounded-xl h-12 mt-2">Save</Button>
        </DialogContent>
      </Dialog>


      <Dialog open={createMealOpen} onOpenChange={setCreateMealOpen}>
        <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{createMealStep === "name" ? "Name your meal" : createMealName}</DialogTitle>
          </DialogHeader>
          {createMealStep === "name" ? (
            <div className="space-y-3 pt-2">
              <Input placeholder="e.g. Greek Yogurt Bowl" value={createMealName} onChange={(e) => setCreateMealName(e.target.value)} className="rounded-xl" autoFocus />
              <Button onClick={() => { if (createMealName.trim()) setCreateMealStep("add"); }} className="w-full rounded-xl h-12" disabled={!createMealName.trim()}>Next — Add ingredients</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {createMealItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{createMealItems.length} items · {createMealItems.reduce((s, i) => s + i.calories, 0)} kcal</p>
                  {createMealItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/50">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                        <button onClick={() => setCreateMealItems((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <FoodSearchInput onAddItem={(item) => setCreateMealItems((prev) => [...prev, item])} onClose={() => {}} keepOpenOnAdd />
              <Button onClick={() => { if (createMealItems.length === 0) return; const newMeal = { id: Date.now().toString(), name: createMealName.trim(), items: createMealItems }; setProfile({ savedMeals: [...(profile.savedMeals || []), newMeal] }); setCreateMealOpen(false); }} className="w-full rounded-xl h-12" disabled={createMealItems.length === 0}>Save meal ({createMealItems.length} items)</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Saved Meal Dialog */}
      <Dialog open={!!editingSavedMeal} onOpenChange={(o) => { if (!o) { setEditingSavedMeal(null); setEditingMealItem(null); } }}>
        <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Meal</DialogTitle></DialogHeader>
          {editingMealItem ? (
            <FoodEditInput item={editingMealItem} onSave={(updated) => { setEditMealItems((prev) => prev.map((it) => it.id === updated.id ? updated : it)); setEditingMealItem(null); }} onCancel={() => setEditingMealItem(null)} />
          ) : (
            <div className="space-y-3">
              <Input value={editMealName} onChange={(e) => setEditMealName(e.target.value)} className="rounded-xl font-medium" placeholder="Meal name" />
              {editMealItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{editMealItems.length} items · {editMealItems.reduce((s, i) => s + i.calories, 0)} kcal</p>
                  {editMealItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/50">
                      <div className="flex flex-col min-w-0 flex-1 mr-2">
                        <span className="text-sm text-foreground break-words">{item.name}</span>
                        {item.quantity && <span className="text-[10px] text-muted-foreground">{item.quantity}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                        <button onClick={() => setEditingMealItem(item)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => removeEditMealItem(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editMealAddingItem ? (
                <FoodSearchInput onAddItem={(item) => { setEditMealItems((prev) => [...prev, item]); setEditMealAddingItem(false); }} onClose={() => setEditMealAddingItem(false)} />
              ) : (
                <Button variant="outline" className="w-full rounded-xl h-10" onClick={() => setEditMealAddingItem(true)}><Plus className="h-4 w-4 mr-2" /> Add ingredient</Button>
              )}
              <Button onClick={saveEditedMeal} className="w-full rounded-xl h-12" disabled={editMealItems.length === 0 || !editMealName.trim()}>Save changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Weight History Dialog */}
      <Dialog open={weightHistoryOpen} onOpenChange={setWeightHistoryOpen}>
        <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Weight History</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 gap-2"
              onClick={() => {
                setAddWeightDate(new Date());
                setAddWeightUnit(weightUnit);
                setAddWeightValue(weightUnit === "lbs" ? kgToLbs(profile.currentWeight) : profile.currentWeight);
                setEditingWeightDate(null);
                setAddWeightOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add weight entry
            </Button>
            {profile.weightHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No weight entries yet</p>
            ) : (
              <div className="space-y-1.5">
                {[...profile.weightHistory].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => {
                  const displayW = weightUnit === "lbs" ? kgToLbs(entry.weight) : entry.weight;
                  return (
                    <div key={entry.date} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{displayW} {weightUnit}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(entry.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingWeightDate(entry.date);
                            setAddWeightDate(new Date(entry.date));
                            setAddWeightUnit(weightUnit);
                            setAddWeightValue(weightUnit === "lbs" ? kgToLbs(entry.weight) : entry.weight);
                            setAddWeightOpen(true);
                          }}
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-transform"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setProfile({
                              weightHistory: profile.weightHistory.filter((h) => h.date !== entry.date),
                            });
                          }}
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Weight Entry Dialog */}
      <Dialog open={addWeightOpen} onOpenChange={(o) => { if (!o) setAddWeightOpen(false); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>{editingWeightDate ? "Edit Weight Entry" : "Add Weight Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Unit toggle */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  const cur = addWeightValue;
                  setAddWeightUnit("kg");
                  setAddWeightValue(addWeightUnit === "lbs" ? lbsToKg(cur) : cur);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${addWeightUnit === "kg" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}
              >kg</button>
              <button
                onClick={() => {
                  const cur = addWeightValue;
                  setAddWeightUnit("lbs");
                  setAddWeightValue(addWeightUnit === "kg" ? kgToLbs(cur) : cur);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${addWeightUnit === "lbs" ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}
              >lbs</button>
            </div>

            {/* Date picker */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Date</p>
              <CalendarWidget
                mode="single"
                selected={addWeightDate}
                onSelect={setAddWeightDate}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
              />
            </div>

            {/* Weight scroller */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Weight</p>
              <ScrollPicker
                items={addWeightUnit === "kg" ? KG_VALUES : LBS_VALUES}
                value={addWeightValue}
                onChange={(v) => setAddWeightValue(Number(v))}
                suffix={` ${addWeightUnit}`}
              />
            </div>

            <Button
              onClick={() => {
                if (!addWeightDate) return;
                const dateStr = format(addWeightDate, "yyyy-MM-dd");
                const kgVal = addWeightUnit === "lbs" ? lbsToKg(addWeightValue) : addWeightValue;

                // Remove old entry if editing
                let history = editingWeightDate
                  ? profile.weightHistory.filter((h) => h.date !== editingWeightDate)
                  : profile.weightHistory.filter((h) => h.date !== dateStr);

                history = [...history, { date: dateStr, weight: kgVal }].sort((a, b) => a.date.localeCompare(b.date));

                // Update current weight if this is today's entry or the most recent
                const mostRecent = history[history.length - 1];
                const updates: any = { weightHistory: history };
                if (mostRecent.date === dateStr) {
                  updates.currentWeight = kgVal;
                  updates.dailyCalorieTarget = autoCalcCalories(kgVal, profile.targetWeight, profile.age, profile.height, profile.gender, profile.goals || [], profile.activityLevel, profile.goalTimeline);
                }

                setProfile(updates);
                setAddWeightOpen(false);
              }}
              className="w-full rounded-xl h-12"
              disabled={!addWeightDate}
            >
              {editingWeightDate ? "Save changes" : "Add entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exercise Dialog (for saved exercises) */}
      <ExerciseEntry
        open={addExerciseOpen}
        onOpenChange={setAddExerciseOpen}
        onAdd={(exercise: Exercise) => {
          const newSaved: SavedExercise = {
            id: Date.now().toString(),
            name: exercise.name,
            duration: exercise.duration,
            caloriesBurned: exercise.caloriesBurned,
            secondaryMetric: exercise.secondaryMetric,
            secondaryUnit: exercise.secondaryUnit,
          };
          setProfile({ savedExercises: [...(profile.savedExercises || []), newSaved] });
          setAddExerciseOpen(false);
        }}
      />

      {/* Activity Level Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Activity Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {ACTIVITY_OPTIONS.map((level) => (
              <button
                key={level}
                onClick={() => setPendingActivity(level)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  pendingActivity === level ? "border-foreground bg-secondary" : "border-border bg-card"
                }`}
              >
                <span className="font-medium text-foreground">{ACTIVITY_LABELS[level].label}</span>
                <p className="text-sm text-muted-foreground mt-0.5">{ACTIVITY_LABELS[level].description}</p>
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              const newCalories = autoCalcCalories(profile.currentWeight, profile.targetWeight, profile.age, profile.height, profile.gender, profile.goals || [], pendingActivity, (profile.goalTimeline as GoalTimeline) || "3_4_months");
              setProfile({ activityLevel: pendingActivity, dailyCalorieTarget: newCalories });
              persistToDB({ activity_level: pendingActivity, daily_calorie_goal: newCalories });
              setActivityModalOpen(false);
            }}
            className="w-full rounded-xl h-12 mt-2"
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      {/* Goal Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Goal Pace</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {TIMELINE_OPTIONS.map((timeline) => (
              <button
                key={timeline}
                onClick={() => setPendingTimeline(timeline)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  pendingTimeline === timeline ? "border-foreground bg-secondary" : "border-border bg-card"
                }`}
              >
                <span className="font-medium text-foreground">{TIMELINE_LABELS[timeline].label}</span>
                <p className="text-sm text-muted-foreground mt-0.5">{TIMELINE_LABELS[timeline].description}</p>
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              const newCalories = autoCalcCalories(profile.currentWeight, profile.targetWeight, profile.age, profile.height, profile.gender, profile.goals || [], profile.activityLevel, pendingTimeline);
              setProfile({ goalTimeline: pendingTimeline, dailyCalorieTarget: newCalories });
              persistToDB({ goal_timeline: pendingTimeline, daily_calorie_goal: newCalories });
              setTimelineModalOpen(false);
            }}
            className="w-full rounded-xl h-12 mt-2"
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tracked Nutrients Modal */}
      <Dialog open={nutrientModalOpen} onOpenChange={setNutrientModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tracked Nutrients</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Choose which nutrients to display on your homepage ring.</p>
          <div className="space-y-2 mt-3">
            {AVAILABLE_NUTRIENTS.map((nutrient) => {
              const isEnabled = pendingNutrients.includes(nutrient.key);
              return (
                <button
                  key={nutrient.key}
                  onClick={() => {
                    setPendingNutrients((prev) =>
                      prev.includes(nutrient.key)
                        ? prev.filter((k) => k !== nutrient.key)
                        : [...prev, nutrient.key]
                    );
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                    isEnabled ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}
                >
                  <div>
                    <span className="font-medium text-foreground text-sm">{nutrient.label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isEnabled ? "border-foreground bg-foreground" : "border-muted-foreground"
                  }`}>
                    {isEnabled && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            onClick={() => {
              setProfile({ trackedNutrients: pendingNutrients });
              setNutrientModalOpen(false);
            }}
            className="w-full rounded-xl h-12 mt-2"
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
