import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { generatePrompts, getTimeWindow, type CheckInPrompt, type PromptContext, type PromptType } from "@/utils/checkInPrompts";
import { useUserStore } from "@/stores/useUserStore";

const DISMISS_STORAGE_KEY = "checkin_dismissed";

interface DismissState {
  date: string;
  types: string[];
  completed: string[];
  notYetUntil: Record<string, number>;
}

function loadDismissState(): DismissState {
  try {
    const raw = sessionStorage.getItem(DISMISS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DismissState;
      const today = format(new Date(), "yyyy-MM-dd");
      if (parsed.date === today) return { completed: [], ...parsed };
    }
  } catch {}
  return { date: format(new Date(), "yyyy-MM-dd"), types: [], completed: [], notYetUntil: {} };
}

function saveDismissState(state: DismissState) {
  sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(state));
}

interface CheckInCardsProps {
  selectedDate: Date;
  onNavigateToMeal: (mealType: string) => void;
  onOpenExercise: () => void;
}

export const CheckInCards = ({ selectedDate, onNavigateToMeal, onOpenExercise }: CheckInCardsProps) => {
  const {
    profile, getDayEntry, getHealthEntry, setHealthEntry,
    getDefaultMealsForDate, addFoodToMeal,
  } = useUserStore();

  const [dismissState, setDismissState] = useState<DismissState>(loadDismissState);
  const [completedTypes, setCompletedTypes] = useState<Set<string>>(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<CheckInPrompt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(true);

  const now = useMemo(() => new Date(), []);
  const todayKey = format(now, "yyyy-MM-dd");
  const yesterdayKey = format(subDays(now, 1), "yyyy-MM-dd");
  const isToday = format(selectedDate, "yyyy-MM-dd") === todayKey;

  const dismissedSet = useMemo(() => {
    const s = new Set(dismissState.types);
    const nowMs = Date.now();
    for (const [type, until] of Object.entries(dismissState.notYetUntil)) {
      if (nowMs < until) s.add(type);
    }
    return s;
  }, [dismissState]);

  const prompts = useMemo(() => {
    if (!isToday) return [];

    const ctx: PromptContext = {
      now,
      todayKey,
      yesterdayKey,
      todayEntry: getDayEntry(todayKey),
      yesterdayEntry: getDayEntry(yesterdayKey),
      todayHealth: getHealthEntry(todayKey),
      defaultMeals: profile.defaultMeals || [],
      getDefaultMealsForDate: (date: string) => {
        const results = getDefaultMealsForDate(date);
        return results.map(r => ({
          id: (r as any).defaultMealId || r.name,
          name: r.name,
          mealType: r.mealType,
          items: r.items,
          frequency: "everyday" as const,
        }));
      },
      dismissedPrompts: new Set([...dismissedSet, ...completedTypes]),
    };

    const base = generatePrompts(ctx);
    if (followUp) return [followUp];
    return base;
  }, [isToday, now, todayKey, yesterdayKey, getDayEntry, getHealthEntry, profile.defaultMeals, getDefaultMealsForDate, dismissedSet, completedTypes, followUp]);

  const dismiss = useCallback((type: string, notYet = false) => {
    setDismissState(prev => {
      const next = { ...prev };
      if (notYet) {
        next.notYetUntil = { ...prev.notYetUntil, [type]: Date.now() + 2 * 60 * 60 * 1000 };
      } else {
        next.types = [...prev.types, type];
      }
      saveDismissState(next);
      return next;
    });
  }, []);

  const complete = useCallback((type: PromptType, feedback?: string) => {
    setCompletedTypes(prev => new Set([...prev, type]));
    if (feedback) {
      setFeedbackMsg(feedback);
      setTimeout(() => {
        setFeedbackMsg(null);
        // Move to next prompt
        setCurrentIndex(prev => prev + 1);
      }, 1800);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, []);

  const advanceOrClose = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleAction = useCallback((prompt: CheckInPrompt, value: string) => {
    const { type, feedback } = prompt;

    if (value === "dismiss") {
      dismiss(type, true);
      setFollowUp(null);
      advanceOrClose();
      return;
    }
    if (value === "skip") {
      dismiss(type);
      setFollowUp(null);
      advanceOrClose();
      return;
    }
    if (value === "confirm") {
      // User confirmed default meal — just dismiss
      complete(type, feedback || "Confirmed ✓");
      setFollowUp(null);
      return;
    }

    switch (type) {
      case "sleep": {
        const quality = parseInt(value);
        const entry = getHealthEntry(todayKey);
        setHealthEntry(todayKey, { ...entry, sleepQuality: quality });
        complete(type, feedback);
        setFollowUp({
          id: "sleep_wakeups",
          type: "sleep_wakeups",
          question: "Did you wake during the night?",
          buttons: [
            { label: "No", value: "0" },
            { label: "Once", value: "1" },
            { label: "Multiple times", value: "2" },
          ],
          feedback: "Noted. This helps identify sleep quality trends.",
        });
        // Reset index to show follow-up
        setCurrentIndex(0);
        return;
      }

      case "sleep_wakeups": {
        const wakeUps = parseInt(value);
        const entry = getHealthEntry(todayKey);
        setHealthEntry(todayKey, { ...entry, wakeUps });
        setFollowUp(null);
        complete(type, feedback);
        return;
      }

      case "breakfast":
      case "lunch":
      case "dinner":
      case "missing_yesterday_dinner": {
        if (value === "default") {
          const mealType = type === "missing_yesterday_dinner" ? "dinner" : type;
          const dateKey = type === "missing_yesterday_dinner" ? yesterdayKey : todayKey;
          const defaults = getDefaultMealsForDate(dateKey).filter(dm => dm.mealType === mealType);
          if (defaults.length > 0) {
            const groupId = crypto.randomUUID();
            defaults[0].items.forEach(item => {
              addFoodToMeal(dateKey, mealType, {
                ...item,
                id: crypto.randomUUID(),
                groupId,
                groupName: defaults[0].name,
              });
            });
          }
          complete(type, feedback);
          setFollowUp(null);
        } else if (value === "add") {
          const mealType = type === "missing_yesterday_dinner" ? "dinner" : type;
          onNavigateToMeal(mealType);
          complete(type, feedback);
          setFollowUp(null);
        }
        return;
      }

      case "exercise": {
        onOpenExercise();
        complete(type, feedback);
        setFollowUp(null);
        return;
      }

      case "mood": {
        const moodVal = parseInt(value);
        const entry = getHealthEntry(todayKey);
        setHealthEntry(todayKey, { ...entry, mood: moodVal });
        complete(type, feedback);
        setFollowUp(null);
        return;
      }
    }
  }, [todayKey, yesterdayKey, getHealthEntry, setHealthEntry, getDefaultMealsForDate, addFoodToMeal, complete, dismiss, onNavigateToMeal, onOpenExercise, advanceOrClose]);

  if (!isToday || prompts.length === 0 || !popupOpen) return null;

  // If we've gone through all prompts, close
  const currentPrompt = followUp || prompts[currentIndex];
  if (!currentPrompt && !feedbackMsg) return null;

  const totalPrompts = followUp ? 1 : prompts.length;
  const progressIndex = followUp ? 0 : Math.min(currentIndex, totalPrompts - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {feedbackMsg && !currentPrompt ? (
          <motion.div
            key="feedback-final"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mx-6 w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 text-center"
          >
            <p className="text-sm text-foreground">{feedbackMsg}</p>
          </motion.div>
        ) : feedbackMsg ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-6 w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 text-center"
          >
            <p className="text-sm text-foreground">{feedbackMsg}</p>
          </motion.div>
        ) : currentPrompt ? (
          <motion.div
            key={currentPrompt.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mx-6 w-full max-w-sm"
          >
            <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
              {/* Header with close */}
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPrompts }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i <= progressIndex ? "w-6 bg-foreground" : "w-3 bg-border"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPopupOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Question */}
              <div className="px-5 pt-3 pb-2">
                <p className="text-lg font-semibold text-foreground leading-snug">
                  {currentPrompt.question}
                </p>
              </div>

              {/* Buttons */}
              <div className="px-5 pb-5 pt-3 space-y-2">
                {currentPrompt.buttons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleAction(currentPrompt, btn.value)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                      btn.variant === "subtle"
                        ? "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        : "bg-foreground text-background hover:bg-foreground/85"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skip all link */}
            <button
              onClick={() => setPopupOpen(false)}
              className="w-full mt-3 py-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Skip all
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
