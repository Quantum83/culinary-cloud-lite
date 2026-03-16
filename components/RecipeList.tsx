"use client";

import { useState } from "react";
import RecipeCard from "./RecipeCard";
import MultiSelectDropdown from "./MultiSelectDropdown";
import RecipeDetailModal from "./RecipeDetailModal";

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

type RecipeListProps = {
  recipes: Recipe[];
  selectedRecipeIds: string[];
  activeCollectionRecipeIds: string[] | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTagsUpdated: (id: string, tags: string[]) => void;
  onNotesSaved: (id: string, notes: string) => void;
};

type ViewMode = "scroll" | "list" | "grid";

function ScrollIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="18" height="5" rx="1" />
      <rect x="3" y="10" width="18" height="5" rx="1" />
      <rect x="3" y="17" width="18" height="5" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

export default function RecipeList({
  recipes,
  selectedRecipeIds,
  activeCollectionRecipeIds,
  onSelect,
  onDelete,
  onTagsUpdated,
  onNotesSaved,
}: RecipeListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [modalRecipeId, setModalRecipeId] = useState<string | null>(null);

  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags || [])));
  const allSources = Array.from(
    new Set(recipes.map((r) => r.source_domain).filter(Boolean)),
  ) as string[];
  const hasActiveFilters = activeTags.length > 0 || activeSources.length > 0;

  const visibleRecipes = recipes
    .filter(
      (r) =>
        activeCollectionRecipeIds === null ||
        activeCollectionRecipeIds.includes(r.id),
    )
    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    .filter(
      (r) =>
        activeTags.length === 0 ||
        activeTags.every((t) => (r.tags || []).includes(t)),
    )
    .filter(
      (r) =>
        activeSources.length === 0 ||
        activeSources.includes(r.source_domain || ""),
    )
    .sort((a, b) => {
      if (sort === "newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sort === "oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      return 0;
    });

  const modalRecipe = modalRecipeId
    ? (recipes.find((r) => r.id === modalRecipeId) ?? null)
    : null;

  return (
    <div className="recipe-list">
      <div className="search-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="sort-select"
          aria-label="Sort recipes"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>

      <div className="filter-row">
        <MultiSelectDropdown
          label="Filter by tag"
          options={allTags}
          selected={activeTags}
          onChange={setActiveTags}
        />
        <MultiSelectDropdown
          label="Filter by source"
          options={allSources}
          selected={activeSources}
          onChange={setActiveSources}
        />
        {hasActiveFilters && (
          <button
            className="clear-filters-btn"
            onClick={() => {
              setActiveTags([]);
              setActiveSources([]);
            }}
          >
            Clear all filters
          </button>
        )}
        <div className="view-selector">
          {(["scroll", "list", "grid"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`view-btn ${viewMode === mode ? "active" : ""}`}
              onClick={() => setViewMode(mode)}
              aria-label={`${mode} view`}
            >
              {mode === "scroll" && <ScrollIcon />}
              {mode === "list" && <ListIcon />}
              {mode === "grid" && <GridIcon />}
            </button>
          ))}
        </div>
      </div>

      {visibleRecipes.length === 0 && recipes.length === 0 && (
        <p className="empty-msg">No recipes saved yet. Add one above.</p>
      )}
      {visibleRecipes.length === 0 && recipes.length > 0 && (
        <p className="empty-msg">No recipes match your search.</p>
      )}

      {viewMode === "scroll" &&
        visibleRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isSelected={selectedRecipeIds.includes(recipe.id)}
            allTags={allTags}
            onSelect={onSelect}
            onDelete={onDelete}
            onTagsUpdated={onTagsUpdated}
            onNotesSaved={onNotesSaved}
          />
        ))}

      {viewMode === "list" && (
        <div className="list-view">
          {visibleRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`list-row ${selectedRecipeIds.includes(recipe.id) ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                className="list-checkbox"
                checked={selectedRecipeIds.includes(recipe.id)}
                onChange={() => onSelect(recipe.id)}
                aria-label={`Select ${recipe.title}`}
              />
              {recipe.video_id ? (
                <img
                  src={`https://img.youtube.com/vi/${recipe.video_id}/mqdefault.jpg`}
                  alt={recipe.title}
                  className="list-thumb"
                />
              ) : recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="list-thumb"
                />
              ) : (
                <div className="list-thumb-placeholder" />
              )}
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="list-title"
              >
                {recipe.title}
              </a>
              <div className="list-tags">
                {(recipe.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="recipe-tag">
                    {tag}
                  </span>
                ))}
              </div>
              {recipe.source_domain && (
                <span className="list-source">{recipe.source_domain}</span>
              )}
              <button
                className="list-expand-btn"
                onClick={() => setModalRecipeId(recipe.id)}
                aria-label="Expand recipe"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                className="list-delete-btn"
                onClick={() => onDelete(recipe.id)}
                aria-label="Delete recipe"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
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
          ))}
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid-view">
          {visibleRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`grid-card ${selectedRecipeIds.includes(recipe.id) ? "selected" : ""}`}
            >
              <div
                className="grid-card-image-wrapper"
                onClick={() => onSelect(recipe.id)}
              >
                {recipe.video_id || recipe.image_url ? (
                  <>
                    <div
                      className="recipe-image-bg"
                      style={{
                        backgroundImage: `url(${recipe.video_id ? `https://img.youtube.com/vi/${recipe.video_id}/mqdefault.jpg` : recipe.image_url})`,
                      }}
                    />
                    <img
                      src={
                        recipe.video_id
                          ? `https://img.youtube.com/vi/${recipe.video_id}/mqdefault.jpg`
                          : recipe.image_url!
                      }
                      alt={recipe.title}
                      className="grid-card-image"
                      loading="lazy"
                    />
                    {recipe.video_id && (
                      <div className="source-badge">YouTube</div>
                    )}
                    {!recipe.video_id && recipe.source_domain && (
                      <div className="source-badge">{recipe.source_domain}</div>
                    )}
                  </>
                ) : (
                  <div className="grid-card-no-image" />
                )}
                {recipe.source_domain && (
                  <div className="source-badge">{recipe.source_domain}</div>
                )}
                <div
                  className={`grid-card-overlay ${selectedRecipeIds.includes(recipe.id) ? "overlay-checked" : ""}`}
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
                <div className="grid-card-mobile-actions">
                  <button
                    className="mobile-select-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(recipe.id);
                    }}
                    aria-label="Select recipe"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button
                    className="mobile-delete-btn"
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
              <div className="grid-card-body">
                <p className="grid-card-title">{recipe.title}</p>
                <button
                  className="grid-show-more"
                  onClick={() => setModalRecipeId(recipe.id)}
                >
                  Show more
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalRecipe && (
        <RecipeDetailModal
          recipe={modalRecipe}
          isSelected={selectedRecipeIds.includes(modalRecipe.id)}
          allTags={allTags}
          onClose={() => setModalRecipeId(null)}
          onSelect={onSelect}
          onDelete={onDelete}
          onTagsUpdated={onTagsUpdated}
          onNotesSaved={onNotesSaved}
        />
      )}
    </div>
  );
}
