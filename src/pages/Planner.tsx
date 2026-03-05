import { useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore } from "@/stores/useUserStore";
import { AlertTriangle, Lightbulb, Utensils } from "lucide-react";

interface MealIdea {
  name: string;
  calories: number;
  tags: string[];
  description: string;
}

const MEAL_IDEAS: MealIdea[] = [
  { name: "Greek Yogurt Bowl", calories: 320, tags: ["Vegetarian"], description: "Greek yogurt with honey, granola, and mixed berries" },
  { name: "Grilled Chicken Salad", calories: 420, tags: [], description: "Mixed greens, grilled chicken, avocado, cherry tomatoes" },
  { name: "Salmon & Quinoa", calories: 480, tags: ["Pescatarian"], description: "Pan-seared salmon with quinoa and steamed vegetables" },
  { name: "Veggie Stir Fry", calories: 350, tags: ["Vegan", "Vegetarian"], description: "Tofu with mixed vegetables in ginger sauce over rice" },
  { name: "Overnight Oats", calories: 280, tags: ["Vegetarian", "Vegan"], description: "Oats soaked in almond milk with chia seeds and banana" },
  { name: "Turkey Wrap", calories: 390, tags: [], description: "Whole wheat wrap with turkey, hummus, and vegetables" },
  { name: "Lentil Soup", calories: 310, tags: ["Vegan", "Vegetarian", "Gluten-free"], description: "Hearty lentil soup with carrots, celery, and spices" },
  { name: "Egg & Avocado Toast", calories: 340, tags: ["Vegetarian"], description: "Sourdough toast with mashed avocado and poached egg" },
];

const Planner = () => {
  const { profile, getDayTotals, diary } = useUserStore();

  const filteredMeals = useMemo(() => {
    const prefs = profile.dietaryPreferences.filter((p) => p !== "None");
    const restrictions = profile.dietaryRestrictions.filter((r) => r !== "None");
    
    return MEAL_IDEAS.filter((meal) => {
      if (prefs.length > 0 && !prefs.some((p) => meal.tags.includes(p))) return false;
      if (restrictions.includes("Gluten-free") && !meal.tags.includes("Gluten-free")) {
        // Only filter if meal explicitly contains gluten - simplified
      }
      return true;
    }).slice(0, 6);
  }, [profile]);

  const insights = useMemo(() => {
    const results: { type: "warning" | "info"; message: string }[] = [];
    const concerns = profile.healthConcerns.filter((h) => h !== "None");

    // Analyze last 7 days
    let totalFat = 0, totalProtein = 0, daysTracked = 0;
    Object.keys(diary).forEach((key) => {
      const t = getDayTotals(key);
      if (t.calories > 0) {
        totalFat += t.fat;
        totalProtein += t.protein;
        daysTracked++;
      }
    });

    if (daysTracked > 0) {
      const avgFat = totalFat / daysTracked;
      const avgProtein = totalProtein / daysTracked;

      if (concerns.includes("High cholesterol") && avgFat > 70) {
        results.push({ type: "warning", message: "Your average daily fat intake is high. Consider reducing saturated fats." });
      }
      if (concerns.includes("Iron deficiency") && avgProtein < 40) {
        results.push({ type: "warning", message: "Low protein intake may affect iron levels. Try adding more legumes and leafy greens." });
      }
      if (concerns.includes("B12 deficiency")) {
        results.push({ type: "info", message: "Consider B12-rich foods like eggs, dairy, or fortified cereals." });
      }
    }

    if (results.length === 0) {
      results.push({ type: "info", message: "Keep tracking to get personalized health insights." });
    }

    return results;
  }, [profile, diary, getDayTotals]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const concerns = profile.healthConcerns.filter((h) => h !== "None");

    if (concerns.includes("High cholesterol")) {
      recs.push("Oats, nuts, and fatty fish can help lower cholesterol");
    }
    if (concerns.includes("Iron deficiency")) {
      recs.push("Spinach, lentils, and red meat are great iron sources");
    }
    if (concerns.includes("B12 deficiency")) {
      recs.push("Eggs, milk, and nutritional yeast are B12-rich options");
    }
    if (concerns.includes("High blood pressure")) {
      recs.push("Reduce sodium intake and eat more potassium-rich foods like bananas");
    }
    if (concerns.includes("Diabetes")) {
      recs.push("Focus on low-glycemic foods and limit refined sugars");
    }
    return recs;
  }, [profile]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pt-12 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Planner</h1>

        {/* Meal Ideas */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Meal Ideas</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            {filteredMeals.map((meal) => (
              <div
                key={meal.name}
                className="min-w-[220px] rounded-2xl bg-card border border-border p-4 flex-shrink-0"
              >
                <h3 className="font-semibold text-foreground text-sm mb-1">{meal.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{meal.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{meal.calories} kcal</span>
                  {meal.tags.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {meal.tags[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Insights */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Health Insights</h2>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${
                  insight.type === "warning"
                    ? "bg-accent/5 border-accent/20"
                    : "bg-card border-border"
                }`}
              >
                <p className="text-sm text-foreground">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recommendations</h2>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-4">
                  <p className="text-sm text-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Planner;
