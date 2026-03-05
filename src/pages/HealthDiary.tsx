import { useState } from "react";
import { format } from "date-fns";
import { CalendarStrip } from "@/components/CalendarStrip";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";
import { Moon, Brain, Smile, Frown, Meh, SmilePlus, Angry } from "lucide-react";

const SLEEP_OPTIONS = [
  { label: "Terrible", value: 1, icon: "😫" },
  { label: "Poor", value: 2, icon: "😴" },
  { label: "Fair", value: 3, icon: "😐" },
  { label: "Good", value: 4, icon: "🙂" },
  { label: "Great", value: 5, icon: "✨" },
];

const STRESS_OPTIONS = [
  { label: "Very Low", value: 1 },
  { label: "Low", value: 2 },
  { label: "Moderate", value: 3 },
  { label: "High", value: 4 },
  { label: "Very High", value: 5 },
];

const MOOD_OPTIONS = [
  { label: "Awful", value: 1, emoji: "😢" },
  { label: "Bad", value: 2, emoji: "😔" },
  { label: "Okay", value: 3, emoji: "😐" },
  { label: "Good", value: 4, emoji: "😊" },
  { label: "Great", value: 5, emoji: "😄" },
];

const HealthDiary = () => {
  const { getHealthEntry, setHealthEntry } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const entry = getHealthEntry(dateKey);

  const update = (field: string, value: number) => {
    setHealthEntry(dateKey, { ...entry, [field]: value });
  };

  const incrementPoop = () => {
    update("poopCount", entry.poopCount + 1);
  };

  const decrementPoop = () => {
    if (entry.poopCount > 0) update("poopCount", entry.poopCount - 1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-lg font-bold text-foreground mb-1">
          {format(selectedDate, "EEEE, MMM d")}
        </h1>
        <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Poop tracker */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💩</span>
              <h3 className="font-semibold text-foreground">Bowel Movements</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementPoop}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg active:scale-95 transition-transform"
              >
                −
              </button>
              <span className="text-2xl font-bold text-foreground w-6 text-center">
                {entry.poopCount}
              </span>
              <button
                onClick={incrementPoop}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg active:scale-95 transition-transform"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Sleep quality */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">Sleep Quality</h3>
          </div>
          <div className="flex gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("sleepQuality", opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all active:scale-95 ${
                  entry.sleepQuality === opt.value
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stress level */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">Stress Level</h3>
          </div>
          <div className="flex gap-2">
            {STRESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("stressLevel", opt.value)}
                className={`flex-1 py-3 rounded-xl text-center transition-all active:scale-95 ${
                  entry.stressLevel === opt.value
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground"
                }`}
              >
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Smile className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">Overall Mood</h3>
          </div>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("mood", opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all active:scale-95 ${
                  entry.mood === opt.value
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground"
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default HealthDiary;
