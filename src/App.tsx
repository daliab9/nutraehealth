import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Onboarding } from "@/components/Onboarding";
import { OnboardingSummary } from "@/components/OnboardingSummary";
import { LandingPage } from "@/components/LandingPage";
import { LoginPage } from "@/components/LoginPage";
import type { OnboardingData } from "@/components/Onboarding";
import { useUserStore } from "@/stores/useUserStore";
import Diary from "./pages/Diary";
import Tracker from "./pages/Tracker";
import HealthDiary from "./pages/HealthDiary";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { format, addWeeks, addMonths } from "date-fns";

const queryClient = new QueryClient();

function getMainGoal(goals: string[]): string {
  if (goals.includes("lose_weight") || goals.includes("reduce_body_fat")) return "lose";
  if (goals.includes("gain_muscle")) return "gain";
  if (goals.includes("maintain_weight")) return "maintain";
  return "health";
}

function calculateCalories(data: OnboardingData): number {
  const weight = data.currentWeight;
  const height = data.height;
  const age = data.age || 30;
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * 1.4;
  const goal = getMainGoal(data.goals);

  switch (goal) {
    case "lose": return Math.round(tdee - 500);
    case "gain": return Math.round(tdee + 300);
    default: return Math.round(tdee);
  }
}

function calculateGoalDate(data: OnboardingData): string {
  const goal = getMainGoal(data.goals);
  const diff = Math.abs(data.currentWeight - data.targetWeight);
  if (diff === 0 || goal === "maintain" || goal === "health") {
    return "Ongoing";
  }
  const weeks = Math.round(diff / 0.5);
  const date = addWeeks(new Date(), weeks);
  return format(date, "MMMM yyyy");
}

type AppScreen = "landing" | "onboarding" | "login" | "summary" | "main";

const AppContent = () => {
  const { profile, setProfile } = useUserStore();
  const [screen, setScreen] = useState<AppScreen>(
    profile.onboardingComplete ? "main" : "landing"
  );
  const [summaryData, setSummaryData] = useState<{
    calories: number;
    goalDate: string;
    goals: string[];
  } | null>(null);

  if (screen === "landing") {
    return (
      <LandingPage
        onGetStarted={() => setScreen("onboarding")}
        onLogin={() => setScreen("login")}
      />
    );
  }

  if (screen === "login") {
    return (
      <LoginPage
        onLogin={() => {
          setProfile({ onboardingComplete: true });
          setScreen("main");
        }}
        onBack={() => setScreen("landing")}
      />
    );
  }

  if (screen === "onboarding") {
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
          setSummaryData({ calories, goalDate, goals: data.goals });
          setScreen("summary");
        }}
      />
    );
  }

  if (screen === "summary" && summaryData) {
    return (
      <OnboardingSummary
        dailyCalories={summaryData.calories}
        goalDate={summaryData.goalDate}
        goals={summaryData.goals}
        onStart={() => {
          setProfile({ onboardingComplete: true });
          setScreen("main");
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
