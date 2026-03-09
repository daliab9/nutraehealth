import { useState } from "react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import { FoodEditInput } from "@/components/FoodEditInput";
import { useUserStore, type FoodItem, type SavedMeal } from "@/stores/useUserStore";
import { Scale, Ruler, Target, Pencil, Heart, Calendar, ChevronDown, ChevronRight, Trash2, Bookmark, Plus, X, Dumbbell } from "lucide-react";

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

const Profile = () => {
  const { profile, setProfile } = useUserStore();
  const [weightOpen, setWeightOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editCalories, setEditCalories] = useState(String(profile.dailyCalorieTarget));
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [editGoals, setEditGoals] = useState<string[]>(profile.goals || []);
  const [healthInfoOpen, setHealthInfoOpen] = useState(false);
  const [editDietPrefs, setEditDietPrefs] = useState<string[]>(profile.dietaryPreferences || []);
  const [editDietRestrictions, setEditDietRestrictions] = useState<string[]>(profile.dietaryRestrictions || []);
  const [editHealthConcerns, setEditHealthConcerns] = useState<string[]>(profile.healthConcerns || []);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [cycleDate, setCycleDate] = useState(profile.cycleStartDate || "");
  const [editHeightOpen, setEditHeightOpen] = useState(false);
  const [editHeight, setEditHeight] = useState(String(profile.height));
  const [editTargetWeightOpen, setEditTargetWeightOpen] = useState(false);
  const [editTargetWeight, setEditTargetWeight] = useState(String(profile.targetWeight));
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [createMealName, setCreateMealName] = useState("");
  const [createMealItems, setCreateMealItems] = useState<FoodItem[]>([]);
  const [createMealStep, setCreateMealStep] = useState<"name" | "add">("name");
  const [editingSavedMeal, setEditingSavedMeal] = useState<SavedMeal | null>(null);
  const [editMealItems, setEditMealItems] = useState<FoodItem[]>([]);
  const [editMealName, setEditMealName] = useState("");
  const [editMealAddingItem, setEditMealAddingItem] = useState(false);
  const [editingMealItem, setEditingMealItem] = useState<FoodItem | null>(null);

  const bmi = profile.height > 0 ? (profile.currentWeight / ((profile.height / 100) ** 2)).toFixed(1) : "—";

  const handleAddWeight = () => {
    if (!newWeight) return;
    const w = Number(newWeight);
    const today = format(new Date(), "yyyy-MM-dd");
    setProfile({
      currentWeight: w,
      weightHistory: [
        ...profile.weightHistory.filter((h) => h.date !== today),
        { date: today, weight: w },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    });
    setNewWeight("");
    setWeightOpen(false);
  };

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
    setProfile({
      savedMeals: (profile.savedMeals || []).filter((m) => m.id !== mealId),
    });
  };

  const deleteSavedExercise = (exerciseId: string) => {
    setProfile({
      savedExercises: (profile.savedExercises || []).filter((e) => e.id !== exerciseId),
    });
  };

  const savedMeals = profile.savedMeals || [];
  const savedExercises = profile.savedExercises || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => { setNewWeight(String(profile.currentWeight)); setWeightOpen(true); }} className="rounded-2xl bg-card border border-border p-4 text-center transition-colors hover:bg-accent/20">
            <Scale className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.currentWeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current kg</p>
          </button>
          <button onClick={() => { setEditHeight(String(profile.height)); setEditHeightOpen(true); }} className="rounded-2xl bg-card border border-border p-4 text-center transition-colors hover:bg-accent/20">
            <Ruler className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.height}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Height cm</p>
          </button>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">BMI</p>
            <p className="text-2xl font-bold text-foreground">{bmi}</p>
          </div>
          <button onClick={() => { setEditTargetWeight(String(profile.targetWeight)); setEditTargetWeightOpen(true); }} className="rounded-2xl bg-card border border-border p-4 text-center transition-colors hover:bg-accent/20">
            <Target className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.targetWeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Goal kg</p>
          </button>
        </div>

        {/* Weight tracking */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Weight Progress</h3>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setWeightOpen(true)}>Log weight</Button>
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
                <Heart className="h-4 w-4 text-pink-500" />
                <h3 className="text-sm font-semibold text-foreground">Cycle Tracker</h3>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => { setCycleDate(profile.cycleStartDate || format(new Date(), "yyyy-MM-dd")); setCycleOpen(true); }}>
                {profile.cycleStartDate ? "Update" : "Set start date"}
              </Button>
            </div>
            {profile.cycleStartDate ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Started {format(new Date(profile.cycleStartDate), "MMM d, yyyy")}</span>
                </div>
                {cycleDay !== null && <span className="text-sm font-semibold text-foreground">Day {cycleDay}</span>}
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
              <Bookmark className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Saved Meals</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80" onClick={() => { setCreateMealName(""); setCreateMealItems([]); setCreateMealStep("name"); setCreateMealOpen(true); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {savedMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved meals yet. Save meals from the diary to quickly add them later.</p>
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
              <Dumbbell className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Saved Exercises</h3>
            </div>
          </div>
          {savedExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved exercises yet. Save exercises from the diary using the heart icon.</p>
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
            <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => { setEditGoals(profile.goals || []); setGoalsOpen(true); }}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
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

        {/* My Health Information */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">My Health Information</h3>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => { setEditDietPrefs(profile.dietaryPreferences || []); setEditDietRestrictions(profile.dietaryRestrictions || []); setEditHealthConcerns(profile.healthConcerns || []); setHealthInfoOpen(true); }}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>
          <div className="space-y-3">
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

        {/* Settings */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Settings</h3>
          <button onClick={() => setSettingsOpen(true)} className="w-full text-left text-sm text-foreground py-2">Edit daily calorie target</button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Log Weight</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Weight (kg)" type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="rounded-xl" />
            <Button onClick={handleAddWeight} className="w-full rounded-xl h-12" disabled={!newWeight}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editHeightOpen} onOpenChange={setEditHeightOpen}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Edit Height</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Height (cm)" type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className="rounded-xl" />
            <Button onClick={() => { setProfile({ height: Number(editHeight) }); setEditHeightOpen(false); }} className="w-full rounded-xl h-12" disabled={!editHeight}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editTargetWeightOpen} onOpenChange={setEditTargetWeightOpen}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Edit Target Weight</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Target weight (kg)" type="number" value={editTargetWeight} onChange={(e) => setEditTargetWeight(e.target.value)} className="rounded-xl" />
            <Button onClick={() => { setProfile({ targetWeight: Number(editTargetWeight) }); setEditTargetWeightOpen(false); }} className="w-full rounded-xl h-12" disabled={!editTargetWeight}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Daily Calorie Target</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Calories" type="number" value={editCalories} onChange={(e) => setEditCalories(e.target.value)} className="rounded-xl" />
            <Button onClick={() => { setProfile({ dailyCalorieTarget: Number(editCalories) }); setSettingsOpen(false); }} className="w-full rounded-xl h-12">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={healthInfoOpen} onOpenChange={setHealthInfoOpen}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>My Health Information</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
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
            <Button onClick={() => { setProfile({ dietaryPreferences: editDietPrefs, dietaryRestrictions: editDietRestrictions, healthConcerns: editHealthConcerns }); setHealthInfoOpen(false); }} className="w-full rounded-xl h-12">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>First Day of Cycle</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input type="date" value={cycleDate} onChange={(e) => setCycleDate(e.target.value)} className="rounded-xl" />
            <Button onClick={() => { setProfile({ cycleStartDate: cycleDate }); setCycleOpen(false); }} className="w-full rounded-xl h-12" disabled={!cycleDate}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Meal Dialog */}
      <Dialog open={createMealOpen} onOpenChange={setCreateMealOpen}>
        <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{createMealStep === "name" ? "Name your meal" : createMealName}</DialogTitle>
          </DialogHeader>
          {createMealStep === "name" ? (
            <div className="space-y-3 pt-2">
              <Input
                placeholder="e.g. Greek Yogurt Bowl"
                value={createMealName}
                onChange={(e) => setCreateMealName(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
              <Button
                onClick={() => { if (createMealName.trim()) setCreateMealStep("add"); }}
                className="w-full rounded-xl h-12"
                disabled={!createMealName.trim()}
              >
                Next — Add ingredients
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {createMealItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {createMealItems.length} items · {createMealItems.reduce((s, i) => s + i.calories, 0)} kcal
                  </p>
                  {createMealItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/50">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                        <button onClick={() => setCreateMealItems((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <FoodSearchInput
                onAddItem={(item) => setCreateMealItems((prev) => [...prev, item])}
                onClose={() => {}}
                keepOpenOnAdd
              />
              <Button
                onClick={() => {
                  if (createMealItems.length === 0) return;
                  const newMeal = {
                    id: Date.now().toString(),
                    name: createMealName.trim(),
                    items: createMealItems,
                  };
                  setProfile({ savedMeals: [...(profile.savedMeals || []), newMeal] });
                  setCreateMealOpen(false);
                }}
                className="w-full rounded-xl h-12"
                disabled={createMealItems.length === 0}
              >
                Save meal ({createMealItems.length} items)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
