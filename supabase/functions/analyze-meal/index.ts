import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Support both legacy single image and new multi-image format
    let imageEntries: { base64: string; mimeType: string }[] = [];
    if (body.images && Array.isArray(body.images)) {
      imageEntries = body.images;
    } else if (body.image) {
      imageEntries = [{ base64: body.image, mimeType: body.mimeType || "image/jpeg" }];
    }

    if (imageEntries.length === 0) throw new Error("No images provided");

    const imageContent = imageEntries.map((img) => ({
      type: "image_url" as const,
      image_url: { url: `data:${img.mimeType || "image/jpeg"};base64,${img.base64}` },
    }));

    const photoWord = imageEntries.length === 1 ? "this image" : `these ${imageEntries.length} images`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a nutrition analysis AI. Analyze food images and identify all food items with their estimated nutritional information including micronutrients. Be accurate and realistic with portions visible in the images.`,
          },
          {
            role: "user",
            content: [
              ...imageContent,
              {
                type: "text",
                text: `Identify all food items in ${photoWord}. For each item, estimate calories, protein (g), carbs (g), fat (g), fiber (g), iron (mg), vitamin_d (IU), magnesium (mg), omega3 (g), b12 (mcg). Also suggest a meal name.`,
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_nutrition",
              description: "Report the identified food items and their nutrition data",
              parameters: {
                type: "object",
                properties: {
                  mealName: { type: "string", description: "A short descriptive name for the meal" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" },
                        quantity: { type: "string" },
                      },
                      required: ["name", "calories", "protein", "carbs", "fat", "quantity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["mealName", "items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_nutrition" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-meal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
