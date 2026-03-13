"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/lib/supabase";

type GroceryPanelProps = {
  selectedRecipeIds: string[];
  recipes: any[];
  onClose: () => void;
};

const CACHE_KEY = "groceryListCache";

export default function GroceryPanel({
  selectedRecipeIds,
  recipes,
  onClose,
}: GroceryPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ingredients: cachedIngredients, recipeIds } =
          JSON.parse(cached);
        const sameSelection =
          selectedRecipeIds.length === recipeIds.length &&
          selectedRecipeIds.every((id: string) => recipeIds.includes(id));
        if (sameSelection && cachedIngredients.length > 0) {
          setIngredients(cachedIngredients);
          return;
        }
      }
    } catch {}
    if (selectedRecipeIds.length > 0) generateList();
  }, []);

  async function generateList() {
    const selectedRecipes = recipes.filter((r) =>
      selectedRecipeIds.includes(r.id),
    );
    const rawIngredients = selectedRecipes.flatMap((r) =>
      r.ingredients.map((ing: string) => `[${r.title}] ${ing}`),
    );

    setIngredients([]);
    setCheckedIngredients([]);
    setIsLoading(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers,
        body: JSON.stringify({ ingredients: rawIngredients }),
      });
      const data = await res.json();
      if (data.ingredients) {
        setIngredients(data.ingredients);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            ingredients: data.ingredients,
            recipeIds: selectedRecipeIds,
          }),
        );
      }
    } catch {
      setIngredients(rawIngredients);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          ingredients: rawIngredients,
          recipeIds: selectedRecipeIds,
        }),
      );
    }
    setIsLoading(false);
  }

  function toggleIngredient(ingredient: string) {
    setCheckedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient],
    );
  }

  const remaining = ingredients.length - checkedIngredients.length;

  return (
    <div className={`grocery-panel ${isMinimized ? "grocery-minimized" : ""}`}>
      <div className="grocery-panel-header">
        <span
          onClick={() => setIsMinimized((p) => !p)}
          style={{ flex: 1, cursor: "pointer" }}
        >
          🛒{" "}
          {isLoading
            ? "Combining ingredients..."
            : `Grocery List (${remaining} remaining)`}
        </span>
        <button
          className="grocery-minimize-btn"
          onClick={() => setIsMinimized((p) => !p)}
        >
          {isMinimized ? "▲" : "▼"}
        </button>
        <button className="grocery-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      {!isMinimized && (
        <div className="grocery-panel-body">
          {ingredients.length > 0 && (
            <button
              className="grocery-regenerate-btn"
              onClick={generateList}
              disabled={isLoading}
            >
              ↺ Regenerate
            </button>
          )}
          <ul className="grocery-list">
            {ingredients.map((ingredient, i) => {
              const [main, breakdownPart] = ingredient.split(" | breakdown: ");
              const breakdown = breakdownPart ? breakdownPart.split(", ") : [];
              return (
                <li key={i} className="grocery-item">
                  <input
                    type="checkbox"
                    aria-label={`Have ${main}`}
                    checked={checkedIngredients.includes(ingredient)}
                    onChange={() => toggleIngredient(ingredient)}
                  />
                  <div>
                    <span
                      className={
                        checkedIngredients.includes(ingredient)
                          ? "grocery-checked"
                          : ""
                      }
                    >
                      {main}
                    </span>
                    {breakdown.length > 0 && (
                      <ul className="grocery-breakdown">
                        {breakdown.map((item, j) => (
                          <li key={j} className="grocery-breakdown-item">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
