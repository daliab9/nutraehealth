import { useState, useCallback, useEffect, useRef } from "react";
import { CircularProgress } from "./CircularProgress";

export interface TrackedNutrient {
  key: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  qualitativeLevel?: "low" | "medium" | "high" | "";
}

interface NutrientRingCarouselProps {
  nutrients: TrackedNutrient[];
}

export const NutrientRingCarousel = ({ nutrients }: NutrientRingCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset index if nutrients list shrinks
  useEffect(() => {
    if (activeIndex >= nutrients.length) {
      setActiveIndex(0);
    }
  }, [nutrients.length, activeIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40;
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && activeIndex < nutrients.length - 1) {
        setActiveIndex((prev) => prev + 1);
      } else if (diff < 0 && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    }
  }, [activeIndex, nutrients.length]);

  if (nutrients.length === 0) return null;

  const current = nutrients[activeIndex];

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CircularProgress
        value={Math.max(0, current.value)}
        max={current.target}
        label={current.label}
        unit={current.unit}
      />
      {/* Pagination dots */}
      {nutrients.length > 1 && (
        <div className="flex items-center gap-1.5 mt-3">
          {nutrients.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? "w-2 h-2 bg-foreground"
                  : "w-1.5 h-1.5 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
