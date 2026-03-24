import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { generatePrompts, getTimeWindow, type CheckInPrompt, type PromptContext, type PromptType } from "@/utils/checkInPrompts";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

const DISMISS_STORAGE_KEY = "checkin_dismissed";

interface DismissState {
  date: string;
  types: string[];
  notYetUntil: Record<string, number>; // type → timestamp
}

function loadDismissState(): DismissState {
  try {
    const raw = sessionStorage.getItem(DISMISS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DismissState;
      const today = format(new Date(), "yyyy-MM-dd");
      if (parsed.date === today) return parsed;
    }
  } catch {}
  return { date: format(new Date(), "yyyy-MM-dd"), types: [], notYetUntil: {} };
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

  const now = useMemo(() => new Date(), []);
  const todayKey = format(now, "yyyy-MM-dd");
  const yesterdayKey = format(subDays(now, 1), "yyyy-MM-dd");
  const isToday = format(selectedDate, "yyyy-MM-dd") === todayKey;

  const dismissedSet = useMemo(() => {
    const s = new Set(dismissState.types);
    // Also include "not yet" types that haven't expired
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
      getDefaultMealsForDate,
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
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  }, []);

  const handleAction = useCallback((prompt: CheckInPrompt, value: string) => {
    const { type, feedback } = prompt;

    if (value === "dismiss") {
      dismiss(type, true);
      setFollowUp(null);
      return;
    }
    if (value === "skip") {
      dismiss(type);
      setFollowUp(null);
      return;
    }

    switch (type) {
      case "sleep": {
        const quality = parseInt(value);
        const entry = getHealthEntry(todayKey);
        setHealthEntry(todayKey, { ...entry, sleepQuality: quality });
        complete(type, feedback);
        // Show follow-up for wake-ups
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
        return;
      }

      case "sleep_wakeups": {
        // We don't have a dedicated field for this, store as part of diary text or dismiss
        setFollowUp(null);
        complete(type, feedback);
        return;
      }

      case "breakfast":
      case "lunch":
      case "dinner":
      case "missing_yesterday_dinner": {
        if (value === "default") {
          // Log default meal for this type
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
        if (value === "walked") {
          // Quick-log a walk
          const { addExercise } = useUserStore.getState?.() || {};
          // Navigate to exercise dialog instead for simplicity
          onOpenExercise();
          complete(type, feedback);
          setFollowUp(null);
        } else {
          onOpenExercise();
          complete(type, feedback);
          setFollowUp(null);
        }
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
  }, [todayKey, yesterdayKey, getHealthEntry, setHealthEntry, getDefaultMealsForDate, addFoodToMeal, complete, dismiss, onNavigateToMeal, onOpenExercise]);

  if (!isToday || prompts.length === 0) return null;

  return (
    <div className="px-5 space-y-2 mb-4">
      <AnimatePresence mode="popLayout">
        {feedbackMsg && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-positive-bg/50 border border-positive-selected/20 px-4 py-3 text-sm text-foreground"
          >
            {feedbackMsg}
          </motion.div>
        )}

        {prompts.map((prompt) => (
          <motion.div
            key={prompt.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl bg-card border border-border shadow-sm px-4 py-4"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-sm font-medium text-foreground leading-snug">
                {prompt.question}
              </p>
              <button
                onClick={() => dismiss(prompt.type)}
                className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {prompt.buttons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleAction(prompt, btn.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                    btn.variant === "subtle"
                      ? "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      : "bg-foreground text-background hover:bg-foreground/85"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
