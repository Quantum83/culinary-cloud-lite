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

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title,
      ingredients,
      instructions,
      image_url: imageUrl,
      source_url: url,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, notes } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Recipe ID is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("recipes")
    .update({ notes })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
