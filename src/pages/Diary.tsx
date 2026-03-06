import { useState } from "react";
import { format } from "date-fns";
import { CalendarStrip } from "@/components/CalendarStrip";
import { CircularProgress } from "@/components/CircularProgress";
import { MealSection } from "@/components/MealSection";
import { BottomNav } from "@/components/BottomNav";
import { ExerciseEntry } from "@/components/ExerciseEntry";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, Dumbbell, Pencil, Plus, Utensils } from "lucide-react";
import { useUserStore, type Exercise } from "@/stores/useUserStore";

const MEAL_TYPES = [
  { type: "breakfast", title: "Breakfast", emoji: "🌅" },
  { type: "lunch", title: "Lunch", emoji: "☀️" },
  { type: "dinner", title: "Dinner", emoji: "🌙" },
  { type: "snack", title: "Snack", emoji: "🍎" },
  { type: "supplements", title: "Supplements", emoji: "💊" },
  { type: "drinks", title: "Drinks", emoji: "🥤" },
] as const;

const Diary = () => {
  const { profile, diary, getDayEntry, addFoodToMeal, addExercise, getDayTotals, getHealthEntry, setHealthEntry } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(true);
  const [poopEditing, setPoopEditing] = useState(false);

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const dayEntry = getDayEntry(dateKey);
  const totals = getDayTotals(dateKey);
  const healthEntry = getHealthEntry(dateKey);

  const poopSaved = healthEntry.poopCount > 0 && !poopEditing;

  const updatePoop = (value: number) => {
    setHealthEntry(dateKey, { ...healthEntry, poopCount: value });
  };

  const getMealItems = (type: string) => {
    const meal = dayEntry.meals.find((m) => m.type === type);
    return meal?.items || [];
  };

  const allPastItems = Object.values(diary).flatMap((day) =>
    day.meals.flatMap((m) => m.items)
  );

  const healthAlerts = () => {
    const alerts: string[] = [];
    const concerns = profile.healthConcerns;
    if (concerns.includes("High cholesterol") && totals.fat > 80) {
      alerts.push("High fat intake today — watch cholesterol");
    }
    if (concerns.includes("Iron deficiency") && totals.calories > 0 && totals.protein < 30) {
      alerts.push("Consider iron-rich foods today");
    }
    if (concerns.includes("B12 deficiency") && totals.calories > 0) {
      alerts.push("Remember to include B12-rich foods");
    }
    return alerts;
  };

  const handleAddExercise = (exercise: Exercise) => {
    addExercise(dateKey, exercise);
    setExerciseOpen(false);
  };

  const alerts = healthAlerts();
  const netCalories = totals.calories - totals.exerciseCals;
  const totalFoodCals = totals.calories;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Calendar */}
      <div className="pt-12 px-4">
        <h1 className="text-lg font-bold text-foreground mb-1">
          {format(selectedDate, "EEEE, MMM d")}
        </h1>
        <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>

      {/* Calorie ring + macros */}
      <div className="flex flex-col items-center py-6">
        <CircularProgress value={Math.max(0, netCalories)} max={profile.dailyCalorieTarget} />
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totals.protein}g</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totals.carbs}g</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totals.fat}g</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fat</p>
          </div>
        </div>
      </div>

      {/* Health alerts */}
      {alerts.length > 0 && (
        <div className="px-4 mb-4 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 border border-accent/20">
              <AlertTriangle className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-sm text-foreground">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Food section - collapsible */}
      <div className="px-4 space-y-3">
        <Collapsible open={foodOpen} onOpenChange={setFoodOpen}>
          <div className="rounded-2xl bg-card border border-border p-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Food</h3>
                {totalFoodCals > 0 && (
                  <span className="text-sm text-muted-foreground">{totalFoodCals} kcal</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${foodOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 divide-y divide-border">
                {MEAL_TYPES.map(({ type, title, emoji }) => (
                  <MealSection
                    key={type}
                    title={title}
                    emoji={emoji}
                    items={getMealItems(type)}
                    onAddItem={(item) => addFoodToMeal(dateKey, type as any, item)}
                    pastItems={allPastItems}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Exercise section */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Exercise</h3>
              {totals.exerciseCals > 0 && (
                <span className="text-sm text-muted-foreground">-{totals.exerciseCals} kcal</span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setExerciseOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {dayEntry.exercises.length > 0 ? (
            <div className="space-y-2">
              {dayEntry.exercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between py-1.5 px-2">
                  <span className="text-sm text-foreground">{ex.name} · {ex.duration}min</span>
                  <span className="text-sm text-muted-foreground">-{ex.caloriesBurned} kcal</span>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={() => setExerciseOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
              <Plus className="h-3.5 w-3.5" />
              Add exercise
            </button>
          )}
        </div>

        {/* Bowel Movements */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💩</span>
              <h3 className="font-semibold text-foreground">Bowel Movements</h3>
            </div>
            {poopSaved ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{healthEntry.poopCount}</span>
                <button
                  onClick={() => setPoopEditing(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { if (healthEntry.poopCount > 0) updatePoop(healthEntry.poopCount - 1); }}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg active:scale-95 transition-transform"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-foreground w-6 text-center">
                  {healthEntry.poopCount}
                </span>
                <button
                  onClick={() => updatePoop(healthEntry.poopCount + 1)}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg active:scale-95 transition-transform"
                >
                  +
                </button>
                {healthEntry.poopCount > 0 && (
                  <button
                    onClick={() => setPoopEditing(false)}
                    className="ml-2 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold active:scale-95 transition-transform"
                  >
                    Save
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ExerciseEntry open={exerciseOpen} onOpenChange={setExerciseOpen} onAdd={handleAddExercise} />
      <BottomNav />
    </div>
  );
};

export default Diary;
