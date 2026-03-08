import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { recipes } = await req.json();
  if (!recipes?.length || recipes.length < 2) {
    return NextResponse.json(
      { error: "At least 2 recipes required" },
      { status: 400 },
    );
  }

  const recipeDescriptions = recipes
    .map(
      (r: any, i: number) =>
        `Recipe ${i + 1}: ${r.title}\nIngredients: ${r.ingredients.join(", ")}`,
    )
    .join("\n\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Compare these recipes and write a short, conversational paragraph (3-5 sentences) highlighting the key differences between them. Focus on meaningful differences like techniques, key ingredients, flavor profiles, or difficulty. Be specific and helpful, like a knowledgeable friend explaining the differences.

${recipeDescriptions}

Write only the paragraph, no headers or bullet points.`,
          },
        ],
      }),
    });
    const data = await res.json();
    const comparison = data.content?.[0]?.text?.trim() ?? "";
    return NextResponse.json({ comparison });
  } catch {
    return NextResponse.json({ error: "Comparison failed" }, { status: 500 });
  }
}
