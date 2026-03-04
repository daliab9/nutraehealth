import { useAllMeals } from "@/hooks/useMeals";
import { MealCard } from "@/components/MealCard";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, parseISO } from "date-fns";

const History = () => {
  const { data: meals, isLoading } = useAllMeals();

  const grouped = (meals ?? []).reduce<Record<string, typeof meals>>((acc, meal) => {
    const date = format(parseISO(meal.eaten_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date]!.push(meal);
    return acc;
  }, {});

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM d");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Meal History</h1>
        <p className="text-sm text-muted-foreground">Your logged meals</p>
      </div>

      <div className="px-5 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No meals logged yet</p>
        ) : (
          Object.entries(grouped).map(([date, dayMeals]) => {
            const dayCalories = dayMeals!.reduce((s, m) => s + m.total_calories, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-sm font-semibold text-foreground">{formatDateLabel(date)}</h2>
                  <span className="text-xs font-medium text-primary">{dayCalories} kcal</span>
                </div>
                <div className="space-y-2">
                  {dayMeals!.map((meal) => (
                    <MealCard
                      key={meal.id}
                      name={meal.name}
                      mealType={meal.meal_type}
                      calories={meal.total_calories}
                      protein={Number(meal.total_protein)}
                      carbs={Number(meal.total_carbs)}
                      fat={Number(meal.total_fat)}
                      photoUrl={meal.photo_url}
                      eatenAt={meal.eaten_at}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default History;
