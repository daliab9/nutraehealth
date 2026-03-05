import { useState } from "react";
import { format } from "date-fns";
import { CalendarStrip } from "@/components/CalendarStrip";
import { CircularProgress } from "@/components/CircularProgress";
import { MealSection } from "@/components/MealSection";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Dumbbell, Plus } from "lucide-react";
import { useUserStore, type Exercise } from "@/stores/useUserStore";

const Diary = () => {
  const { profile, getDayEntry, addFoodToMeal, addExercise, getDayTotals } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [exName, setExName] = useState("");
  const [exDuration, setExDuration] = useState("");

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const dayEntry = getDayEntry(dateKey);
  const totals = getDayTotals(dateKey);

  const getMealItems = (type: string) => {
    const meal = dayEntry.meals.find((m) => m.type === type);
    return meal?.items || [];
  };

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

  const handleAddExercise = () => {
    if (!exName || !exDuration) return;
    const dur = Number(exDuration);
    const calsBurned = Math.round(dur * 7); // rough estimate
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: exName,
      duration: dur,
      caloriesBurned: calsBurned,
    };
    addExercise(dateKey, exercise);
    setExName("");
    setExDuration("");
    setExerciseOpen(false);
  };

  const alerts = healthAlerts();
  const netCalories = totals.calories - totals.exerciseCals;

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
        <CircularProgress
          value={Math.max(0, netCalories)}
          max={profile.dailyCalorieTarget}
        />
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
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 border border-accent/20"
            >
              <AlertTriangle className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-sm text-foreground">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Meal sections */}
      <div className="px-4 space-y-3">
        <MealSection
          title="Breakfast"
          emoji="🌅"
          items={getMealItems("breakfast")}
          onAddItem={(item) => addFoodToMeal(dateKey, "breakfast", item)}
        />
        <MealSection
          title="Lunch"
          emoji="☀️"
          items={getMealItems("lunch")}
          onAddItem={(item) => addFoodToMeal(dateKey, "lunch", item)}
        />
        <MealSection
          title="Dinner"
          emoji="🌙"
          items={getMealItems("dinner")}
          onAddItem={(item) => addFoodToMeal(dateKey, "dinner", item)}
        />
        <MealSection
          title="Snack"
          emoji="🍎"
          items={getMealItems("snack")}
          onAddItem={(item) => addFoodToMeal(dateKey, "snack", item)}
        />

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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setExerciseOpen(true)}
            >
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
            <button
              onClick={() => setExerciseOpen(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add exercise
            </button>
          )}
        </div>
      </div>

      {/* Exercise dialog */}
      <Dialog open={exerciseOpen} onOpenChange={setExerciseOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Exercise name"
              value={exName}
              onChange={(e) => setExName(e.target.value)}
              className="rounded-xl"
            />
            <Input
              placeholder="Duration (minutes)"
              type="number"
              value={exDuration}
              onChange={(e) => setExDuration(e.target.value)}
              className="rounded-xl"
            />
            <Button
              onClick={handleAddExercise}
              className="w-full rounded-xl h-12"
              disabled={!exName || !exDuration}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Diary;
