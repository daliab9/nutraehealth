import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTodayMeals = () => {
  const { user } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["meals", "today", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user!.id)
        .gte("eaten_at", today.toISOString())
        .order("eaten_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAllMeals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meals", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user!.id)
        .order("eaten_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useMealWithItems = (mealId: string) => {
  return useQuery({
    queryKey: ["meal", mealId],
    queryFn: async () => {
      const [mealRes, itemsRes] = await Promise.all([
        supabase.from("meals").select("*").eq("id", mealId).single(),
        supabase.from("meal_items").select("*").eq("meal_id", mealId),
      ]);
      if (mealRes.error) throw mealRes.error;
      if (itemsRes.error) throw itemsRes.error;
      return { meal: mealRes.data, items: itemsRes.data };
    },
    enabled: !!mealId,
  });
};

export const useCreateMeal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meal,
      items,
    }: {
      meal: {
        name: string;
        photo_url?: string;
        total_calories: number;
        total_protein: number;
        total_carbs: number;
        total_fat: number;
        meal_type?: string;
      };
      items: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        quantity?: string;
      }[];
    }) => {
      const { data: mealData, error: mealError } = await supabase
        .from("meals")
        .insert({ ...meal, user_id: user!.id })
        .select()
        .single();
      if (mealError) throw mealError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("meal_items")
          .insert(items.map((item) => ({ ...item, meal_id: mealData.id })));
        if (itemsError) throw itemsError;
      }

      return mealData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", mealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
};
