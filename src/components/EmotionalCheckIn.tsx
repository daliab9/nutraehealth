import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const POSITIVE_EMOTIONS = [
  "Hopeful", "Grateful", "Excited", "Peaceful", "Content", "Proud",
  "Motivated", "Inspired", "Connected", "Calm", "Energized", "Optimistic",
  "Confident", "Loved", "Fulfilled", "Other",
];

const POSITIVE_REASONS = [
  "Connecting with others", "Achieving a goal", "Progress in health",
  "Exercise", "Time outdoors", "Family", "Friends", "Work success",
  "Learning something new", "Creative activity", "Spiritual practice",
  "Rest and recovery", "Self-care", "Finding a new idea", "Personal growth", "Other",
];

const NEGATIVE_EMOTIONS = [
  "Anxious", "Worried", "Stressed", "Overwhelmed", "Depressed", "Hopeless",
  "Irritable", "Burned out", "Lonely", "Sad", "Angry", "Guilty",
  "Restless", "Fatigued", "Unmotivated", "Other",
];

const NEGATIVE_REASONS = [
  "Work", "Relationship", "Family", "Health", "Finances", "Politics",
  "Social media", "News", "Sleep", "Conflict", "Uncertainty about future",
  "Body image", "Academic pressure", "Parenting", "Time pressure", "Other",
];

const ALL_PRESET_REASONS = new Set([...POSITIVE_REASONS, ...NEGATIVE_REASONS]);

export interface EmotionalCheckInData {
  positiveEmotions: string[];
  positiveReasons: string[];
  positiveOtherText: string;
  negativeEmotions: string[];
  negativeReasons: string[];
  negativeOtherText: string;
}

interface EmotionalCheckInProps {
  data: EmotionalCheckInData;
  onChange: (data: EmotionalCheckInData) => void;
}

const toggleItem = (arr: string[], item: string): string[] =>
  arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];

const Chip = ({
  label,
  selected,
  onClick,
  onRemove,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  onRemove?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 active:scale-95 inline-flex items-center gap-1.5 ${
      selected
        ? "bg-foreground text-background border-foreground"
        : "bg-secondary/50 text-foreground border-border hover:border-foreground/30"
    }`}
  >
    {label}
    {onRemove && (
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 rounded-full hover:bg-background/20 p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </span>
    )}
  </button>
);

const revealVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: "auto", marginTop: 16 },
};

export const EmotionalCheckIn = ({ data, onChange }: EmotionalCheckInProps) => {
  const [posInput, setPosInput] = useState("");
  const [negInput, setNegInput] = useState("");

  // Once reasons have been revealed during this editing session, keep them visible
  const [posReasonsRevealed, setPosReasonsRevealed] = useState(data.positiveEmotions.length > 0);
  const [negReasonsRevealed, setNegReasonsRevealed] = useState(data.negativeEmotions.length > 0);

  useEffect(() => {
    if (data.positiveEmotions.length > 0) setPosReasonsRevealed(true);
  }, [data.positiveEmotions.length]);

  useEffect(() => {
    if (data.negativeEmotions.length > 0) setNegReasonsRevealed(true);
  }, [data.negativeEmotions.length]);

  const update = (partial: Partial<EmotionalCheckInData>) =>
    onChange({ ...data, ...partial });

  const showPosReasons = posReasonsRevealed;
  const showNegReasons = negReasonsRevealed;

  const customPositiveReasons = data.positiveReasons.filter(
    (r) => !ALL_PRESET_REASONS.has(r)
  );
  const customNegativeReasons = data.negativeReasons.filter(
    (r) => !ALL_PRESET_REASONS.has(r)
  );

  const addCustomReason = (
    field: "positiveReasons" | "negativeReasons",
    text: string,
    setInput: (v: string) => void
  ) => {
    const trimmed = text.trim();
    if (!trimmed || data[field].includes(trimmed)) return;
    update({ [field]: [...data[field], trimmed] });
    setInput("");
  };

  const removeCustomReason = (
    field: "positiveReasons" | "negativeReasons",
    text: string
  ) => {
    update({ [field]: data[field].filter((r) => r !== text) });
  };

  return (
    <div className="space-y-6">
      {/* Positive Emotions */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="font-semibold text-foreground text-base mb-1">
          How are you feeling today?
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Positive emotions</p>
        <div className="flex flex-wrap gap-2">
          {POSITIVE_EMOTIONS.map((e) => (
            <Chip
              key={e}
              label={e}
              selected={data.positiveEmotions.includes(e)}
              onClick={() =>
                update({ positiveEmotions: toggleItem(data.positiveEmotions, e) })
              }
            />
          ))}
        </div>

        <AnimatePresence initial={false}>
          {showPosReasons && (
            <motion.div
              key="pos-reasons"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={revealVariants}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <h4 className="font-medium text-foreground text-sm mb-3">
                What made you feel this way?
              </h4>
              <div className="flex flex-wrap gap-2">
                {POSITIVE_REASONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected={data.positiveReasons.includes(r)}
                    onClick={() =>
                      update({ positiveReasons: toggleItem(data.positiveReasons, r) })
                    }
                  />
                ))}
                {customPositiveReasons.map((r) => (
                  <Chip
                    key={`custom-${r}`}
                    label={r}
                    selected={true}
                    onClick={() => {}}
                    onRemove={() => removeCustomReason("positiveReasons", r)}
                  />
                ))}
              </div>

              <AnimatePresence>
                {data.positiveReasons.includes("Other") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Tell us more… (press Enter to add)"
                      value={posInput}
                      onChange={(e) => setPosInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomReason("positiveReasons", posInput, setPosInput);
                        }
                      }}
                      className="mt-3 w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Negative Emotions */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="font-semibold text-foreground text-base mb-1">
          Are you experiencing any difficult emotions?
        </h3>
        <p className="text-xs text-muted-foreground mb-4">It's okay to feel this way</p>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_EMOTIONS.map((e) => (
            <Chip
              key={e}
              label={e}
              selected={data.negativeEmotions.includes(e)}
              onClick={() =>
                update({ negativeEmotions: toggleItem(data.negativeEmotions, e) })
              }
            />
          ))}
        </div>

        <AnimatePresence initial={false}>
          {showNegReasons && (
            <motion.div
              key="neg-reasons"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={revealVariants}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <h4 className="font-medium text-foreground text-sm mb-3">
                What might be contributing to this?
              </h4>
              <div className="flex flex-wrap gap-2">
                {NEGATIVE_REASONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected={data.negativeReasons.includes(r)}
                    onClick={() =>
                      update({ negativeReasons: toggleItem(data.negativeReasons, r) })
                    }
                  />
                ))}
                {customNegativeReasons.map((r) => (
                  <Chip
                    key={`custom-${r}`}
                    label={r}
                    selected={true}
                    onClick={() => {}}
                    onRemove={() => removeCustomReason("negativeReasons", r)}
                  />
                ))}
              </div>

              <AnimatePresence>
                {data.negativeReasons.includes("Other") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Tell us what's on your mind… (press Enter to add)"
                      value={negInput}
                      onChange={(e) => setNegInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomReason("negativeReasons", negInput, setNegInput);
                        }
                      }}
                      className="mt-3 w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
