import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarStrip } from "@/components/CalendarStrip";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";
import { EmotionalCheckIn, type EmotionalCheckInData } from "@/components/EmotionalCheckIn";
import { Moon, Brain, Pencil } from "lucide-react";

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

const HealthDiary = () => {
  const { getHealthEntry, setHealthEntry } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const entry = getHealthEntry(dateKey);

  // Edit modes — reset when date changes
  const [sleepEditing, setSleepEditing] = useState(true);
  const [stressEditing, setStressEditing] = useState(true);
  const [emotionsEditing, setEmotionsEditing] = useState(true);

  useEffect(() => {
    const e = getHealthEntry(dateKey);
    // Reset edit states only when switching day, not on every field update
    setSleepEditing(e.sleepQuality === 0);
    setStressEditing(e.stressLevel === 0);
    setEmotionsEditing(e.positiveEmotions.length === 0 && e.negativeEmotions.length === 0);
  }, [dateKey]);

  const update = (field: string, value: number) => {
    setHealthEntry(dateKey, { ...entry, [field]: value });
  };

  const handleEmotionalChange = (emotionalData: EmotionalCheckInData) => {
    setHealthEntry(dateKey, { ...entry, ...emotionalData });
  };

  const sleepLabel = SLEEP_OPTIONS.find((o) => o.value === entry.sleepQuality);
  const stressLabel = STRESS_OPTIONS.find((o) => o.value === entry.stressLevel);

  const hasEmotions = entry.positiveEmotions.length > 0 || entry.negativeEmotions.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-lg font-bold text-foreground mb-1">
          {format(selectedDate, "EEEE, MMM d")}
        </h1>
        <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Sleep quality */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Sleep Quality</h3>
            </div>
            {!sleepEditing && sleepLabel && (
              <button
                onClick={() => setSleepEditing(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          {sleepEditing ? (
            <>
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
              {entry.sleepQuality > 0 && (
                <button
                  onClick={() => setSleepEditing(false)}
                  className="mt-3 w-full py-2 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  Save
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sleepLabel?.icon}</span>
              <span className="text-sm font-medium text-foreground">{sleepLabel?.label}</span>
            </div>
          )}
        </div>

        {/* Stress level */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Stress Level</h3>
            </div>
            {!stressEditing && stressLabel && (
              <button
                onClick={() => setStressEditing(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          {stressEditing ? (
            <>
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
              {entry.stressLevel > 0 && (
                <button
                  onClick={() => setStressEditing(false)}
                  className="mt-3 w-full py-2 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  Save
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{stressLabel?.label}</span>
            </div>
          )}
        </div>

        {/* Emotional Check-In */}
        <div className="relative">
          {!emotionsEditing && hasEmotions ? (
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-base">Emotional Check-In</h3>
                <button
                  onClick={() => setEmotionsEditing(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
              {entry.positiveEmotions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Positive</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.positiveEmotions.map((e) => (
                      <span key={e} className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.positiveReasons.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Because of</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.positiveReasons.map((r) => (
                      <span key={r} className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.negativeEmotions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Difficult</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.negativeEmotions.map((e) => (
                      <span key={e} className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.negativeReasons.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Contributing factors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.negativeReasons.map((r) => (
                      <span key={r} className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <EmotionalCheckIn
                data={{
                  positiveEmotions: entry.positiveEmotions,
                  positiveReasons: entry.positiveReasons,
                  positiveOtherText: entry.positiveOtherText,
                  negativeEmotions: entry.negativeEmotions,
                  negativeReasons: entry.negativeReasons,
                  negativeOtherText: entry.negativeOtherText,
                }}
                onChange={handleEmotionalChange}
              />
              {hasEmotions && (
                <button
                  onClick={() => setEmotionsEditing(false)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  Save
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default HealthDiary;
