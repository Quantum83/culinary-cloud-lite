import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser } from "@/lib/supabase-server";

async function callClaude(prompt: string, maxTokens = 2000): Promise<string> {
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

export async function POST(req: NextRequest) {
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
    );
    const result = JSON.parse(combined.replace(/```json|```/g, "").trim());
    return NextResponse.json({ ingredients: result });
  } catch {
    return NextResponse.json({ ingredients });
  }
}
