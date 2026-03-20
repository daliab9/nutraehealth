import { useState } from "react";
import { Copy } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FoodItem } from "@/stores/useUserStore";

const MULTIPLIERS = [0.25, 0.5, 0.75, 1, 2, 3, 4, 5];

interface QuickMultiplierPopoverProps {
  item: FoodItem;
  onDuplicate: (item: FoodItem, multiplier: number) => void;
  children: React.ReactNode;
}

export const QuickMultiplierPopover = ({ item, onDuplicate, children }: QuickMultiplierPopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 rounded-xl" side="left" align="center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide px-2 pb-1.5">Quantity</p>
        <div className="grid grid-cols-4 gap-1">
          {MULTIPLIERS.map((m) => (
            <button
              key={m}
              onClick={() => {
                onDuplicate(item, m);
                setOpen(false);
              }}
              className="py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary active:scale-95 transition-all border border-border/50"
            >
              {m === 1 ? "1×" : `${m}×`}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
