import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let html: string;
  try {
    const response = await fetch(url);
    html = await response.text();
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
  }
  const $ = cheerio.load(html);

  let title = "Untitled Recipe";
  let ingredients: string[] = [];

  // First, look for Schema.org structured data
  // This is a hidden JSON block most recipe sites embed for Google
  const scriptTags = $('script[type="application/ld+json"]');

  scriptTags.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");

      // Sometimes the recipe is nested inside a @graph array
      const data = json["@graph"]
        ? json["@graph"].find((item: any) => item["@type"] === "Recipe")
        : json;

      if (data && data["@type"] === "Recipe") {
        if (data.name) title = data.name;
        if (data.recipeIngredient && data.recipeIngredient.length > 0) {
          ingredients = data.recipeIngredient;
        }
      }
    } catch {
      // If parsing fails, just move on
    }
  });

  // If Schema.org didn't work, fall back to CSS selectors
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
}
