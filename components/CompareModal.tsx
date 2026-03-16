"use client";

import { useState, useEffect, useRef } from "react";

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  source_url: string;
  source_domain: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  recipe_yield: string | null;
  description: string | null;
  video_url: string | null;
  video_id: string | null;
};

type CompareModalProps = {
  recipes: Recipe[];
  onClose: () => void;
};

const compareCache = new Map<string, string>();

function scaleIngredient(ingredient: string, scale: number): string {
  if (scale === 1) return ingredient;
  return ingredient.replace(/(\d+\/\d+|\d+\.\d+|\d+)/g, (match) => {
    if (match.includes("/")) {
      const [num, den] = match.split("/").map(Number);
      const result = (num / den) * scale;
      return result % 1 === 0
        ? String(result)
        : result.toFixed(1).replace(/\.0$/, "");
    }
    const result = parseFloat(match) * scale;
    return result % 1 === 0
      ? String(result)
      : result.toFixed(1).replace(/\.0$/, "");
  });
}

function MiniRecipeCard({ recipe }: { recipe: Recipe }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  return (
    <div className="compare-card">
      {recipe.image_url && (
        <div className="compare-card-image-wrapper">
          <div
            className="recipe-image-bg"
            style={{ backgroundImage: `url(${recipe.image_url})` }}
          />
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="compare-card-image"
          />
          {recipe.source_domain && (
            <div className="source-badge">{recipe.source_domain}</div>
          )}
        </div>
      )}
      <a
        href={recipe.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="compare-card-title"
      >
        {recipe.title}
      </a>
      <hr className="recipe-divider" />
      {!isOpen && (
        <div className="recipe-preview">
          <p className="ingredients-label">Ingredients</p>
          <ul className="ingredients-list">
            {recipe.ingredients.slice(0, 3).map((ing, i) => (
              <li key={i} className="ingredient-item">
                {scaleIngredient(ing, scale)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="recipe-summary"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Hide details" : "Show details"}
      </button>
      {isOpen && (
        <>
          <div className="scale-controls">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                className={`scale-btn ${scale === s ? "active" : ""}`}
                onClick={() => setScale(s)}
              >
                {s}x
              </button>
            ))}
          </div>
          <div className="recipe-columns">
            <div className="recipe-column">
              <p className="ingredients-label">Ingredients</p>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="ingredient-item">
                    {scaleIngredient(ing, scale)}
                  </li>
                ))}
              </ul>
            </div>
            {recipe.instructions?.length > 0 && (
              <div className="recipe-column">
                <p className="ingredients-label">Instructions</p>
                <ol className="instructions-list">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="instruction-item">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CompareModal({ recipes, onClose }: CompareModalProps) {
  const [comparison, setComparison] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const cacheKey = recipes
    .map((r) => r.id)
    .sort()
    .join(",");

  useEffect(() => {
    async function fetchComparison() {
      if (compareCache.has(cacheKey)) {
        setComparison(compareCache.get(cacheKey)!);
        return;
      }
      setIsLoading(true);
      setHasError(false);
      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipes }),
        });
        const data = await res.json();
        if (data.comparison) {
          compareCache.set(cacheKey, data.comparison);
          setComparison(data.comparison);
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      }
      setIsLoading(false);
    }
    fetchComparison();
  }, [cacheKey]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Recipe Comparison</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="compare-cards-grid">
            {recipes.map((recipe) => (
              <MiniRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <div className="comparison-box">
            <p className="ingredients-label">What's the difference?</p>
            {isLoading && (
              <p className="comparison-loading">Analyzing recipes...</p>
            )}
            {hasError && (
              <p className="comparison-error">
                Couldn't generate comparison. Try again.
              </p>
            )}
            {comparison && <p className="comparison-text">{comparison}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
