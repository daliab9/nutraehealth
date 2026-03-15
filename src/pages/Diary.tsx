import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CalendarStrip } from "@/components/CalendarStrip";
import { NutrientRingCarousel, type TrackedNutrient } from "@/components/NutrientRingCarousel";
import { MealSection } from "@/components/MealSection";
import { BottomNav } from "@/components/BottomNav";
import { ExerciseEntry } from "@/components/ExerciseEntry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Dumbbell, Pencil, Plus, X, Utensils, Sunrise, Sun, Moon, Apple, Pill, GlassWater, CircleDot, Heart } from "lucide-react";
import { useUserStore, type Exercise, type FoodItem, type SavedMeal, type SavedExercise, type MealEntry, type PoopEntry } from "@/stores/useUserStore";
import { toast } from "sonner";
import { CyclePhaseCard } from "@/components/CyclePhaseCard";
import { AVAILABLE_NUTRIENTS } from "@/utils/nutrientDefaults";

const MEAL_TYPES = [
  { type: "breakfast", title: "Breakfast", icon: Sunrise },
  { type: "lunch", title: "Lunch", icon: Sun },
  { type: "dinner", title: "Dinner", icon: Moon },
  { type: "snack", title: "Snack", icon: Apple },
  { type: "supplements", title: "Supplements", icon: Pill },
  { type: "drinks", title: "Drinks", icon: GlassWater },
] as const;

const POOP_GROUPS = [
  { id: "hard", label: "Hard / Constipated", types: [1, 2] },
  { id: "normal", label: "Normal / Healthy", types: [3, 4] },
  { id: "loose", label: "Loose / Diarrhea", types: [5, 6, 7] },
];

const Diary = () => {
  const {
    profile, setProfile, diary, getDayEntry, addFoodToMeal, removeFoodFromMeal,
    updateFoodInMeal, addExercise, removeExercise, updateExercise, getDayTotals,
    getHealthEntry, setHealthEntry, moveFoodBetweenMeals, mergeItemsIntoGroup,
    addFoodToGroup, removeFoodFromGroup,
  } = useUserStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [activeSection, setActiveSection] = useState<"meals" | "exercise" | "poop">("meals");
  const [addingPoopType, setAddingPoopType] = useState(false);

  // Drag and drop state
  const [activeDragItem, setActiveDragItem] = useState<FoodItem | null>(null);
  const [mergeData, setMergeData] = useState<{
    sourceItem: FoodItem;
    sourceMealType: string;
    targetItem: FoodItem;
    targetMealType: string;
  } | null>(null);
  const [mergeMealName, setMergeMealName] = useState("");

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { distance: 8 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const dayEntry = getDayEntry(dateKey);
  const totals = getDayTotals(dateKey);
  const healthEntry = getHealthEntry(dateKey);

  const poopEntries = healthEntry.poopEntries || [];

  const addPoopEntry = (type: number) => {
    const newEntry: PoopEntry = { id: crypto.randomUUID(), type };
    const updated = [...poopEntries, newEntry];
    setHealthEntry(dateKey, { ...healthEntry, poopCount: updated.length, poopEntries: updated });
    setAddingPoopType(false);
  };

  const removePoopEntry = (id: string) => {
    const updated = poopEntries.filter(e => e.id !== id);
    setHealthEntry(dateKey, { ...healthEntry, poopCount: updated.length, poopEntries: updated });
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
    setProfile({ savedMeals: [...(profile.savedMeals || []), meal] });
  };

  const handleUnsaveMeal = (mealName: string) => {
    setProfile({ savedMeals: (profile.savedMeals || []).filter((m) => m.name.toLowerCase() !== mealName.toLowerCase()) });
  };

  const handleAddToSavedMeal = (mealId: string, item: FoodItem) => {
    setProfile({
      savedMeals: (profile.savedMeals || []).map((m) =>
        m.id === mealId
          ? { ...m, items: [...m.items, { ...item, id: Date.now().toString(), groupId: undefined, groupName: undefined }] }
          : m
      ),
    });
  };

  const isExerciseSaved = (name: string) => {
    return (profile.savedExercises || []).some((e) => e.name.toLowerCase() === name.toLowerCase());
  };

  const handleToggleSaveExercise = (ex: Exercise) => {
    const saved = profile.savedExercises || [];
    if (isExerciseSaved(ex.name)) {
      setProfile({ savedExercises: saved.filter((e) => e.name.toLowerCase() !== ex.name.toLowerCase()) });
    } else {
      setProfile({
        savedExercises: [...saved, {
          id: Date.now().toString(),
          name: ex.name,
          duration: ex.duration,
          caloriesBurned: ex.caloriesBurned,
          secondaryMetric: ex.secondaryMetric,
          secondaryUnit: ex.secondaryUnit,
        }],
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.item) setActiveDragItem(data.item as FoodItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const sourceData = active.data.current as { type: string; mealType: string; itemId: string; item: FoodItem };
    const overData = over.data.current as { type: string; mealType: string; itemId?: string; item?: FoodItem; groupId?: string };

    if (!sourceData || !overData) return;

    // Dropped on a meal group header → add to that group
    if (overData.type === "meal-group" && overData.groupId) {
      const sourceItem = sourceData.item;
      // Find the group name from current items
      const mealItems = getMealItems(overData.mealType);
      const groupItem = mealItems.find((i) => i.groupId === overData.groupId);
      const groupName = groupItem?.groupName || "Meal";

      if (sourceData.mealType !== overData.mealType) {
        // Move between sections first, then add to group
        moveFoodBetweenMeals(dateKey, sourceData.mealType as MealEntry["type"], overData.mealType as MealEntry["type"], sourceData.itemId);
        // After moving, update the item to be in the group
        setTimeout(() => {
          updateFoodInMeal(dateKey, overData.mealType as MealEntry["type"], {
            ...sourceItem,
            groupId: overData.groupId,
            groupName,
          });
        }, 0);
      } else if (sourceItem.groupId !== overData.groupId) {
        // Same section, just update group
        updateFoodInMeal(dateKey, sourceData.mealType as MealEntry["type"], {
          ...sourceItem,
          groupId: overData.groupId,
          groupName,
        });
      }
      toast.success(`Added to "${groupName}"`);
      return;
    }

    if (overData.type === "meal-section" && sourceData.mealType !== overData.mealType) {
      // Move item to a different meal section (strips group info)
      moveFoodBetweenMeals(dateKey, sourceData.mealType as MealEntry["type"], overData.mealType as MealEntry["type"], sourceData.itemId);
      toast.success(`Moved to ${MEAL_TYPES.find(m => m.type === overData.mealType)?.title || overData.mealType}`);
    } else if (overData.type === "meal-section" && sourceData.mealType === overData.mealType && sourceData.item.groupId) {
      // Dropped on own section zone while in a group → remove from group
      removeFoodFromGroup(dateKey, sourceData.mealType as MealEntry["type"], sourceData.itemId);
      toast.success("Removed from meal group");
    } else if (overData.type === "food-item" && sourceData.itemId !== overData.itemId) {
      // If target has a groupId, add source to that group
      if (overData.item?.groupId) {
        updateFoodInMeal(dateKey, sourceData.mealType as MealEntry["type"], {
          ...sourceData.item,
          groupId: overData.item.groupId,
          groupName: overData.item.groupName,
        });
        toast.success(`Added to "${overData.item.groupName}"`);
      } else {
        // Dropped on another ungrouped food item → show merge dialog
        setMergeData({
          sourceItem: sourceData.item,
          sourceMealType: sourceData.mealType,
          targetItem: overData.item!,
          targetMealType: overData.mealType,
        });
        setMergeMealName("");
      }
    }
  };

  const handleConfirmMerge = () => {
    if (!mergeData || !mergeMealName.trim()) return;
    mergeItemsIntoGroup(
      dateKey,
      { mealType: mergeData.sourceMealType as MealEntry["type"], itemId: mergeData.sourceItem.id },
      { mealType: mergeData.targetMealType as MealEntry["type"], itemId: mergeData.targetItem.id },
      mergeMealName.trim()
    );
    toast.success(`Created meal "${mergeMealName.trim()}"`);
    setMergeData(null);
    setMergeMealName("");
  };

  const alerts = healthAlerts();
  const netCalories = totals.calories - totals.exerciseCals;
  const totalFoodCals = totals.calories;

  const trackedNutrients: TrackedNutrient[] = useMemo(() => {
    const tracked = profile.trackedNutrients || ["calories", "protein", "fiber"];
    const microMap: Record<string, number> = {
      protein: totals.protein,
      fiber: totals.fiber,
      iron: totals.iron,
      vitamin_d: totals.vitamin_d,
      magnesium: totals.magnesium,
      omega3: totals.omega3,
      b12: totals.b12,
    };
    return tracked.map((key) => {
      const config = AVAILABLE_NUTRIENTS.find((n) => n.key === key);
      if (!config) return null;
      let value = 0;
      let target = config.getTarget({ currentWeight: profile.currentWeight, gender: profile.gender, age: profile.age, dietaryPreferences: profile.dietaryPreferences });
      if (key === "calories") {
        value = netCalories;
        target = profile.dailyCalorieTarget;
      } else {
        value = Math.round((microMap[key] || 0) * 10) / 10;
      }
      return { key, label: config.label, value, target, unit: config.unit };
    }).filter(Boolean) as TrackedNutrient[];
  }, [profile, netCalories, totals]);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Date header + Calendar */}
      <div className="pt-12 px-5">
        <h1 className="text-lg font-bold text-foreground mb-1">
          {format(selectedDate, "EEEE, MMM d")}
        </h1>
        <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>

      {/* Nutrient ring carousel */}
      <div className="flex flex-col items-center py-6">
        <NutrientRingCarousel nutrients={trackedNutrients} />
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

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="rounded-2xl bg-card border border-border p-4">
                <div className="divide-y divide-border">
                  {MEAL_TYPES.map(({ type, title, icon }) => (
                    <MealSection
                      key={type}
                      title={title}
                      icon={icon}
                      mealType={type}
                      items={getMealItems(type)}
                      onAddItem={(item) => addFoodToMeal(dateKey, type as any, item)}
                      onRemoveItem={(itemId) => removeFoodFromMeal(dateKey, type as any, itemId)}
                      onUpdateItem={(item) => updateFoodInMeal(dateKey, type as any, item)}
                      onAddItems={(items) => items.forEach(item => addFoodToMeal(dateKey, type as any, item))}
                      pastItems={getPastItemsForMealType(type)}
                      savedMeals={profile.savedMeals || []}
                      onSaveMeal={handleSaveMeal}
                      onUnsaveMeal={handleUnsaveMeal}
                      onAddToSavedMeal={handleAddToSavedMeal}
                      onAddToGroup={(groupId, groupName, item) => addFoodToGroup(dateKey, type as any, groupId, groupName, item)}
                      onRemoveFromGroup={(itemId) => removeFoodFromGroup(dateKey, type as any, itemId)}
                    />
                  ))}
                </div>
              </div>
              <DragOverlay>
                {activeDragItem && (
                  <div className="px-4 py-2.5 rounded-xl bg-card border border-border shadow-xl flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{activeDragItem.name}</span>
                    <span className="text-xs text-muted-foreground">{activeDragItem.calories} kcal</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
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
              <div className="space-y-1.5">
                {dayEntry.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-[#e4e7c6]">
                    <div className="flex flex-col min-w-0 flex-1 mr-2">
                      <span className="text-sm text-foreground font-bold break-words">{ex.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {ex.secondaryMetric && ex.secondaryUnit
                          ? `${ex.secondaryMetric} ${ex.secondaryUnit} · -${ex.caloriesBurned} kcal`
                          : `${ex.duration}min · -${ex.caloriesBurned} kcal`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleSaveExercise(ex)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-foreground transition-colors active:scale-95"
                      >
                        <Heart className={`h-5 w-5 ${isExerciseSaved(ex.name) ? "fill-foreground" : ""}`} />
                      </button>
                      <button
                        onClick={() => setEditingExercise(ex)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeExercise(dateKey, ex.id)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors active:scale-95"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No exercises logged yet</p>
            )}
          </div>
        )}

        {activeSection === "poop" && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Bowel Movements</h3>
                {poopEntries.length > 0 && (
                  <span className="text-sm text-muted-foreground font-semibold">{poopEntries.length}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80" onClick={() => setAddingPoopType(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {poopEntries.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {poopEntries.map((entry) => {
                  const group = POOP_GROUPS.find(g => g.types.includes(entry.type));
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-[#e4e7c6]">
                      <span className="text-sm font-medium text-foreground">{group?.label}</span>
                      <button
                        onClick={() => removePoopEntry(entry.id)}
                        className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {addingPoopType && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">What type?</p>
                  <button onClick={() => setAddingPoopType(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {POOP_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => addPoopEntry(g.types[g.types.length - 1])}
                      className="px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left active:scale-[0.98]"
                    >
                      <p className="text-sm font-semibold text-foreground">{g.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {poopEntries.length === 0 && !addingPoopType && (
              <p className="text-sm text-muted-foreground text-center py-2">No bowel movements logged yet</p>
            )}
          </div>
        )}
      </div>

      {profile.gender === "Female" && profile.cycleStartDate && activeSection !== "poop" && (
        <div className="px-5 mt-4">
          <CyclePhaseCard cycleStartDate={profile.cycleStartDate} context={activeSection === "exercise" ? "exercise" : "meals"} />
        </div>
      )}

      {/* Merge dialog */}
      <Dialog open={!!mergeData} onOpenChange={(o) => { if (!o) { setMergeData(null); setMergeMealName(""); } }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Create a meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Combine <span className="font-medium text-foreground">{mergeData?.sourceItem.name}</span> and <span className="font-medium text-foreground">{mergeData?.targetItem.name}</span> into a meal group.
            </p>
            <Input
              placeholder="Meal name"
              value={mergeMealName}
              onChange={(e) => setMergeMealName(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
            <Button onClick={handleConfirmMerge} className="w-full rounded-xl h-12" disabled={!mergeMealName.trim()}>
              Create meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseEntry
        open={exerciseOpen || !!editingExercise}
        onOpenChange={(o) => {
          if (!o) { setExerciseOpen(false); setEditingExercise(null); }
        }}
        onAdd={(ex) => {
          if (editingExercise) {
            updateExercise(dateKey, { ...ex, id: editingExercise.id });
          } else {
            handleAddExercise(ex);
          }
          setEditingExercise(null);
        }}
        editExercise={editingExercise}
      />

      <BottomNav />
    </div>
  );
};

export default Diary;
