"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/lib/supabase";

type GroceryPanelProps = {
  selectedRecipeIds: string[];
  recipes: any[];
};

export default function GroceryPanel({
  selectedRecipeIds,
  recipes,
}: GroceryPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateList();
  }, []);

  async function generateList() {
    const rawIngredients = recipes
      .filter((r) => selectedRecipeIds.includes(r.id))
      .flatMap((r) => r.ingredients);

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
      if (data.ingredients) setIngredients(data.ingredients);
    } catch {
      setIngredients(rawIngredients);
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
      <div
        className="grocery-panel-header"
        onClick={() => setIsMinimized((p) => !p)}
      >
        <span>
          🛒{" "}
          {isLoading
            ? "Combining ingredients..."
            : `Grocery List (${remaining} remaining)`}
        </span>
        <button className="grocery-minimize-btn">
          {isMinimized ? "▲" : "▼"}
        </button>
      </div>
      {!isMinimized && (
        <div className="grocery-panel-body">
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
