import { useState, useMemo } from "react";
import { format, subDays, startOfWeek } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";

type Range = "week" | "month";
type ExerciseMetric = "minutes" | "count";

const SLEEP_LABELS = ["Terrible", "Poor", "Fair", "Good", "Great"];
const STRESS_LABELS = ["Very Low", "Low", "Moderate", "High", "Very High"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-semibold text-foreground">
          {p.value} {p.dataKey === "calories" || p.dataKey === "exercise" ? "kcal" : ""}
        </p>
      ))}
    </div>
  );
};

const MacroTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => {
        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
        const names: Record<string, string> = { protein: "Protein", carbs: "Carbs", fat: "Fat" };
        return (
          <p key={p.dataKey} className="text-sm text-foreground">
            <span style={{ color: p.fill }} className="font-semibold">{names[p.dataKey] || p.dataKey}</span>: {p.value}g ({pct}%)
          </p>
        );
      })}
    </div>
  );
};

const PoopTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const names: Record<string, string> = { poopHard: "Hard", poopNormal: "Normal", poopLoose: "Loose" };
  const colors: Record<string, string> = { poopHard: "hsl(var(--destructive))", poopNormal: "hsl(var(--primary))", poopLoose: "hsl(var(--accent))" };
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label} · {total} total</p>
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <p key={p.dataKey} className="text-sm text-foreground">
          <span style={{ color: colors[p.dataKey] }} className="font-semibold">{names[p.dataKey]}</span>: {p.value}
        </p>
      ))}
    </div>
  );
};

const Tracker = () => {
  const { getDayTotals, diary, profile, getHealthEntry, health } = useUserStore();
  const [range, setRange] = useState<Range>("week");
  const [exerciseMetric, setExerciseMetric] = useState<ExerciseMetric>("minutes");

  const numDays = range === "week" ? 7 : 30;
  const rangeLabel = range === "week" ? "Last 7 days" : "Last 30 days";

  const relevantDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = numDays - 1; i >= 0; i--) {
      keys.add(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return keys;
  }, [numDays]);

  const getDateLabel = (date: Date): string => {
    if (range === "week") return format(date, "EEE");
    const ws = startOfWeek(date, { weekStartsOn: 1 });
    return format(ws, "MMM d");
  };

  const physicalData = useMemo(() => {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, "yyyy-MM-dd");
      const totals = getDayTotals(key);
      days.push({
        day: getDateLabel(date),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        exercise: totals.exerciseCals,
      });
    }
    return days;
  }, [getDayTotals, diary, numDays, range]);

  const mentalData = useMemo(() => {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, "yyyy-MM-dd");
      const entry = getHealthEntry(key);
      const poopEntries = entry.poopEntries || [];
      const hard = poopEntries.filter(e => [1, 2].includes(e.type)).length;
      const normal = poopEntries.filter(e => [3, 4].includes(e.type)).length;
      const loose = poopEntries.filter(e => [5, 6, 7].includes(e.type)).length;
      // fallback: if no typed entries but has count, put all in normal
      const fallbackNormal = poopEntries.length === 0 && entry.poopCount > 0 ? entry.poopCount : 0;
      days.push({
        day: getDateLabel(date),
        sleep: entry.sleepQuality,
        stress: entry.stressLevel,
        positiveCount: entry.positiveEmotions.length,
        negativeCount: entry.negativeEmotions.length,
        poop: entry.poopCount,
        poopHard: hard,
        poopNormal: normal + fallbackNormal,
        poopLoose: loose,
      });
    }
    return days;
  }, [getHealthEntry, health, numDays, range]);

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

  // Sort by count (frequency), not by calories
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
    return Object.values(foodMap).sort((a, b) => b.count - a.count).slice(0, 8);
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

  const exercisePieData = useMemo(() => {
    return exerciseByType.map((e) => ({
      name: e.name,
      value: exerciseMetric === "minutes" ? e.totalMinutes : e.count,
    }));
  }, [exerciseByType, exerciseMetric]);

  const exercisePieTotal = useMemo(() => {
    return exercisePieData.reduce((sum, d) => sum + d.value, 0);
  }, [exercisePieData]);

  const PIE_COLORS = [
    "hsl(var(--foreground))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--chart-protein))",
    "hsl(var(--chart-carbs))",
    "hsl(var(--chart-fat))",
    "hsl(var(--accent))",
  ];

  const sleepDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    Object.entries(health).forEach(([dateKey, entry]) => {
      if (!relevantDateKeys.has(dateKey)) return;
      const val = entry.sleepQuality || 0;
      if (val >= 1 && val <= 5) counts[val - 1] += 1;
    });
    return SLEEP_LABELS.map((label, i) => ({ name: label, count: counts[i] }));
  }, [health, relevantDateKeys]);

  const stressDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    Object.entries(health).forEach(([dateKey, entry]) => {
      if (!relevantDateKeys.has(dateKey)) return;
      const val = entry.stressLevel || 0;
      if (val >= 1 && val <= 5) counts[val - 1] += 1;
    });
    return STRESS_LABELS.map((label, i) => ({ name: label, count: counts[i] }));
  }, [health, relevantDateKeys]);

  const poopTotal = useMemo(() => {
    return mentalData.reduce((sum, d) => sum + d.poop, 0);
  }, [mentalData]);

  const poopAvg = numDays > 0 ? (poopTotal / numDays).toFixed(1) : "0";

  const RangeToggle = () => (
    <div className="flex rounded-xl bg-muted p-0.5 mb-6">
      <button
        onClick={() => setRange("week")}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
          range === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => setRange("month")}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
          range === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        Monthly
      </button>
    </div>
  );

  const chartBarSize = range === "week" ? 40 : 14;
  const tickFontSize = range === "month" ? 10 : 13;

  const maxFoodVal = allFoods.length > 0 ? Math.max(...allFoods.map((f) => f.count)) : 1;
  const maxEmotionVal = emotionFrequency.length > 0 ? Math.max(...emotionFrequency.map((e) => e.count)) : 1;
  const maxSleepVal = Math.max(...sleepDistribution.map((d) => d.count), 1);
  const maxStressVal = Math.max(...stressDistribution.map((d) => d.count), 1);

  const monthlyInterval = range === "month" ? 6 : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Tracker</h1>

        <RangeToggle />

        {/* Calorie chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Daily Calories</h3>
          <p className="text-sm text-muted-foreground mb-4">{rangeLabel}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={monthlyInterval} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calories" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Macros</h3>
          <p className="text-sm text-muted-foreground mb-4">{rangeLabel}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={monthlyInterval} />
                <YAxis hide />
                <Tooltip content={<MacroTooltip />} />
                <Bar dataKey="protein" fill="hsl(var(--chart-protein))" radius={[6, 6, 0, 0]} stackId="macros" maxBarSize={chartBarSize} />
                <Bar dataKey="carbs" fill="hsl(var(--chart-carbs))" radius={[0, 0, 0, 0]} stackId="macros" maxBarSize={chartBarSize} />
                <Bar dataKey="fat" fill="hsl(var(--chart-fat))" radius={[0, 0, 6, 6]} stackId="macros" maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-chart-protein" />
              <span className="text-muted-foreground text-sm">Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-chart-carbs" />
              <span className="text-muted-foreground text-sm">Carbs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-chart-fat" />
              <span className="text-muted-foreground text-sm">Fat</span>
            </div>
          </div>
        </div>

        {/* Most eaten foods - sorted by count */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-3">Most eaten foods</h3>
          {allFoods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No food logged yet</p>
          ) : (
            <div className="space-y-3">
              {allFoods.map((f) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground truncate max-w-[60%]">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.count}x · {f.totalCals} kcal</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${(f.count / maxFoodVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exercise chart */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Exercise</h3>
          <p className="text-sm text-muted-foreground mb-4">Calories burned · {rangeLabel.toLowerCase()}</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <XAxis dataKey="day" tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={monthlyInterval} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="exercise" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exercise by type - donut chart */}
        {exerciseByType.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">By exercise type</h3>
              <div className="flex rounded-lg bg-muted p-0.5">
                <button
                  onClick={() => setExerciseMetric("minutes")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    exerciseMetric === "minutes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Minutes
                </button>
                <button
                  onClick={() => setExerciseMetric("count")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    exerciseMetric === "count" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Count
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={exercisePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" strokeWidth={0}>
                      {exercisePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{exercisePieTotal}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {exerciseMetric === "minutes" ? "min" : "sessions"}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {exerciseByType.map((e, index) => {
                  const val = exerciseMetric === "minutes" ? e.totalMinutes : e.count;
                  return (
                    <div key={e.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-sm text-foreground truncate">{e.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {exerciseMetric === "minutes" ? `${val} min` : `${val}x`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bowel movements */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-foreground">Bowel Movements 💩</h3>
            <div className="text-right">
              <span className="text-lg font-bold text-foreground">{poopAvg}</span>
              <span className="text-xs text-muted-foreground ml-1">avg/day</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{rangeLabel} · total: {poopTotal}</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--destructive))" }} />
              <span className="text-xs text-muted-foreground">Hard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))" }} />
              <span className="text-xs text-muted-foreground">Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--accent))" }} />
              <span className="text-xs text-muted-foreground">Loose</span>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentalData}>
                <XAxis dataKey="day" tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={monthlyInterval} />
                <YAxis hide />
                <Tooltip content={<PoopTooltip />} />
                <Bar dataKey="poopHard" stackId="poop" fill="hsl(var(--destructive))" maxBarSize={chartBarSize} />
                <Bar dataKey="poopNormal" stackId="poop" fill="hsl(var(--primary))" maxBarSize={chartBarSize} />
                <Bar dataKey="poopLoose" stackId="poop" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={chartBarSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotions */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Emotions</h3>
          <p className="text-sm text-muted-foreground mb-4">Positive vs negative · {rangeLabel.toLowerCase()}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={monthlyInterval} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="positiveCount" name="Positive" fill="hsl(var(--chart-positive-dark))" radius={[6, 6, 0, 0]} maxBarSize={range === "week" ? 36 : 12} />
                <Bar dataKey="negativeCount" name="Negative" fill="hsl(var(--chart-negative-dark))" radius={[6, 6, 0, 0]} maxBarSize={range === "week" ? 36 : 12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-positive-dark))" }} />
              <span className="text-xs text-muted-foreground">Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-negative-dark))" }} />
              <span className="text-xs text-muted-foreground">Negative</span>
            </div>
          </div>
        </div>

        {/* Frequent emotions */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-3">Frequent emotions</h3>
          {emotionFrequency.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emotions logged yet</p>
          ) : (
            <div className="space-y-3">
              {emotionFrequency.map((e) => (
                <div key={e.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{e.count} days</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(e.count / maxEmotionVal) * 100}%`,
                        backgroundColor: e.isPositive ? "hsl(var(--chart-positive-dark))" : "hsl(var(--chart-negative-dark))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sleep Quality */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Sleep Quality</h3>
          <p className="text-sm text-muted-foreground mb-3">{rangeLabel}</p>
          <div className="space-y-3">
            {sleepDistribution.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.count} days</span>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${maxSleepVal > 0 ? (d.count / maxSleepVal) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stress Level */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Stress Level</h3>
          <p className="text-sm text-muted-foreground mb-3">{rangeLabel}</p>
          <div className="space-y-3">
            {stressDistribution.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.count} days</span>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${maxStressVal > 0 ? (d.count / maxStressVal) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Tracker;
