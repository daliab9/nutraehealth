export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      default_exercise_overrides: {
        Row: {
          created_at: string
          date: string
          default_exercise_id: string
          id: string
          removed: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          default_exercise_id: string
          id?: string
          removed?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          default_exercise_id?: string
          id?: string
          removed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      default_exercises: {
        Row: {
          calories_burned: number
          created_at: string
          created_at_date: string | null
          duration: number
          frequency: string
          id: string
          name: string
          secondary_metric: number | null
          secondary_unit: string | null
          specific_days: number[] | null
          user_id: string
        }
        Insert: {
          calories_burned?: number
          created_at?: string
          created_at_date?: string | null
          duration?: number
          frequency?: string
          id?: string
          name: string
          secondary_metric?: number | null
          secondary_unit?: string | null
          specific_days?: number[] | null
          user_id: string
        }
        Update: {
          calories_burned?: number
          created_at?: string
          created_at_date?: string | null
          duration?: number
          frequency?: string
          id?: string
          name?: string
          secondary_metric?: number | null
          secondary_unit?: string | null
          specific_days?: number[] | null
          user_id?: string
        }
        Relationships: []
      }
      default_meal_overrides: {
        Row: {
          created_at: string
          date: string
          default_meal_id: string
          id: string
          removed: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          default_meal_id: string
          id?: string
          removed?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          default_meal_id?: string
          id?: string
          removed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      default_meals: {
        Row: {
          created_at: string
          created_at_date: string | null
          frequency: string
          id: string
          items: Json
          meal_type: string
          name: string
          specific_days: number[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_at_date?: string | null
          frequency?: string
          id?: string
          items?: Json
          meal_type: string
          name: string
          specific_days?: number[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_at_date?: string | null
          frequency?: string
          id?: string
          items?: Json
          meal_type?: string
          name?: string
          specific_days?: number[] | null
          user_id?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          created_at: string
          date: string
          exercises: Json
          id: string
          meals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          exercises?: Json
          id?: string
          meals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          exercises?: Json
          id?: string
          meals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_entries: {
        Row: {
          created_at: string
          data: Json
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          meal_id: string
          name: string
          protein: number
          quantity: string | null
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          meal_id: string
          name: string
          protein?: number
          quantity?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          meal_id?: string
          name?: string
          protein?: number
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          eaten_at: string
          id: string
          meal_type: string | null
          name: string
          photo_url: string | null
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          eaten_at?: string
          id?: string
          meal_type?: string | null
          name?: string
          photo_url?: string | null
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          eaten_at?: string
          id?: string
          meal_type?: string | null
          name?: string
          photo_url?: string | null
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          ai_scans_used: number | null
          cholesterol_level: string | null
          created_at: string
          current_weight: number | null
          cycle_duration: number | null
          cycle_start_date: string | null
          daily_calorie_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          daily_protein_goal: number
          dietary_preferences: string[] | null
          dietary_restrictions: string[] | null
          display_name: string | null
          gender: string | null
          goal_date: string | null
          goal_timeline: string | null
          goals: string[] | null
          health_concerns: string[] | null
          height: number | null
          height_unit: string | null
          id: string
          nutrient_target_overrides: Json | null
          onboarding_complete: boolean | null
          subscription: string | null
          target_weight: number | null
          tracked_nutrients: string[] | null
          updated_at: string
          user_id: string
          weight_history: Json | null
          weight_unit: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          ai_scans_used?: number | null
          cholesterol_level?: string | null
          created_at?: string
          current_weight?: number | null
          cycle_duration?: number | null
          cycle_start_date?: string | null
          daily_calorie_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          daily_protein_goal?: number
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          display_name?: string | null
          gender?: string | null
          goal_date?: string | null
          goal_timeline?: string | null
          goals?: string[] | null
          health_concerns?: string[] | null
          height?: number | null
          height_unit?: string | null
          id?: string
          nutrient_target_overrides?: Json | null
          onboarding_complete?: boolean | null
          subscription?: string | null
          target_weight?: number | null
          tracked_nutrients?: string[] | null
          updated_at?: string
          user_id: string
          weight_history?: Json | null
          weight_unit?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          ai_scans_used?: number | null
          cholesterol_level?: string | null
          created_at?: string
          current_weight?: number | null
          cycle_duration?: number | null
          cycle_start_date?: string | null
          daily_calorie_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          daily_protein_goal?: number
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          display_name?: string | null
          gender?: string | null
          goal_date?: string | null
          goal_timeline?: string | null
          goals?: string[] | null
          health_concerns?: string[] | null
          height?: number | null
          height_unit?: string | null
          id?: string
          nutrient_target_overrides?: Json | null
          onboarding_complete?: boolean | null
          subscription?: string | null
          target_weight?: number | null
          tracked_nutrients?: string[] | null
          updated_at?: string
          user_id?: string
          weight_history?: Json | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      saved_exercises: {
        Row: {
          calories_burned: number
          created_at: string
          duration: number
          id: string
          name: string
          secondary_metric: number | null
          secondary_unit: string | null
          user_id: string
        }
        Insert: {
          calories_burned?: number
          created_at?: string
          duration?: number
          id?: string
          name: string
          secondary_metric?: number | null
          secondary_unit?: string | null
          user_id: string
        }
        Update: {
          calories_burned?: number
          created_at?: string
          duration?: number
          id?: string
          name?: string
          secondary_metric?: number | null
          secondary_unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          created_at: string
          id: string
          items: Json
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
