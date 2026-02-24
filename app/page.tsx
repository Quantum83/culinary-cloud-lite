"use client";

import { useState, useEffect } from "react";

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  source_url: string;
  created_at: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    setRecipes(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      setUrl("");
      fetchRecipes();
    }

    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">☁️ Culinary Cloud Lite</h1>
      <p className="text-gray-500 mb-8">
        Paste a recipe URL to save its ingredients.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-10">
        <input
          type="url"
          placeholder="https://www.allrecipes.com/recipe/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Recipe"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

      <div className="space-y-6">
        {recipes.length === 0 && (
          <p className="text-gray-400 text-sm">No recipes saved yet.</p>
        )}
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lg hover:underline"
            >
              {recipe.title}
            </a>
            <ul className="mt-3 space-y-1">
              {recipe.ingredients.map((ingredient, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-600 before:content-['•'] before:mr-2"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
