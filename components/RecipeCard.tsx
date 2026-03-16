"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/supabase";
import TagInput from "./TagInput";

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
};

function scaleIngredient(ingredient: string, scale: number): string {
  if (scale === 1) return ingredient;
  return ingredient.replace(
    /(\d+\/\d+|\d+\.\d+|\d+)/g,
    (match, _p1, offset, str) => {
      // skip if followed by °F or °C (temperatures)
      const after = str.slice(offset + match.length);
      if (/^\s*°[FC]/i.test(after)) return match;
      // skip if the number is a temperature value like 110°F in parentheses
      if (/°[FC]/i.test(str.slice(offset, offset + match.length + 5)))
        return match;
      // skip standalone time words
      if (/^\s*(minutes?|hours?|seconds?)/i.test(after)) return match;

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
    },
  );
}

type RecipeCardProps = {
  recipe: Recipe;
  isSelected: boolean;
  allTags: string[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTagsUpdated: (id: string, tags: string[]) => void;
  onNotesSaved: (id: string, notes: string) => void;
};

export default function RecipeCard({
  recipe,
  isSelected,
  allTags,
  onSelect,
  onDelete,
  onTagsUpdated,
  onNotesSaved,
}: RecipeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState<number>(1);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(recipe.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  async function saveNotes() {
    setIsSavingNotes(true);
    const headers = await getAuthHeaders();
    const res = await fetch("/api/recipes", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: recipe.id, notes: notesText }),
    });
    if (res.ok) {
      onNotesSaved(recipe.id, notesText);
      setIsEditingNotes(false);
    }
    setIsSavingNotes(false);
  }

  return (
    <div className={`recipe-card ${isSelected ? "selected" : ""}`}>
      {recipe.image_url ? (
        <div
          className="recipe-image-wrapper"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest(".overlay-trash-btn")) return;
            if ((e.target as HTMLElement).closest(".mobile-action-btn")) return;
            if (window.innerWidth > 640) onSelect(recipe.id);
          }}
        >
          <div
            className="recipe-image-bg"
            style={{ backgroundImage: `url(${recipe.image_url})` }}
          />
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="recipe-image"
            loading="lazy"
          />
          {recipe.source_domain && (
            <div className="source-badge">{recipe.source_domain}</div>
          )}

          {/* Desktop overlay */}
          <div
            className={`recipe-image-overlay ${isSelected ? "overlay-checked" : ""}`}
          >
            <div className="overlay-icons">
              <svg viewBox="0 0 24 24" className="overlay-checkmark">
                <polyline
                  points="20 6 9 17 4 12"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <button
                className="overlay-trash-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipe.id);
                }}
                aria-label="Delete recipe"
              >
                <svg viewBox="0 0 24 24" className="overlay-trash">
                  <polyline
                    points="3 6 5 6 21 6"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19 6l-1 14H6L5 6"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 11v6M14 11v6"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 6V4h6v2"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile always-visible actions */}
          <div className="mobile-image-actions">
            <button
              className={`mobile-action-btn mobile-select-btn ${isSelected ? "mobile-selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(recipe.id);
              }}
              aria-label="Select recipe"
            >
              {isSelected ? (
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <button
              className="mobile-action-btn mobile-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recipe.id);
              }}
              aria-label="Delete recipe"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="no-image-actions">
          <button
            className="no-image-trash-btn"
            onClick={() => onDelete(recipe.id)}
            aria-label="Delete recipe"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="#dc7243"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}

      <TagInput
        recipeId={recipe.id}
        currentTags={recipe.tags || []}
        allTags={allTags}
        onTagsUpdated={onTagsUpdated}
      />

      <div className="recipe-card-header">
        <a
          className="recipe-title"
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {recipe.title}
          <span className="recipe-title-arrow">↗</span>
        </a>
      </div>
      <hr className="recipe-divider" />

      {(recipe.prep_time ||
        recipe.cook_time ||
        recipe.total_time ||
        recipe.recipe_yield) && (
        <div className="recipe-meta">
          {recipe.prep_time && (
            <span className="recipe-meta-item">
              <span className="recipe-meta-icon">⏱</span>
              <span className="recipe-meta-label">Prep</span>
              {recipe.prep_time}
            </span>
          )}
          {recipe.cook_time && (
            <span className="recipe-meta-item">
              <span className="recipe-meta-icon">🔥</span>
              <span className="recipe-meta-label">Cook</span>
              {recipe.cook_time}
            </span>
          )}
          {recipe.total_time && (
            <span className="recipe-meta-item">
              <span className="recipe-meta-icon">⏰</span>
              <span className="recipe-meta-label">Total</span>
              {recipe.total_time}
            </span>
          )}
          {recipe.recipe_yield && (
            <span className="recipe-meta-item">
              <span className="recipe-meta-icon">🍽</span>
              <span className="recipe-meta-label">Yield</span>
              {recipe.recipe_yield}
            </span>
          )}
        </div>
      )}

      <div className="recipe-details">
        {!isOpen && (
          <div className="recipe-preview">
            <p className="ingredients-label">Ingredients</p>
            <ul className="ingredients-list">
              {recipe.ingredients.slice(0, 4).map((ing, i) => (
                <li key={i} className="ingredient-item">
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button className="recipe-summary" onClick={() => setIsOpen((p) => !p)}>
          {isOpen ? "Hide details" : "Show details"}
        </button>
        {isOpen && (
          <>
            <div className="scale-controls">
              {[0.5, 1, 2, 3].map((s) => (
                <button
                  key={s}
                  className={`scale-btn ${s === 0.5 ? "scale-btn-half" : ""} ${scale === s ? "active" : ""}`}
                  onClick={() => setScale(s)}
                >
                  {s === 0.5 ? "½" : `${s}x`}
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
        <div className="notes-section">
          <p className="ingredients-label">My Notes</p>
          {isEditingNotes ? (
            <>
              <textarea
                className="notes-textarea"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="How did it turn out?"
                rows={3}
              />
              <div className="notes-actions">
                <button
                  className="notes-save-btn"
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? "Saving..." : "Save note"}
                </button>
                <button
                  className="notes-cancel-btn"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotesText(recipe.notes || "");
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div
              className="notes-display"
              onClick={() => setIsEditingNotes(true)}
            >
              {notesText ? (
                <p className="notes-text">{notesText}</p>
              ) : (
                <p className="notes-placeholder">Click to add a note...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
