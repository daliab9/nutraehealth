import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a food nutrition database. When given a food search query, return matching food items with accurate nutritional information per 100g serving. Include micronutrients: fiber (g), iron (mg), vitamin_d (IU), magnesium (mg), omega3 (g), b12 (mcg). Use 0 if negligible. For default_portion_amount and default_portion_unit, use the most natural serving unit for that item (e.g. wine=150 ml, supplements like CoQ10=100 mg, milk=250 ml, bread=30 g, an apple=1 whole). For available_units, return ONLY the units that make sense for this specific food. ALWAYS include "whole" as a unit for countable foods (fruits, vegetables, eggs, etc.) so users can say "2 whole eggplants". Examples: blueberries=["g","cup","whole"], eggplant=["g","cup","whole"], avocado toast=["slice"], milk=["ml","cup","tbsp"], chicken breast=["g","oz","whole"], egg=["g","whole"]. For default_portion_g, provide the gram weight of one whole item for countable foods (e.g. eggplant=550, apple=182, egg=50, banana=118). Always include at least the default unit. Return results using the suggest_foods function.`,
          },
          {
            role: "user",
            content: `Search for foods matching: "${query}". Return up to 6 relevant results. Include common foods, branded items if relevant, and variations.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_foods",
              description: "Return food suggestions with nutritional data per 100g. Use appropriate default_portion_unit for each food.",
              parameters: {
                type: "object",
                properties: {
                  foods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Food name" },
                        calories: { type: "number", description: "Calories per 100g" },
                        protein: { type: "number", description: "Protein in grams per 100g" },
                        carbs: { type: "number", description: "Carbohydrates in grams per 100g" },
                        fat: { type: "number", description: "Fat in grams per 100g" },
                        default_portion_amount: { type: "number", description: "Typical single serving amount in the natural unit for this food (e.g. 150 for wine in ml, 1 for apple in whole, 250 for milk in ml, 30 for bread in g)" },
                        default_portion_unit: { type: "string", description: "The natural unit for this food's portion: g, ml, mg, oz, cup, tbsp, tsp, slice, piece, whole, etc. Use 'whole' for countable items like fruits, vegetables, eggs." },
                        default_portion_g: { type: "number", description: "The gram weight of one whole unit of this food if countable (e.g. eggplant=550, apple=182, egg=50, banana=118). For non-countable foods, use 100." },
                        available_units: { type: "array", items: { type: "string" }, description: "Only the units that make sense for this food. Include 'whole' for countable items. E.g. blueberries=['g','cup','whole'], eggplant=['g','cup','whole'], avocado toast=['slice'], milk=['ml','cup','tbsp']" },
                        portion_label: { type: "string", description: "Human readable description e.g. '1 glass', '1 medium apple', '1 capsule', '1 whole eggplant'" },
                      },
                      required: ["name", "calories", "protein", "carbs", "fat", "default_portion_amount", "default_portion_unit", "available_units", "portion_label"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["foods"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_foods" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ results: parsed.foods || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-food error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
