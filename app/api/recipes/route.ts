import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseForUser, getSupabaseServer } from "@/lib/supabase-server";

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

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "source",
      "campaign",
      "mc_cid",
      "mc_eid",
      "_hsenc",
      "_hsmi",
      "hsCtaTracking",
      "email_source",
      "email_id",
    ];
    trackingParams.forEach((p) => u.searchParams.delete(p));
    // remove trailing slash
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      // regular watch URL
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      // shorts URL
      if (u.pathname.startsWith("/shorts/"))
        return u.pathname.split("/shorts/")[1].split("/")[0];
    }
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
  } catch {}
  return null;
}

function hasRecipeContent(text: string): boolean {
  const ingredientPatterns =
    /\b(ingredients?|instructions?|directions?|method|recipe)\b/i;
  const quantityPatterns =
    /\b(\d+\s*(cup|tbsp|tsp|tablespoon|teaspoon|gram|g|oz|ml|pound|lb)s?\b)/i;
  const listPatterns = /^[\-\*\d]+[\.\)]\s+\w/m;
  return (
    ingredientPatterns.test(text) &&
    (quantityPatterns.test(text) || listPatterns.test(text))
  );
}

function extractUrlFromText(text: string): string | null {
  const urlPattern =
    /https?:\/\/(?!(?:www\.)?(?:youtube\.com|youtu\.be))[^\s<>"]+/i;
  const match = text.match(urlPattern);
  return match ? match[0] : null;
}

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

async function fetchYouTubeData(videoId: string) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${process.env.YOUTUBE_API_KEY}`,
      {
        headers: {
          Referer: "https://www.culinary-cloud.com",
          Origin: "https://www.culinary-cloud.com",
        },
      },
    );
    const data = await res.json();
    const snippet = data.items?.[0]?.snippet;
    if (!snippet) return null;
    return {
      title: snippet.title,
      description: snippet.description,
      thumbnail:
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        "",
    };
  } catch {
    return null;
  }
}

async function scrapeUrl(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });
  const html = await response.text();
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
    } catch {}
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

  return {
    title,
    ingredients,
    instructions,
    imageUrl,
    prepTime,
    cookTime,
    totalTime,
    recipeYield,
    description,
  };
}

type CachedRecipe = {
  title: string;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  recipe_yield: string | null;
  description: string | null;
  video_id: string | null;
};

async function getCachedRecipe(
  normalizedUrl: string,
  videoId: string | null,
): Promise<CachedRecipe | null> {
  const supabase = getSupabaseServer();
  const query = videoId
    ? supabase.from("recipe_cache").select("*").eq("video_id", videoId).single()
    : supabase
        .from("recipe_cache")
        .select("*")
        .eq("source_url", normalizedUrl)
        .single();

  const { data, error } = await query;
  if (error || !data) return null;

  // check staleness — rescrape if older than 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  if (new Date(data.scraped_at) < sixMonthsAgo) return null;

  return data;
}

async function writeCacheEntry(
  normalizedUrl: string,
  videoId: string | null,
  recipe: CachedRecipe,
) {
  const supabase = getSupabaseServer();
  await supabase.from("recipe_cache").upsert(
    {
      source_url: normalizedUrl,
      video_id: videoId,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image_url: recipe.image_url,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      total_time: recipe.total_time,
      recipe_yield: recipe.recipe_yield,
      description: recipe.description,
      scraped_at: new Date().toISOString(),
    },
    { onConflict: "source_url" },
  );
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

  const autoTagging = req.headers.get("x-auto-tagging") !== "false";
  const youtubeExtraction = req.headers.get("x-youtube-extraction") !== "false";
  const normalizedUrl = normalizeUrl(url);
  const videoId = extractYouTubeId(url);

  // per-user dedup check
  const userId = await getUserId(req);
  const dupQuery = videoId
    ? supabase
        .from("recipes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .single()
    : supabase
        .from("recipes")
        .select("id, title")
        .eq("source_url", normalizedUrl)
        .eq("user_id", userId)
        .single();

  const { data: existing } = await dupQuery;
  if (existing) {
    // fetch full recipe and return with duplicate flag
    const { data: existingRecipe } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", existing.id)
      .single();
    return NextResponse.json(
      { ...existingRecipe, _duplicate: true },
      { status: 200 },
    );
  }

  let recipeData: CachedRecipe;
  let sourceDomain = "Unknown";

  if (videoId) {
    // YouTube flow
    const ytData = await fetchYouTubeData(videoId);
    if (!ytData)
      return NextResponse.json(
        { error: "Could not fetch YouTube video data." },
        { status: 400 },
      );

    // check cache first
    const cached = await getCachedRecipe(normalizedUrl, videoId);
    if (cached) {
      recipeData = cached;
    } else {
      let ingredients: string[] = [];
      let instructions: string[] = [];
      let prepTime = null,
        cookTime = null,
        totalTime = null,
        recipeYield = null,
        description = null;

      if (youtubeExtraction) {
        const desc = ytData.description;
        const recipeUrl = extractUrlFromText(desc);
        if (recipeUrl) {
          try {
            const scraped = await scrapeUrl(recipeUrl);
            if (scraped.ingredients.length) {
              ingredients = scraped.ingredients;
              instructions = scraped.instructions;
              prepTime = scraped.prepTime;
              cookTime = scraped.cookTime;
              totalTime = scraped.totalTime;
              recipeYield = scraped.recipeYield;
              description = scraped.description;
            }
          } catch {}
        }
        if (!ingredients.length && hasRecipeContent(desc)) {
          try {
            const parsed = await callClaude(
              `Extract the recipe from this YouTube video description. Return ONLY a JSON object with keys "title" (string), "ingredients" (array of strings), "instructions" (array of strings). If there is no clear recipe, return {"title": null, "ingredients": [], "instructions": []}.

Description:
${desc.slice(0, 3000)}`,
              1000,
            );
            const result = JSON.parse(
              parsed.replace(/```json|```/g, "").trim(),
            );
            if (result.ingredients?.length) {
              ingredients = result.ingredients;
              instructions = result.instructions || [];
            }
          } catch {}
        }
        if (!ingredients.length) {
          ingredients = ["No recipe found in video description."];
        }
      } else {
        ingredients = [
          "YouTube extraction is disabled. Enable it in Settings to parse the recipe.",
        ];
      }

      recipeData = {
        title: ytData.title,
        ingredients,
        instructions,
        image_url: ytData.thumbnail,
        prep_time: prepTime,
        cook_time: cookTime,
        total_time: totalTime,
        recipe_yield: recipeYield,
        description,
        video_id: videoId,
      };

      await writeCacheEntry(normalizedUrl, videoId, recipeData);
    }

    sourceDomain = "YouTube";
  } else {
    // Regular URL flow
    // check cache first
    const cached = await getCachedRecipe(normalizedUrl, null);

    if (cached) {
      recipeData = cached;
    } else {
      let scraped;
      try {
        scraped = await scrapeUrl(normalizedUrl);
      } catch {
        return NextResponse.json(
          { error: "Failed to fetch URL" },
          { status: 400 },
        );
      }

      if (!scraped.ingredients.length) {
        return NextResponse.json(
          { error: "Could not extract ingredients. Try a different URL." },
          { status: 422 },
        );
      }

      recipeData = {
        title: scraped.title,
        ingredients: scraped.ingredients,
        instructions: scraped.instructions,
        image_url: scraped.imageUrl,
        prep_time: scraped.prepTime,
        cook_time: scraped.cookTime,
        total_time: scraped.totalTime,
        recipe_yield: scraped.recipeYield,
        description: scraped.description,
        video_id: null,
      };

      await writeCacheEntry(normalizedUrl, null, recipeData);
    }

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
  }

  // auto-tag
  let tags: string[] = [];
  const shouldTag =
    autoTagging &&
    recipeData.ingredients.length > 0 &&
    recipeData.ingredients[0] !== "No recipe found in video description." &&
    recipeData.ingredients[0] !==
      "YouTube extraction is disabled. Enable it in Settings to parse the recipe.";

  if (shouldTag) {
    try {
      const tagText = await callClaude(
        `Given this recipe title and ingredients, assign 2-4 short tags from these categories ONLY:
breakfast, lunch, dinner, dessert, snack, vegetarian, vegan, quick, baking, healthy, comfort food, italian, mexican, asian, american, chocolate, cookies, cake, soup, salad, pasta

Title: ${recipeData.title}
Ingredients: ${recipeData.ingredients.slice(0, 10).join(", ")}

Reply with ONLY a JSON array of tags, no other text. Example: ["dinner", "italian", "quick"]`,
      );
      tags = JSON.parse(tagText.replace(/```json|```/g, "").trim());
    } catch {
      tags = [];
    }
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: recipeData.title,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      image_url: recipeData.image_url,
      source_url: normalizedUrl,
      source_domain: sourceDomain,
      tags,
      user_id: userId,
      prep_time: recipeData.prep_time,
      cook_time: recipeData.cook_time,
      total_time: recipeData.total_time,
      recipe_yield: recipeData.recipe_yield,
      description: recipeData.description,
      video_url: videoId ? url : null,
      video_id: videoId,
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
