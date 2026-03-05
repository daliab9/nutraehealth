import { useMemo } from "react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";

const Tracker = () => {
  const { getDayTotals, diary, profile } = useUserStore();

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, "yyyy-MM-dd");
      const totals = getDayTotals(key);
      days.push({
        day: format(date, "EEE"),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        exercise: totals.exerciseCals,
      });
    }
    return days;
  }, [getDayTotals, diary]);

  const allFoods = useMemo(() => {
    const foodMap: Record<string, { name: string; count: number; totalCals: number }> = {};
    Object.values(diary).forEach((day) => {
      day.meals.forEach((meal) => {
        meal.items.forEach((item) => {
          if (!foodMap[item.name]) {
            foodMap[item.name] = { name: item.name, count: 0, totalCals: 0 };
          }
          foodMap[item.name].count += 1;
          foodMap[item.name].totalCals += item.calories;
        });
      });
    });
    return Object.values(foodMap).sort((a, b) => b.totalCals - a.totalCals).slice(0, 5);
  }, [diary]);

  const allExercises = useMemo(() => {
    const exMap: Record<string, { name: string; count: number; totalCals: number }> = {};
    Object.values(diary).forEach((day) => {
      day.exercises.forEach((ex) => {
        if (!exMap[ex.name]) {
          exMap[ex.name] = { name: ex.name, count: 0, totalCals: 0 };
        }
        exMap[ex.name].count += 1;
        exMap[ex.name].totalCals += ex.caloriesBurned;
      });
    });
    return Object.values(exMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [diary]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Tracker</h1>

        {/* Calorie chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Daily Calories</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar
                  dataKey="calories"
                  fill="hsl(var(--foreground))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Macros</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar dataKey="protein" fill="hsl(var(--chart-protein))" radius={[4, 4, 0, 0]} stackId="macros" maxBarSize={32} />
                <Bar dataKey="carbs" fill="hsl(var(--chart-carbs))" radius={[0, 0, 0, 0]} stackId="macros" maxBarSize={32} />
                <Bar dataKey="fat" fill="hsl(var(--chart-fat))" radius={[0, 0, 0, 0]} stackId="macros" maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-protein))" }} />
              <span className="text-[10px] text-muted-foreground">Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-carbs))" }} />
              <span className="text-[10px] text-muted-foreground">Carbs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-fat))" }} />
              <span className="text-[10px] text-muted-foreground">Fat</span>
            </div>
          </div>
        </div>

        {/* Exercise chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Exercise</h3>
          <p className="text-xs text-muted-foreground mb-4">Calories burned · last 7 days</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar
                  dataKey="exercise"
                  fill="hsl(var(--accent))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most eaten foods */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Most eaten foods</h3>
          {allFoods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No food logged yet</p>
          ) : (
            <div className="space-y-2">
              {allFoods.map((f, i) => (
                <div key={f.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm text-foreground">{f.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{f.totalCals} kcal · {f.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most frequent exercises */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Frequent exercises</h3>
          {allExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exercises logged yet</p>
          ) : (
            <div className="space-y-2">
              {allExercises.map((e, i) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm text-foreground">{e.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{e.totalCals} kcal · {e.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Tracker;
