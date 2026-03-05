import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

function getSupabaseForUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    },
  );
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const supabase = getSupabaseForUser(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function callClaude(
  prompt: string,
  maxTokens: number = 200,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
  const data = await response.json();
  if (!data.content || !data.content[0])
    throw new Error("No response from Claude");
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

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

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

  const scriptTags = $('script[type="application/ld+json"]');

  scriptTags.each((_, el) => {
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

      if (data && data["@type"] === "Recipe") {
        if (data.name) title = $("<div>").html(data.name).text();
        if (data.recipeIngredient && data.recipeIngredient.length > 0) {
          ingredients = data.recipeIngredient.map((ing: string) =>
            $("<div>").html(ing).text(),
          );
        }
        if (data.recipeInstructions && data.recipeInstructions.length > 0) {
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
      }
    } catch {
      // If parsing fails, just move on
    }
  });

  if (ingredients.length === 0) {
    title = $("title").first().text().trim() || "Untitled Recipe";
    const ingredientSelectors = [
      '[class*="ingredient"]',
      '[itemprop="recipeIngredient"]',
      ".ingredients li",
      ".recipe-ingredients li",
    ];
    for (const selector of ingredientSelectors) {
      const found = $(selector)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
      if (found.length > 0) {
        ingredients = found;
        break;
      }
    }
  }

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "Could not extract ingredients. Try a different URL." },
      { status: 422 },
    );
  }

  let tags: string[] = [];
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

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json(
      { error: "No ingredients provided" },
      { status: 400 },
    );
  }

  try {
    const combined = await callClaude(
      `You are a precise cooking assistant. I have ingredients from multiple recipes that need to be combined into a smart grocery list.

For each unique ingredient:
1. Add up all quantities mathematically into a single total (convert to consistent units first)
2. Show the total clearly
3. Show a breakdown of which recipe needs what amount

Return a JSON array where each item is a string formatted exactly like this:
"TOTAL_AMOUNT INGREDIENT_NAME | breakdown: AMOUNT (RECIPE_HINT), AMOUNT (RECIPE_HINT)"

Example output:
["3 cups all-purpose flour | breakdown: 2 cups (chocolate cake), 1 cup (cookie dough)",
 "4 large eggs | breakdown: 2 eggs (chocolate cake), 2 eggs (brioche)",
 "1 tsp vanilla extract | breakdown: 1 tsp (cookie dough)"]

Rules:
- Convert everything to the same unit before adding (e.g. convert all butter to grams)
- For the total, use the most practical unit (grams for butter, cups for flour etc.)
- If quantities truly cannot be combined, still group them under one item
- The recipe hint should be 2-3 words max describing the ingredient's context
- Remove exact duplicates
- Reply with ONLY the JSON array, no other text

Ingredients to combine:
${ingredients.join("\n")}`,
      2000,
    );
    const result = JSON.parse(combined.replace(/```json|```/g, "").trim());
    return NextResponse.json({ ingredients: result });
  } catch {
    return NextResponse.json({ ingredients });
  }
}
