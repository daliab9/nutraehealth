import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollPickerProps {
  items: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  itemHeight?: number;
  visibleItems?: number;
  suffix?: string;
  className?: string;
}

export const ScrollPicker = ({
  items,
  value,
  onChange,
  itemHeight = 48,
  visibleItems = 5,
  suffix = "",
  className,
}: ScrollPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const containerHeight = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  const currentIndex = items.indexOf(value);

  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      const targetScroll = currentIndex * itemHeight;
      containerRef.current.scrollTop = targetScroll;
    }
  }, [currentIndex, itemHeight, isScrolling]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    setIsScrolling(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

      containerRef.current.scrollTo({
        top: clampedIndex * itemHeight,
        behavior: "smooth",
      });

      if (items[clampedIndex] !== value) {
        onChange(items[clampedIndex]);
      }
      setIsScrolling(false);
    }, 80);
  };

  return (
    <div className={cn("relative", className)} style={{ height: containerHeight }}>
      {/* Selection highlight */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 rounded-xl bg-secondary/80"
        style={{
          top: paddingItems * itemHeight,
          height: itemHeight,
        }}
      />
      {/* Fade top */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20"
        style={{
          height: paddingItems * itemHeight,
          background: "linear-gradient(to bottom, hsl(var(--background)), transparent)",
        }}
      />
      {/* Fade bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: paddingItems * itemHeight,
          background: "linear-gradient(to top, hsl(var(--background)), transparent)",
        }}
      />

      <div
        ref={containerRef}
        className="hide-scrollbar h-full overflow-y-auto"
        onScroll={handleScroll}
        style={{ scrollSnapType: "y mandatory" }}
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * itemHeight }} />
        {items.map((item, i) => {
          const isSelected = item === value;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center transition-all duration-150",
                isSelected
                  ? "text-foreground font-semibold text-2xl"
                  : "text-muted-foreground text-lg"
              )}
              style={{
                height: itemHeight,
                scrollSnapAlign: "start",
              }}
            >
              {item}{suffix}
            </div>
          );
        })}
        {/* Bottom padding */}
        <div style={{ height: paddingItems * itemHeight }} />
      </div>
    </div>
  );
};
