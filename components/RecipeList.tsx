"use client";

import { useState } from "react";
import RecipeCard from "./RecipeCard";
import MultiSelectDropdown from "./MultiSelectDropdown";

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
      </div>

      {visibleRecipes.length === 0 && recipes.length === 0 && (
        <p className="empty-msg">No recipes saved yet. Add one above.</p>
      )}
      {visibleRecipes.length === 0 && recipes.length > 0 && (
        <p className="empty-msg">No recipes match your search.</p>
      )}

      {visibleRecipes.map((recipe) => (
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
    </div>
  );
}
