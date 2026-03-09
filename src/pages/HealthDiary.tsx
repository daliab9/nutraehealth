import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarStrip } from "@/components/CalendarStrip";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";
import { EmotionalCheckIn, type EmotionalCheckInData } from "@/components/EmotionalCheckIn";
import { CycleMentalBanner } from "@/components/CycleMentalBanner";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Moon, Brain, Pencil, BookOpen, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

const SLEEP_OPTIONS = [
  { label: "Terrible", value: 1 },
  { label: "Poor", value: 2 },
  { label: "Fair", value: 3 },
  { label: "Good", value: 4 },
  { label: "Great", value: 5 },
];

const STRESS_OPTIONS = [
  { label: "Very Low", value: 1 },
  { label: "Low", value: 2 },
  { label: "Moderate", value: 3 },
  { label: "High", value: 4 },
  { label: "Very High", value: 5 },
];

const Chip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 active:scale-95 ${
      selected
        ? "bg-foreground text-background border-foreground"
        : "bg-secondary/50 text-foreground border-border hover:border-foreground/30"
    }`}
  >
    {label}
  </button>
);

const HealthDiary = () => {
  const { profile, getHealthEntry, setHealthEntry } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const entry = getHealthEntry(dateKey);

  const [sleepEditing, setSleepEditing] = useState(true);
  const [stressEditing, setStressEditing] = useState(true);
  const [emotionsEditing, setEmotionsEditing] = useState(true);
  const [diaryEditing, setDiaryEditing] = useState(true);
  const [diaryText, setDiaryText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const e = getHealthEntry(dateKey);
    setSleepEditing(e.sleepQuality === 0);
    setStressEditing(e.stressLevel === 0);
    setEmotionsEditing(e.positiveEmotions.length === 0 && e.negativeEmotions.length === 0);
    setDiaryText(e.diaryText || "");
    setDiaryEditing(!e.diaryText);
  }, [dateKey]);

  const update = (field: string, value: number) => {
    setHealthEntry(dateKey, { ...entry, [field]: value });
  };

  const handleEmotionalChange = (emotionalData: EmotionalCheckInData) => {
    setHealthEntry(dateKey, { ...entry, ...emotionalData });
  };

  const saveDiary = () => {
    setHealthEntry(dateKey, { ...entry, diaryText: diaryText.trim() });
    if (diaryText.trim()) setDiaryEditing(false);
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setDiaryText((prev) => (prev ? prev + " " + finalTranscript : finalTranscript));
      }
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Voice recognition failed. Try again.");
    };
    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
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
        {/* Cycle mental health banner */}
        <CycleMentalBanner
          isFemale={profile.gender === "Female"}
          cycleStartDate={profile.cycleStartDate}
          onAddCycleDate={() => {
            // Navigate to profile page where cycle tracker lives
            window.location.href = "/profile";
          }}
        />

        {/* Diary Entry */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Diary Entry</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoiceRecording}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-action-button text-foreground hover:opacity-80"
                }`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              {!diaryEditing && entry.diaryText && (
                <button
                  onClick={() => setDiaryEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-action-button text-foreground text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
          </div>
          {diaryEditing ? (
            <div className="space-y-3">
              <Textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                placeholder="How was your day? What's on your mind?"
                className="rounded-xl min-h-[100px] resize-none border-border"
              />
              {diaryText.trim() && (
                <button
                  onClick={saveDiary}
                  className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  Save
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{entry.diaryText}</p>
          )}
        </div>

        {/* Sleep quality */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Sleep Quality</h3>
            </div>
            {!sleepEditing && sleepLabel && (
              <button
                onClick={() => setSleepEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-action-button text-foreground text-xs font-medium hover:opacity-80 transition-opacity"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
          {sleepEditing ? (
            <>
              <div className="flex flex-wrap gap-2">
                {SLEEP_OPTIONS.map((opt) => (
                  <Chip key={opt.value} label={opt.label} selected={entry.sleepQuality === opt.value} onClick={() => update("sleepQuality", opt.value)} />
                ))}
              </div>
              {entry.sleepQuality > 0 && (
                <button onClick={() => setSleepEditing(false)} className="mt-4 w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform">
                  Save
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground">{sleepLabel?.label}</span>
            </div>
          )}
        </div>

        {/* Stress level */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Stress Level</h3>
            </div>
            {!stressEditing && stressLabel && (
              <button
                onClick={() => setStressEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-action-button text-foreground text-xs font-medium hover:opacity-80 transition-opacity"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
          {stressEditing ? (
            <>
              <div className="flex flex-wrap gap-2">
                {STRESS_OPTIONS.map((opt) => (
                  <Chip key={opt.value} label={opt.label} selected={entry.stressLevel === opt.value} onClick={() => update("stressLevel", opt.value)} />
                ))}
              </div>
              {entry.stressLevel > 0 && (
                <button onClick={() => setStressEditing(false)} className="mt-4 w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform">
                  Save
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground">{stressLabel?.label}</span>
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-action-button text-foreground text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              </div>
              {entry.positiveEmotions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Positive</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.positiveEmotions.map((e) => (
                      <span key={e} className="px-3 py-1 rounded-full bg-positive border border-positive text-xs font-medium text-foreground">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {entry.positiveReasons.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Because of</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.positiveReasons.map((r) => (
                      <span key={r} className="px-3 py-1 rounded-full bg-positive border border-positive text-xs font-medium text-foreground">{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {entry.negativeEmotions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Difficult</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.negativeEmotions.map((e) => (
                      <span key={e} className="px-3 py-1 rounded-full bg-negative-bubble border border-negative-bubble text-xs font-medium text-foreground">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {entry.negativeReasons.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Contributing factors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.negativeReasons.map((r) => (
                      <span key={r} className="px-3 py-1 rounded-full bg-negative-bubble border border-negative-bubble text-xs font-medium text-foreground">{r}</span>
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
