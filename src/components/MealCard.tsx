import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

interface MealCardProps {
  name: string;
  mealType?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUrl?: string | null;
  eatenAt: string;
  onClick?: () => void;
}

export const MealCard = ({ name, mealType, calories, protein, carbs, fat, photoUrl, eatenAt, onClick }: MealCardProps) => {
  const time = new Date(eatenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const typeLabel = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : "";

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:shadow-md active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 p-3">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
            <span className="ml-2 text-sm font-bold text-primary">{calories} kcal</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {typeLabel && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{typeLabel}</span>
            )}
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
          <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
            <span>P {protein}g</span>
            <span>C {carbs}g</span>
            <span>F {fat}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
