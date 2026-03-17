"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/lib/supabase";

type GroceryPanelProps = {
  ingredientSource: string[];
  onClose: () => void;
  shouldRegenerate: number;
  isHidden: boolean;
};

const CACHE_KEY = "groceryListCache";

export default function GroceryPanel({
  ingredientSource,
  onClose,
  shouldRegenerate,
  isHidden,
}: GroceryPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ingredients: cachedIngredients } = JSON.parse(cached);
        if (cachedIngredients?.length > 0) {
          setIngredients(cachedIngredients);
          return;
        }
      }
    } catch {}
    // only auto-generate if no cache at all and we have ingredients
    if (ingredientSource.length > 0) generateList();
  }, []);

  useEffect(() => {
    if (shouldRegenerate > 0) generateList();
  }, [shouldRegenerate]);

  async function generateList() {
    setIngredients([]);
    setCheckedIngredients([]);
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers,
        body: JSON.stringify({ ingredients: ingredientSource }),
      });
      const data = await res.json();
      if (data.ingredients) {
        setIngredients(data.ingredients);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ingredients: data.ingredients }),
        );
      }
    } catch {
      setIngredients(ingredientSource);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ingredients: ingredientSource }),
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
    <div
      className={`grocery-panel ${isMinimized ? "grocery-minimized" : ""} ${isHidden ? "grocery-panel-hidden" : ""}`}
    >
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
