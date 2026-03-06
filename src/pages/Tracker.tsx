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
type ExerciseMetric = "minutes" | "count";

const Tracker = () => {
  const { getDayTotals, diary, profile, getHealthEntry, health } = useUserStore();
  const [range, setRange] = useState<Range>("week");
  const [exerciseMetric, setExerciseMetric] = useState<ExerciseMetric>("minutes");

  const numDays = range === "week" ? 7 : 30;
  const dateFormat = range === "week" ? "EEE" : "d";
  const rangeLabel = range === "week" ? "Last 7 days" : "Last 30 days";

  const relevantDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = numDays - 1; i >= 0; i--) {
      keys.add(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return keys;
  }, [numDays]);

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

  const emotionFrequency = useMemo(() => {
    const freq: Record<string, { count: number; isPositive: boolean }> = {};
    Object.entries(health).forEach(([dateKey, entry]) => {
      if (!relevantDateKeys.has(dateKey)) return;
      const full = { positiveEmotions: [] as string[], negativeEmotions: [] as string[], ...entry };
      full.positiveEmotions.forEach((e) => {
        if (!freq[e]) freq[e] = { count: 0, isPositive: true };
        freq[e].count += 1;
      });
      full.negativeEmotions.forEach((e) => {
        if (!freq[e]) freq[e] = { count: 0, isPositive: false };
        freq[e].count += 1;
      });
    });
    return Object.entries(freq)
      .map(([name, { count, isPositive }]) => ({ name, count, isPositive }))
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
    return Object.values(foodMap).sort((a, b) => b.totalCals - a.totalCals).slice(0, 8);
  }, [diary, relevantDateKeys]);

  const exerciseByType = useMemo(() => {
    const exMap: Record<string, { name: string; count: number; totalMinutes: number }> = {};
    Object.entries(diary).forEach(([dateKey, day]) => {
      if (!relevantDateKeys.has(dateKey)) return;
      day.exercises.forEach((ex) => {
        if (!exMap[ex.name]) {
          exMap[ex.name] = { name: ex.name, count: 0, totalMinutes: 0 };
        }
        exMap[ex.name].count += 1;
        exMap[ex.name].totalMinutes += ex.duration;
      });
    });
    return Object.values(exMap).sort((a, b) =>
      exerciseMetric === "minutes" ? b.totalMinutes - a.totalMinutes : b.count - a.count
    );
  }, [diary, relevantDateKeys, exerciseMetric]);

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

  const chartBarSize = range === "week" ? 40 : 12;

  const maxFoodVal = allFoods.length > 0 ? Math.max(...allFoods.map(f => f.totalCals)) : 1;
  const maxEmotionVal = emotionFrequency.length > 0 ? Math.max(...emotionFrequency.map(e => e.count)) : 1;
  const maxExTypeVal = exerciseByType.length > 0
    ? Math.max(...exerciseByType.map(e => exerciseMetric === "minutes" ? e.totalMinutes : e.count))
    : 1;

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
              <div className="h-2.5 w-2.5 rounded-full bg-chart-protein" />
              <span className="text-[10px] text-muted-foreground">Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-chart-carbs" />
              <span className="text-[10px] text-muted-foreground">Carbs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-chart-fat" />
              <span className="text-[10px] text-muted-foreground">Fat</span>
            </div>
          </div>
        </div>

        {/* Most eaten foods - horizontal bar chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Most eaten foods</h3>
          {allFoods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No food logged yet</p>
          ) : (
            <div className="space-y-2.5">
              {allFoods.map((f) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground truncate max-w-[60%]">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">{f.totalCals} kcal · {f.count}x</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${(f.totalCals / maxFoodVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <Bar dataKey="exercise" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exercise by type - horizontal bar chart */}
        {exerciseByType.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">By exercise type</h3>
              <div className="flex rounded-lg bg-muted p-0.5">
                <button
                  onClick={() => setExerciseMetric("minutes")}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    exerciseMetric === "minutes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Minutes
                </button>
                <button
                  onClick={() => setExerciseMetric("count")}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    exerciseMetric === "count" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Count
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {exerciseByType.map((e) => {
                const val = exerciseMetric === "minutes" ? e.totalMinutes : e.count;
                return (
                  <div key={e.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground truncate max-w-[60%]">{e.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {exerciseMetric === "minutes" ? `${val} min` : `${val}x`}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${(val / maxExTypeVal) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                <Bar dataKey="poop" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
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
                <Bar dataKey="positiveCount" name="Positive" fill="hsl(var(--chart-positive-dark))" radius={[4, 4, 0, 0]} maxBarSize={range === "week" ? 20 : 8} />
                <Bar dataKey="negativeCount" name="Negative" fill="hsl(var(--chart-negative-dark))" radius={[4, 4, 0, 0]} maxBarSize={range === "week" ? 20 : 8} />
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

        {/* Most frequent emotions - horizontal bar chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Frequent emotions</h3>
          {emotionFrequency.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emotions logged yet</p>
          ) : (
            <div className="space-y-2.5">
              {emotionFrequency.map((e) => (
                <div key={e.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground">{e.name}</span>
                    <span className="text-[10px] text-muted-foreground">{e.count} days</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(e.count / maxEmotionVal) * 100}%`,
                        backgroundColor: e.isPositive
                          ? "hsl(var(--chart-positive-dark))"
                          : "hsl(var(--chart-negative-dark))",
                      }}
                    />
                  </div>
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
