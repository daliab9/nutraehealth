import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ScrollPickerProps {
  items: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  itemHeight?: number;
  visibleItems?: number;
  suffix?: string;
  formatItem?: (item: string | number) => string;
  className?: string;
}

export const ScrollPicker = ({
  items,
  value,
  onChange,
  itemHeight = 48,
  visibleItems = 5,
  suffix = "",
  formatItem,
  className,
}: ScrollPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const initializedRef = useRef(false);

  const containerHeight = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  const currentIndex = items.indexOf(value);

  // Scroll to current value on mount and when value changes externally
  useEffect(() => {
    if (!containerRef.current) return;
    if (isUserScrolling.current) return;
    const targetScroll = currentIndex * itemHeight;
    containerRef.current.scrollTop = targetScroll;
    initializedRef.current = true;
  }, [currentIndex, itemHeight]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    isUserScrolling.current = true;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
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
      setTimeout(() => {
        isUserScrolling.current = false;
      }, 100);
    }, 100);
  }, [items, value, itemHeight, onChange]);

  const handleItemClick = (item: string | number, index: number) => {
    if (!containerRef.current) return;
    isUserScrolling.current = true;
    containerRef.current.scrollTo({
      top: index * itemHeight,
      behavior: "smooth",
    });
    onChange(item);
    setTimeout(() => {
      isUserScrolling.current = false;
    }, 350);
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
        className="hide-scrollbar h-full overflow-y-auto overscroll-contain"
        onScroll={handleScroll}
        style={{}} /* manual snap via scroll timeout */
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * itemHeight }} />
        {items.map((item, i) => {
          const isSelected = item === value;
          return (
            <div
              key={`${item}-${i}`}
              className={cn(
                "flex cursor-pointer items-center justify-center transition-all duration-150 relative z-30",
                isSelected
                  ? "text-foreground font-semibold text-xl"
                  : "text-muted-foreground text-base"
              )}
              style={{
                height: itemHeight,
              }}
              onClick={() => handleItemClick(item, i)}
            >
              {formatItem ? formatItem(item) : `${item}${suffix}`}
            </div>
          );
        })}
        {/* Bottom padding */}
        <div style={{ height: paddingItems * itemHeight }} />
      </div>
    </div>
  );
};
