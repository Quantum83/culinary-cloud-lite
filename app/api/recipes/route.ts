import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

function getSupabaseForUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: token ? `Bearer ${token}` : "" } } },
  );
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const supabase = getSupabaseForUser(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function callClaude(prompt: string, maxTokens = 200): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!data.content?.[0]) throw new Error("No response from Claude");
  return data.content[0].text.trim();
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { url } = await req.json();
  if (!url)
    return NextResponse.json({ error: "URL is required" }, { status: 400 });

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    html = await response.text();
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
  }

  const $ = cheerio.load(html);
  let title = "Untitled Recipe";
  let ingredients: string[] = [];
  let instructions: string[] = [];
  let imageUrl: string | null = null;
  let prepTime: string | null = null;
  let cookTime: string | null = null;
  let totalTime: string | null = null;
  let recipeYield: string | null = null;
  let description: string | null = null;

  // helper to convert ISO 8601 duration to readable string
  function parseDuration(iso: string): string | null {
    if (!iso) return null;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return null;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const mins = match[2] ? parseInt(match[2]) : 0;
    if (hours && mins) return `${hours} hr ${mins} min`;
    if (hours) return `${hours} hr`;
    if (mins) return `${mins} min`;
    return null;
  }

  let sourceDomain = "";
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const domainMap: Record<string, string> = {
      "sallysbakingaddiction.com": "Sally's Baking Addiction",
      "preppykitchen.com": "Preppy Kitchen",
      "bbcgoodfood.com": "BBC Good Food",
      "simplyrecipes.com": "Simply Recipes",
      "foodnetwork.com": "Food Network",
      "allrecipes.com": "All Recipes",
      "tasty.co": "Tasty",
      "bonappetit.com": "Bon Appétit",
      "seriouseats.com": "Serious Eats",
      "smittenkitchen.com": "Smitten Kitchen",
      "halfbakedharvest.com": "Half Baked Harvest",
      "minimalistbaker.com": "Minimalist Baker",
    };
    sourceDomain = domainMap[hostname] || hostname;
  } catch {
    sourceDomain = "";
  }

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const data = json["@graph"]
        ? json["@graph"].find((item: any) => {
            const type = item["@type"];
            return Array.isArray(type)
              ? type.includes("Recipe")
              : type === "Recipe";
          })
        : json;
      if (data?.["@type"] === "Recipe") {
        if (data.name) title = $("<div>").html(data.name).text();
        if (data.recipeIngredient?.length) {
          ingredients = data.recipeIngredient.map((ing: string) =>
            $("<div>").html(ing).text(),
          );
        }
        if (data.recipeInstructions?.length) {
          instructions = data.recipeInstructions.map((step: any) =>
            $("<div>")
              .html(typeof step === "string" ? step : step.text)
              .text(),
          );
        }
        if (data.image) {
          imageUrl =
            typeof data.image === "string"
              ? data.image
              : Array.isArray(data.image)
                ? data.image[0]
                : data.image.url;
        }
        prepTime = parseDuration(data.prepTime) ?? null;
        cookTime = parseDuration(data.cookTime) ?? null;
        totalTime = parseDuration(data.totalTime) ?? null;
        recipeYield = Array.isArray(data.recipeYield)
          ? data.recipeYield[0]
          : (data.recipeYield ?? null);
        description = data.description
          ? $("<div>").html(data.description).text().slice(0, 300)
          : null;
      }
    } catch {
      /* skip */
    }
  });

  if (!ingredients.length) {
    title = $("title").first().text().trim() || "Untitled Recipe";
    for (const selector of [
      '[class*="ingredient"]',
      '[itemprop="recipeIngredient"]',
      ".ingredients li",
    ]) {
      const found = $(selector)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
      if (found.length) {
        ingredients = found;
        break;
      }
    }
  }

  if (!ingredients.length) {
    return NextResponse.json(
      { error: "Could not extract ingredients. Try a different URL." },
      { status: 422 },
    );
  }

  let tags: string[] = [];
  const autoTaggingHeader = req.headers.get("x-auto-tagging");
  if (autoTaggingHeader !== "false") {
    try {
      const tagText = await callClaude(
        `Given this recipe title and ingredients, assign 2-4 short tags from these categories ONLY:
breakfast, lunch, dinner, dessert, snack, vegetarian, vegan, quick, baking, healthy, comfort food, italian, mexican, asian, american, chocolate, cookies, cake, soup, salad, pasta

Title: ${title}
Ingredients: ${ingredients.slice(0, 10).join(", ")}

Reply with ONLY a JSON array of tags, no other text. Example: ["dinner", "italian", "quick"]`,
      );
      tags = JSON.parse(tagText.replace(/```json|```/g, "").trim());
    } catch {
      tags = [];
    }
  }

  const userId = await getUserId(req);
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title,
      ingredients,
      instructions,
      image_url: imageUrl,
      source_url: url,
      source_domain: sourceDomain,
      tags,
      user_id: userId,
      prep_time: prepTime,
      cook_time: cookTime,
      total_time: totalTime,
      recipe_yield: recipeYield,
      description,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { id, notes, tags } = await req.json();
  if (!id)
    return NextResponse.json(
      { error: "Recipe ID is required" },
      { status: 400 },
    );

  const updates: any = {};
  if (notes !== undefined) updates.notes = notes;
  if (tags !== undefined) updates.tags = tags;

  const { data, error } = await supabase
    .from("recipes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { id } = await req.json();
  if (!id)
    return NextResponse.json(
      { error: "Recipe ID is required" },
      { status: 400 },
    );

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { ingredients } = await req.json();
  if (!ingredients?.length)
    return NextResponse.json(
      { error: "No ingredients provided" },
      { status: 400 },
    );

  try {
    const combined = await callClaude(
      `You are a precise cooking assistant. Combine these ingredients from multiple recipes into a smart grocery list.

Each ingredient is prefixed with the recipe title in brackets like [Recipe Title].

For each unique ingredient:
1. Add up all quantities mathematically into a single total
2. Show a breakdown per recipe using the recipe title as the hint (2-3 words max from the title)

Return a JSON array where each item is formatted exactly like:
"TOTAL_AMOUNT INGREDIENT_NAME | breakdown: AMOUNT (RECIPE_HINT), AMOUNT (RECIPE_HINT)"

Rules:
- Convert to consistent units before adding
- Use practical units in the total
- Recipe hint should be 2-3 words max from the actual recipe title
- Remove exact duplicates
- Reply with ONLY the JSON array

Ingredients:
${ingredients.join("\n")}`,
      2000,
    );
    const result = JSON.parse(combined.replace(/```json|```/g, "").trim());
    return NextResponse.json({ ingredients: result });
  } catch {
    return NextResponse.json({ ingredients });
  }
}
