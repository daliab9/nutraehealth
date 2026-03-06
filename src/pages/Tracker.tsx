import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";

type Range = "week" | "month";

const Tracker = () => {
  const { getDayTotals, diary, profile, getHealthEntry, health } = useUserStore();
  const [range, setRange] = useState<Range>("week");

  const numDays = range === "week" ? 7 : 30;
  const dateFormat = range === "week" ? "EEE" : "d";
  const rangeLabel = range === "week" ? "Last 7 days" : "Last 30 days";

  const physicalData = useMemo(() => {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, "yyyy-MM-dd");
      const totals = getDayTotals(key);
      days.push({
        day: format(date, dateFormat),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        exercise: totals.exerciseCals,
      });
    }
    return days;
  }, [getDayTotals, diary, numDays, dateFormat]);

  const mentalData = useMemo(() => {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, "yyyy-MM-dd");
      const entry = getHealthEntry(key);
      days.push({
        day: format(date, dateFormat),
        sleep: entry.sleepQuality,
        stress: entry.stressLevel,
        positiveCount: entry.positiveEmotions.length,
        negativeCount: entry.negativeEmotions.length,
        poop: entry.poopCount,
      });
    }
    return days;
  }, [getHealthEntry, health, numDays, dateFormat]);

  // Filter relevant date keys for lists
  const relevantDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = numDays - 1; i >= 0; i--) {
      keys.add(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return keys;
  }, [numDays]);

  const emotionFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    Object.entries(health).forEach(([dateKey, entry]) => {
      if (!relevantDateKeys.has(dateKey)) return;
      const full = { positiveEmotions: [], negativeEmotions: [], ...entry };
      [...full.positiveEmotions, ...full.negativeEmotions].forEach((e) => {
        freq[e] = (freq[e] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [health, relevantDateKeys]);

  const allFoods = useMemo(() => {
    const foodMap: Record<string, { name: string; count: number; totalCals: number }> = {};
    Object.entries(diary).forEach(([dateKey, day]) => {
      if (!relevantDateKeys.has(dateKey)) return;
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
  }, [diary, relevantDateKeys]);

  const allExercises = useMemo(() => {
    const exMap: Record<string, { name: string; count: number; totalCals: number }> = {};
    Object.entries(diary).forEach(([dateKey, day]) => {
      if (!relevantDateKeys.has(dateKey)) return;
      day.exercises.forEach((ex) => {
        if (!exMap[ex.name]) {
          exMap[ex.name] = { name: ex.name, count: 0, totalCals: 0 };
        }
        exMap[ex.name].count += 1;
        exMap[ex.name].totalCals += ex.caloriesBurned;
      });
    });
    return Object.values(exMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [diary, relevantDateKeys]);

  const poopTotal = useMemo(() => {
    return mentalData.reduce((sum, d) => sum + d.poop, 0);
  }, [mentalData]);

  const poopAvg = numDays > 0 ? (poopTotal / numDays).toFixed(1) : "0";

  const RangeToggle = () => (
    <div className="flex rounded-xl bg-muted p-0.5 mb-6">
      <button
        onClick={() => setRange("week")}
        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
          range === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => setRange("month")}
        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
          range === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        Monthly
      </button>
    </div>
  );

  const chartBarSize = range === "week" ? 32 : 8;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Tracker</h1>

        <RangeToggle />

        {/* Calorie chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Daily Calories</h3>
          <p className="text-xs text-muted-foreground mb-4">{rangeLabel}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "month" ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide />
                <Bar dataKey="calories" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Macros</h3>
          <p className="text-xs text-muted-foreground mb-4">{rangeLabel}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "month" ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide />
                <Bar dataKey="protein" fill="hsl(var(--chart-protein))" radius={[4, 4, 0, 0]} stackId="macros" maxBarSize={chartBarSize} />
                <Bar dataKey="carbs" fill="hsl(var(--chart-carbs))" radius={[0, 0, 0, 0]} stackId="macros" maxBarSize={chartBarSize} />
                <Bar dataKey="fat" fill="hsl(var(--chart-fat))" radius={[0, 0, 0, 0]} stackId="macros" maxBarSize={chartBarSize} />
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
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Exercise</h3>
          <p className="text-xs text-muted-foreground mb-4">Calories burned · {rangeLabel.toLowerCase()}</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "month" ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide />
                <Bar dataKey="exercise" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bowel movements */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Bowel Movements 💩</h3>
            <div className="text-right">
              <span className="text-lg font-bold text-foreground">{poopAvg}</span>
              <span className="text-xs text-muted-foreground ml-1">avg/day</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{rangeLabel} · total: {poopTotal}</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentalData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "month" ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide />
                <Bar dataKey="poop" fill="hsl(var(--chart-5, var(--foreground)))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mental: Sleep & Stress */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Sleep & Stress</h3>
          <p className="text-xs text-muted-foreground mb-4">{rangeLabel} · scale 1–5</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mentalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "month" ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide domain={[0, 5]} />
                <Line type="monotone" dataKey="sleep" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={range === "week" ? { r: 3 } : false} />
                <Line type="monotone" dataKey="stress" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={range === "week" ? { r: 3 } : false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
              <span className="text-[10px] text-muted-foreground">Sleep</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
              <span className="text-[10px] text-muted-foreground">Stress</span>
            </div>
          </div>
        </div>

        {/* Mental: Emotion counts */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Emotions</h3>
          <p className="text-xs text-muted-foreground mb-4">Positive vs negative · {rangeLabel.toLowerCase()}</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "month" ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide />
                <Bar dataKey="positiveCount" name="Positive" fill="hsl(var(--chart-positive-dark))" radius={[4, 4, 0, 0]} maxBarSize={range === "week" ? 16 : 6} />
                <Bar dataKey="negativeCount" name="Negative" fill="hsl(var(--chart-negative-dark))" radius={[4, 4, 0, 0]} maxBarSize={range === "week" ? 16 : 6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-positive-dark))" }} />
                <span className="text-[10px] text-muted-foreground">Positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-negative-dark))" }} />
                <span className="text-[10px] text-muted-foreground">Negative</span>
              </div>
          </div>
        </div>

        {/* Most frequent emotions */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Most frequent emotions</h3>
          {emotionFrequency.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emotions logged yet</p>
          ) : (
            <div className="space-y-2">
              {emotionFrequency.map((e, i) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm text-foreground">{e.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{e.count}x</span>
                </div>
              ))}
            </div>
          )}
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
