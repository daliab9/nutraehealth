import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Onboarding } from "@/components/Onboarding";
import { OnboardingSummary } from "@/components/OnboardingSummary";
import type { OnboardingData } from "@/components/Onboarding";
import { useUserStore } from "@/stores/useUserStore";
import Diary from "./pages/Diary";
import Tracker from "./pages/Tracker";
import HealthDiary from "./pages/HealthDiary";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { format, addWeeks, addMonths } from "date-fns";

const queryClient = new QueryClient();

function calculateCalories(data: OnboardingData): number {
  // Mifflin-St Jeor (assuming average age 30, moderate activity)
  const weight = data.currentWeight;
  const height = data.height;
  const bmr = 10 * weight + 6.25 * height - 5 * 30 + 5; // male baseline, simplified
  const tdee = bmr * 1.4; // lightly active

  switch (data.goal) {
    case "lose": return Math.round(tdee - 500);
    case "gain": return Math.round(tdee + 300);
    default: return Math.round(tdee);
  }
}

function calculateGoalDate(data: OnboardingData): string {
  const diff = Math.abs(data.currentWeight - data.targetWeight);
  if (diff === 0 || data.goal === "maintain" || data.goal === "health") {
    return "Ongoing";
  }
  // ~0.5 kg per week
  const weeks = Math.round(diff / 0.5);
  const date = addWeeks(new Date(), weeks);
  return format(date, "MMMM yyyy");
}

const AppContent = () => {
  const { profile, setProfile } = useUserStore();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    calories: number;
    goalDate: string;
    goal: string;
  } | null>(null);

  if (!profile.onboardingComplete && !showSummary) {
    return (
      <Onboarding
        onComplete={(data) => {
          const calories = calculateCalories(data);
          const goalDate = calculateGoalDate(data);
          setProfile({
            ...data,
            dailyCalorieTarget: calories,
            goalDate,
          });
          setSummaryData({ calories, goalDate, goal: data.goal });
          setShowSummary(true);
        }}
      />
    );
  }

  if (showSummary && summaryData) {
    return (
      <OnboardingSummary
        dailyCalories={summaryData.calories}
        goalDate={summaryData.goalDate}
        goal={summaryData.goal}
        onStart={() => {
          setProfile({ onboardingComplete: true });
          setShowSummary(false);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Diary />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/health-diary" element={<HealthDiary />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
