import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTodayMeals } from "@/hooks/useMeals";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: meals, isLoading: mealsLoading } = useTodayMeals();

  const totalCalories = meals?.reduce((sum, m) => sum + m.total_calories, 0) ?? 0;
  const totalProtein = meals?.reduce((sum, m) => sum + Number(m.total_protein), 0) ?? 0;
  const totalCarbs = meals?.reduce((sum, m) => sum + Number(m.total_carbs), 0) ?? 0;
  const totalFat = meals?.reduce((sum, m) => sum + Number(m.total_fat), 0) ?? 0;

  const calorieGoal = profile?.daily_calorie_goal ?? 2000;
  const proteinGoal = profile?.daily_protein_goal ?? 150;
  const carbsGoal = profile?.daily_carbs_goal ?? 250;
  const fatGoal = profile?.daily_fat_goal ?? 65;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <p className="text-sm text-muted-foreground">{greeting()}</p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {profileLoading ? <Skeleton className="h-8 w-40" /> : (profile?.display_name ?? "there")}
        </h1>
      </div>

      {/* Calorie Ring */}
      <div className="flex justify-center py-4">
        {profileLoading ? (
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        ) : (
          <CalorieRing consumed={totalCalories} goal={calorieGoal} />
        )}
      </div>

      {/* Macros */}
      <div className="space-y-3 px-5">
        <MacroBar
          label="Protein"
          current={Math.round(totalProtein)}
          goal={proteinGoal}
          colorClass="bg-chart-protein"
        />
        <MacroBar
          label="Carbs"
          current={Math.round(totalCarbs)}
          goal={carbsGoal}
          colorClass="bg-chart-carbs"
        />
        <MacroBar
          label="Fat"
          current={Math.round(totalFat)}
          goal={fatGoal}
          colorClass="bg-chart-fat"
        />
      </div>

      {/* Today's Meals */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Today's meals</h2>
          <Link to="/scan">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </Link>
        </div>

        {mealsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : meals && meals.length > 0 ? (
          <div className="space-y-3">
            {meals.map((meal) => (
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
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Camera className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No meals logged today</p>
            <Link to="/scan">
              <Button size="sm" className="gap-1">
                <Camera className="h-4 w-4" /> Scan your first meal
              </Button>
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
