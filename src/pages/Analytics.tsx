import { useState } from "react";
import { useAllMeals } from "@/hooks/useMeals";
import { useProfile } from "@/hooks/useProfile";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";

const Analytics = () => {
  const { data: meals, isLoading } = useAllMeals();
  const { data: profile } = useProfile();
  const [range, setRange] = useState<7 | 30>(7);

  const now = new Date();
  const rangeStart = subDays(now, range);

  const filteredMeals = (meals ?? []).filter(
    (m) => parseISO(m.eaten_at) >= rangeStart
  );

  // Daily calorie data
  const dailyData: { date: string; label: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const day = subDays(now, i);
    const dayStr = format(day, "yyyy-MM-dd");
    const dayMeals = filteredMeals.filter(
      (m) => format(parseISO(m.eaten_at), "yyyy-MM-dd") === dayStr
    );
    dailyData.push({
      date: dayStr,
      label: format(day, range === 7 ? "EEE" : "M/d"),
      calories: dayMeals.reduce((s, m) => s + m.total_calories, 0),
      protein: dayMeals.reduce((s, m) => s + Number(m.total_protein), 0),
      carbs: dayMeals.reduce((s, m) => s + Number(m.total_carbs), 0),
      fat: dayMeals.reduce((s, m) => s + Number(m.total_fat), 0),
    });
  }

  const avgCalories = dailyData.length
    ? Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / dailyData.length)
    : 0;

  const totalProtein = dailyData.reduce((s, d) => s + d.protein, 0);
  const totalCarbs = dailyData.reduce((s, d) => s + d.carbs, 0);
  const totalFat = dailyData.reduce((s, d) => s + d.fat, 0);
  const macroTotal = totalProtein + totalCarbs + totalFat;

  const macroData = macroTotal > 0
    ? [
        { name: "Protein", value: Math.round(totalProtein), color: "hsl(var(--chart-protein))" },
        { name: "Carbs", value: Math.round(totalCarbs), color: "hsl(var(--chart-carbs))" },
        { name: "Fat", value: Math.round(totalFat), color: "hsl(var(--chart-fat))" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Your nutrition trends</p>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 px-5 mb-4">
        <Button
          variant={range === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => setRange(7)}
        >
          7 days
        </Button>
        <Button
          variant={range === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => setRange(30)}
        >
          30 days
        </Button>
      </div>

      <div className="space-y-4 px-5">
        {/* Average stat */}
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Daily average</p>
            <p className="font-display text-3xl font-bold text-primary">{avgCalories}</p>
            <p className="text-xs text-muted-foreground">kcal / day</p>
          </CardContent>
        </Card>

        {/* Calorie chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Calories</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    formatter={(val: number) => [`${val} kcal`, "Calories"]}
                  />
                  <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Macro distribution */}
        {macroData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Macro Split</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4 pb-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={macroData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {macroData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {macroData.map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: m.color }} />
                    <span className="text-xs text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.value}g</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Analytics;
