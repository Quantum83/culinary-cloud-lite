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

  const title = $("title").first().text().trim() || "Untitled Recipe";

  const ingredientSelectors = [
    '[class*="ingredient"]',
    '[itemprop="recipeIngredient"]',
    ".ingredients li",
    ".recipe-ingredients li",
  ];

  let ingredients: string[] = [];

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

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "Could not extract ingredients. Try a different URL." },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({ title, ingredients, source_url: url })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
