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
import { SignupPage } from "@/components/SignupPage";
import type { OnboardingData } from "@/components/Onboarding";
import { useUserStore } from "@/stores/useUserStore";
import { supabase } from "@/integrations/supabase/client";
import Diary from "./pages/Diary";
import Tracker from "./pages/Tracker";
import HealthDiary from "./pages/HealthDiary";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { format, addWeeks } from "date-fns";
import type { Session } from "@supabase/supabase-js";

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

type AppScreen = "loading" | "landing" | "onboarding" | "login" | "summary" | "signup" | "main";

const AppContent = () => {
  const { profile, setProfile } = useUserStore();
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [pendingOnboardingData, setPendingOnboardingData] = useState<OnboardingData | null>(null);
  const [summaryData, setSummaryData] = useState<{
    calories: number;
    goalDate: string;
    goals: string[];
  } | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess) {
        // User is logged in — check if onboarding is complete
        loadProfileFromDB(sess.user.id);
      } else {
        setScreen("landing");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfileFromDB = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data && data.onboarding_complete) {
      setProfile({
        onboardingComplete: true,
        age: data.age ?? 25,
        gender: data.gender ?? "",
        currentWeight: Number(data.current_weight) || 70,
        targetWeight: Number(data.target_weight) || 65,
        height: Number(data.height) || 170,
        weightUnit: (data.weight_unit as "kg" | "lbs") || "kg",
        heightUnit: (data.height_unit as "cm" | "ft") || "cm",
        goals: data.goals ?? [],
        dietaryPreferences: data.dietary_preferences ?? [],
        dietaryRestrictions: data.dietary_restrictions ?? [],
        healthConcerns: data.health_concerns ?? [],
        dailyCalorieTarget: data.daily_calorie_goal ?? 2000,
        goalDate: data.goal_date ?? "",
      });
      setScreen("main");
    } else {
      // Profile exists but onboarding not done — send to onboarding
      setScreen("onboarding");
    }
  };

  const saveOnboardingToDB = async (userId: string, data: OnboardingData) => {
    const calories = calculateCalories(data);
    const goalDate = calculateGoalDate(data);

    await supabase
      .from("profiles")
      .update({
        age: data.age,
        gender: data.gender,
        current_weight: data.currentWeight,
        target_weight: data.targetWeight,
        height: data.height,
        weight_unit: data.weightUnit,
        height_unit: data.heightUnit,
        goals: data.goals,
        dietary_preferences: data.dietaryPreferences,
        dietary_restrictions: data.dietaryRestrictions,
        health_concerns: data.healthConcerns,
        daily_calorie_goal: calories,
        goal_date: goalDate,
        onboarding_complete: true,
      })
      .eq("user_id", userId);

    setProfile({
      ...data,
      onboardingComplete: true,
      dailyCalorieTarget: calories,
      goalDate,
    });
  };

  if (screen === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
          // Session is set via onAuthStateChange; load profile
          supabase.auth.getSession().then(({ data: { session: sess } }) => {
            if (sess) {
              loadProfileFromDB(sess.user.id);
            }
          });
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
          setPendingOnboardingData(data);
          setProfile({ ...data, dailyCalorieTarget: calories, goalDate });
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
        onStart={() => setScreen("signup")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupPage
        onSignupComplete={async (userId) => {
          if (pendingOnboardingData) {
            await saveOnboardingToDB(userId, pendingOnboardingData);
          }
          setScreen("main");
        }}
        onGoToLogin={() => setScreen("login")}
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
