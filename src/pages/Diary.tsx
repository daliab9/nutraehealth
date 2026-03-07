import { useState } from "react";
import { format } from "date-fns";
import { CalendarStrip } from "@/components/CalendarStrip";
import { CircularProgress } from "@/components/CircularProgress";
import { MealSection } from "@/components/MealSection";
import { BottomNav } from "@/components/BottomNav";
import { ExerciseEntry } from "@/components/ExerciseEntry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Dumbbell, Pencil, Plus, Utensils, X, Sunrise, Sun, Moon, Apple, Pill, GlassWater, CircleDot } from "lucide-react";
import { useUserStore, type Exercise, type SavedMeal } from "@/stores/useUserStore";

const MEAL_TYPES = [
  { type: "breakfast", title: "Breakfast", icon: Sunrise },
  { type: "lunch", title: "Lunch", icon: Sun },
  { type: "dinner", title: "Dinner", icon: Moon },
  { type: "snack", title: "Snack", icon: Apple },
  { type: "supplements", title: "Supplements", icon: Pill },
  { type: "drinks", title: "Drinks", icon: GlassWater },
] as const;

const Diary = () => {
  const { profile, setProfile, diary, getDayEntry, addFoodToMeal, removeFoodFromMeal, updateFoodInMeal, addExercise, removeExercise, updateExercise, getDayTotals, getHealthEntry, setHealthEntry } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [poopEditing, setPoopEditing] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exEditForm, setExEditForm] = useState({ duration: "", caloriesBurned: "" });
  const [activeSection, setActiveSection] = useState<"meals" | "exercise" | "poop">("meals");

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

  const getPastItemsForMealType = (mealType: string) => {
    return Object.values(diary).flatMap((day) =>
      day.meals.filter((m) => m.type === mealType).flatMap((m) => m.items)
    );
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

  const handleAddExercise = (exercise: Exercise) => {
    addExercise(dateKey, exercise);
    setExerciseOpen(false);
  };

  const handleSaveMeal = (meal: SavedMeal) => {
    setProfile({
      savedMeals: [...(profile.savedMeals || []), meal],
    });
  };

  const alerts = healthAlerts();
  const netCalories = totals.calories - totals.exerciseCals;
  const totalFoodCals = totals.calories;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Calendar at top */}
      <div className="pt-12 px-5">
        <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>

      {/* Calorie ring */}
      <div className="flex flex-col items-center py-6">
        <CircularProgress value={Math.max(0, netCalories)} max={profile.dailyCalorieTarget} />
      </div>

      {/* Category pills */}
      <div className="flex items-center justify-center gap-4 px-5 mb-4">
        <button
          onClick={() => setActiveSection("meals")}
          className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
            activeSection === "meals" ? "bg-foreground text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          <Utensils className="h-5 w-5" />
          <span className="font-semibold text-base">Meals</span>
        </button>
        <button
          onClick={() => setActiveSection("exercise")}
          className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
            activeSection === "exercise" ? "bg-foreground text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="font-semibold text-base">Exercise</span>
        </button>
        <button
          onClick={() => setActiveSection("poop")}
          className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
            activeSection === "poop" ? "bg-foreground text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          <CircleDot className="h-5 w-5" />
          <span className="font-semibold text-base">Poop</span>
        </button>
      </div>

      {/* Health alerts */}
      {alerts.length > 0 && (
        <div className="px-5 mb-4 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 border border-accent/20">
              <AlertTriangle className="h-4 w-4 text-foreground flex-shrink-0" />
              <span className="text-sm text-foreground">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active section content */}
      <div className="px-5 space-y-3">
        {activeSection === "meals" && (
          <>
            {/* Macros row */}
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totals.protein}g</p>
                <p className="text-muted-foreground uppercase tracking-widest text-xs">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totals.carbs}g</p>
                <p className="text-muted-foreground uppercase tracking-widest text-xs">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totals.fat}g</p>
                <p className="text-muted-foreground uppercase tracking-widest text-xs">Fat</p>
              </div>
              {totalFoodCals > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{totalFoodCals}</p>
                  <p className="text-muted-foreground uppercase tracking-widest text-xs">Total</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="divide-y divide-border">
                {MEAL_TYPES.map(({ type, title, icon }) => (
                  <MealSection
                    key={type}
                    title={title}
                    icon={icon}
                    items={getMealItems(type)}
                    onAddItem={(item) => addFoodToMeal(dateKey, type as any, item)}
                    onRemoveItem={(itemId) => removeFoodFromMeal(dateKey, type as any, itemId)}
                    onUpdateItem={(item) => updateFoodInMeal(dateKey, type as any, item)}
                    onAddItems={(items) => items.forEach(item => addFoodToMeal(dateKey, type as any, item))}
                    pastItems={getPastItemsForMealType(type)}
                    savedMeals={profile.savedMeals || []}
                    onSaveMeal={handleSaveMeal}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === "exercise" && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Exercise</h3>
                {totals.exerciseCals > 0 && (
                  <span className="text-sm text-muted-foreground font-semibold">-{totals.exerciseCals} kcal</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80" onClick={() => setExerciseOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {dayEntry.exercises.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dayEntry.exercises.map((ex) => (
                  <div key={ex.id} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-[#e4e7c6]">
                    <span className="text-sm text-foreground font-bold">{ex.name}</span>
                    <span className="text-muted-foreground text-sm font-sans font-semibold">{ex.duration}min · -{ex.caloriesBurned} kcal</span>
                    <button
                      onClick={() => {
                        setEditingExercise(ex);
                        setExEditForm({ duration: String(ex.duration), caloriesBurned: String(ex.caloriesBurned) });
                      }}
                      className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeExercise(dateKey, ex.id)}
                      className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => setExerciseOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                <Plus className="h-3.5 w-3.5" />
                Add exercise
              </button>
            )}
          </div>
        )}

        {activeSection === "poop" && (
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex flex-col items-center gap-4">
              <CircleDot className="h-8 w-8 text-foreground" />
              <h3 className="font-semibold text-foreground text-lg">Bowel Movements</h3>
              {poopSaved ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-foreground">{healthEntry.poopCount}</span>
                  <button
                    onClick={() => setPoopEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-action-button text-foreground text-xs font-medium hover:opacity-80 transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { if (healthEntry.poopCount > 0) updatePoop(healthEntry.poopCount - 1); }}
                    className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-xl active:scale-95 transition-transform"
                  >
                    −
                  </button>
                  <span className="text-4xl font-bold text-foreground w-8 text-center">
                    {healthEntry.poopCount}
                  </span>
                  <button
                    onClick={() => updatePoop(healthEntry.poopCount + 1)}
                    className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-xl active:scale-95 transition-transform"
                  >
                    +
                  </button>
                  {healthEntry.poopCount > 0 && (
                    <button
                      onClick={() => setPoopEditing(false)}
                      className="ml-2 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold active:scale-95 transition-transform"
                    >
                      Save
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ExerciseEntry open={exerciseOpen} onOpenChange={setExerciseOpen} onAdd={handleAddExercise} />

      {/* Edit exercise dialog */}
      <Dialog open={!!editingExercise} onOpenChange={(o) => !o && setEditingExercise(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit {editingExercise?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Duration (min)</label>
              <Input
                type="number"
                value={exEditForm.duration}
                onChange={(e) => setExEditForm((f) => ({ ...f, duration: e.target.value }))}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Calories burned</label>
              <Input
                type="number"
                value={exEditForm.caloriesBurned}
                onChange={(e) => setExEditForm((f) => ({ ...f, caloriesBurned: e.target.value }))}
                className="rounded-xl mt-1"
              />
            </div>
            <Button
              onClick={() => {
                if (!editingExercise) return;
                updateExercise(dateKey, {
                  ...editingExercise,
                  duration: Number(exEditForm.duration) || 0,
                  caloriesBurned: Number(exEditForm.caloriesBurned) || 0,
                });
                setEditingExercise(null);
              }}
              className="w-full rounded-xl h-12"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Diary;
