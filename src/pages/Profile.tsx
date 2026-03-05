import { useState } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserStore } from "@/stores/useUserStore";
import { Scale, Ruler, Target, Crown, RotateCcw } from "lucide-react";

const Profile = () => {
  const { profile, setProfile } = useUserStore();
  const [weightOpen, setWeightOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editCalories, setEditCalories] = useState(String(profile.dailyCalorieTarget));

  const bmi = profile.height > 0
    ? (profile.currentWeight / ((profile.height / 100) ** 2)).toFixed(1)
    : "—";

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <Scale className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.currentWeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current kg</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <Ruler className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.height}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Height cm</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">BMI</p>
            <p className="text-2xl font-bold text-foreground">{bmi}</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <Target className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.targetWeight}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Goal kg</p>
          </div>
        </div>

        {/* Weight tracking */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Weight Progress</h3>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setWeightOpen(true)}
            >
              Log weight
            </Button>
          </div>
          {weightData.length >= 2 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--foreground))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Log at least 2 weights to see your progress chart
            </p>
          )}
        </div>

        {/* Saved Meals */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Saved Meals</h3>
          {profile.savedMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved meals yet</p>
          ) : (
            <div className="space-y-2">
              {profile.savedMeals.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {m.items.reduce((s, i) => s + i.calories, 0)} kcal
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Subscription</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {profile.subscription === "pro"
              ? "You're on Nuria Pro"
              : `Free plan · ${profile.aiScansUsed}/3 AI scans used`}
          </p>
          {profile.subscription === "free" && (
            <Button className="w-full rounded-xl h-11 mb-2">
              Upgrade to Pro
            </Button>
          )}
          <Button variant="outline" className="w-full rounded-xl h-11">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore Purchase
          </Button>
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Settings</h3>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full text-left text-sm text-foreground py-2 border-b border-border"
          >
            Edit daily calorie target
          </button>
          <button
            onClick={() => {
              setProfile({ onboardingComplete: false });
            }}
            className="w-full text-left text-sm text-foreground py-2"
          >
            Redo onboarding
          </button>
        </div>
      </div>

      {/* Weight dialog */}
      <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log Weight</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Weight (kg)"
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="rounded-xl"
            />
            <Button
              onClick={handleAddWeight}
              className="w-full rounded-xl h-12"
              disabled={!newWeight}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Daily Calorie Target</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Calories"
              type="number"
              value={editCalories}
              onChange={(e) => setEditCalories(e.target.value)}
              className="rounded-xl"
            />
            <Button
              onClick={() => {
                setProfile({ dailyCalorieTarget: Number(editCalories) });
                setSettingsOpen(false);
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

export default Profile;
