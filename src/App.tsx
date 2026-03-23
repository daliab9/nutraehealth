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
import { ForgotPasswordPage } from "@/components/ForgotPasswordPage";
import { ResetPasswordPage } from "@/components/ResetPasswordPage";
import type { OnboardingData } from "@/components/Onboarding";
import { useUserStore, UserStoreProvider } from "@/stores/useUserStore";
import { supabase } from "@/integrations/supabase/client";
import Diary from "./pages/Diary";
import Tracker from "./pages/Tracker";
import HealthDiary from "./pages/HealthDiary";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { format } from "date-fns";
import type { Session } from "@supabase/supabase-js";
import { calculateCalories, calculateGoalDate, getMainGoal } from "@/utils/calorieCalculation";
import type { ActivityLevel, GoalTimeline } from "@/utils/calorieCalculation";
const queryClient = new QueryClient();

type AppScreen = "loading" | "landing" | "onboarding" | "login" | "forgot-password" | "reset-password" | "summary" | "signup" | "main";

const AppContent = () => {
  const { profile, setProfile, loadAllFromDB, resetStore } = useUserStore();
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [pendingOnboardingData, setPendingOnboardingData] = useState<OnboardingData | null>(null);
  const [summaryData, setSummaryData] = useState<{
    calories: number;
    goalDate: string;
    goals: string[];
  } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === "PASSWORD_RECOVERY") {
        setScreen("reset-password");
      }
      if (!sess) {
        resetStore();
        setScreen("landing");
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);

      if (window.location.pathname === "/reset-password") {
        setScreen("reset-password");
        return;
      }

      if (sess) {
        loadProfileFromDB(sess.user.id);
      } else {
        setScreen("landing");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfileRow = async (userId: string) => {
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return false;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: userId });

      if (insertError) {
        return false;
      }
    }

    return true;
  };

  const loadProfileFromDB = async (userId: string) => {
    const profileReady = await ensureProfileRow(userId);

    if (!profileReady) {
      setScreen("onboarding");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

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
        activityLevel: (data.activity_level as ActivityLevel) || "sedentary",
        goalTimeline: (data.goal_timeline as GoalTimeline) || "3_4_months",
        dailyCalorieTarget: data.daily_calorie_goal ?? 2000,
        goalDate: data.goal_date ?? "",
        weightHistory: (data as any).weight_history ?? [],
        cycleStartDate: (data as any).cycle_start_date ?? undefined,
        cycleDuration: (data as any).cycle_duration ?? 5,
        trackedNutrients: (data as any).tracked_nutrients ?? ["calories", "protein", "fiber"],
        nutrientTargetOverrides: (data as any).nutrient_target_overrides ?? {},
        cholesterolLevel: (data as any).cholesterol_level ?? "",
        subscription: (data as any).subscription ?? "free",
        aiScansUsed: (data as any).ai_scans_used ?? 0,
      });
      // Load diary, health, saved meals, exercises, defaults from DB
      await loadAllFromDB(userId);
      setScreen("main");
    } else {
      setScreen("onboarding");
    }
  };

  const saveOnboardingToDB = async (userId: string, data: OnboardingData) => {
    const calories = calculateCalories(data.currentWeight, data.targetWeight, data.age, data.height, data.gender, data.goals, data.activityLevel, data.goalTimeline);
    const goalDate = calculateGoalDate(data.currentWeight, data.targetWeight, data.goals, data.goalTimeline, data.age, data.height, data.gender, data.activityLevel);

    await ensureProfileRow(userId);

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
        activity_level: data.activityLevel,
        goal_timeline: data.goalTimeline,
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
          supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
            if (!sess) return;

            if (pendingOnboardingData) {
              await saveOnboardingToDB(sess.user.id, pendingOnboardingData);
              setPendingOnboardingData(null);
              setSummaryData(null);
              setScreen("main");
              return;
            }

            loadProfileFromDB(sess.user.id);
          });
        }}
        onBack={() => setScreen("landing")}
        onForgotPassword={() => setScreen("forgot-password")}
      />
    );
  }

  if (screen === "forgot-password") {
    return <ForgotPasswordPage onBack={() => setScreen("login")} />;
  }

  if (screen === "reset-password") {
    return (
      <ResetPasswordPage
        onDone={() => {
          window.history.replaceState({}, "", "/");
          supabase.auth.getSession().then(({ data: { session: sess } }) => {
            if (sess) loadProfileFromDB(sess.user.id);
            else setScreen("login");
          });
        }}
      />
    );
  }

  if (screen === "onboarding") {
    return (
      <Onboarding
        onComplete={(data) => {
          const calories = calculateCalories(data.currentWeight, data.targetWeight, data.age, data.height, data.gender, data.goals, data.activityLevel, data.goalTimeline);
          const goalDate = calculateGoalDate(data.currentWeight, data.targetWeight, data.goals, data.goalTimeline, data.age, data.height, data.gender, data.activityLevel);
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
        onLoginExisting={() => setScreen("login")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupPage
        onSignupComplete={async (userId) => {
          if (pendingOnboardingData) {
            await saveOnboardingToDB(userId, pendingOnboardingData);
            setPendingOnboardingData(null);
            setSummaryData(null);
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
      <UserStoreProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </UserStoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
