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
  notes: string | null;
  tags: string[];
  created_at: string;
};

const PRESET_TAGS = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
  "vegetarian",
  "vegan",
  "quick",
  "baking",
  "healthy",
  "comfort food",
  "italian",
  "mexican",
  "asian",
  "american",
  "chocolate",
  "cookies",
  "cake",
  "soup",
  "salad",
  "pasta",
];

function TagInput({
  recipe,
  allTags,
  onTagsUpdated,
}: {
  recipe: Recipe;
  allTags: string[];
  onTagsUpdated: (id: string, tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const currentTags = recipe.tags || [];

  const suggestions = Array.from(new Set([...PRESET_TAGS, ...allTags]))
    .filter((t) => !currentTags.includes(t))
    .filter(
      (t) => input === "" || t.toLowerCase().includes(input.toLowerCase()),
    );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function addTag(tag: string) {
    const newTag = tag.trim().toLowerCase();
    if (!newTag || currentTags.includes(newTag)) return;
    const newTags = [...currentTags, newTag];
    onTagsUpdated(recipe.id, newTags);
    await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, tags: newTags }),
    });
    setInput("");
    setOpen(false);
  }

  async function removeTag(tag: string) {
    const newTags = currentTags.filter((t) => t !== tag);
    onTagsUpdated(recipe.id, newTags);
    await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, tags: newTags }),
    });
  }

  return (
    <div className="recipe-tags" ref={wrapperRef}>
      {currentTags.map((tag) => (
        <span
          key={tag}
          className="recipe-tag"
          onClick={() => removeTag(tag)}
          title="Click to remove"
        >
          {tag}
        </span>
      ))}
      <div className="tag-input-wrapper">
        <input
          className="tag-input"
          type="text"
          placeholder="add tag"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <button
          className="tag-add-btn"
          onClick={() => addTag(input)}
          aria-label="Add tag"
        >
          +
        </button>
        {open && suggestions.length > 0 && (
          <div className="tag-dropdown">
            {suggestions.slice(0, 8).map((tag) => (
              <button
                key={tag}
                className="tag-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="multiselect-wrapper" ref={wrapperRef}>
      <button
        className={`multiselect-btn ${selected.length > 0 ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        {selected.length > 0 ? ` (${selected.length})` : ""} ▾
      </button>
      {open && (
        <div className="multiselect-dropdown">
          {options.length === 0 && (
            <p className="multiselect-empty">No options yet</p>
          )}
          {options.map((option) => (
            <label key={option} className="multiselect-item">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function IngredientPreview({
  recipe,
  onNotesSaved,
  onTagsUpdated,
  allTags,
}: {
  recipe: Recipe;
  onNotesSaved: (id: string, notes: string) => void;
  onTagsUpdated: (id: string, tags: string[]) => void;
  allTags: string[];
}) {
  const [open, setOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(recipe.notes || "");
  const [saving, setSaving] = useState(false);

  async function saveNotes() {
    setSaving(true);
    const res = await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, notes: notesText }),
    });
    if (res.ok) {
      onNotesSaved(recipe.id, notesText);
      setEditingNotes(false);
    }
    setSaving(false);
  }

  return (
    <div className="recipe-details">
      {!open && (
        <div className="recipe-preview">
          <p className="ingredients-label">Ingredients</p>
          <ul className="ingredients-list">
            {recipe.ingredients.slice(0, 4).map((ingredient, i) => (
              <li className="ingredient-item" key={i}>
                {ingredient}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="recipe-summary"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "Hide details" : "Show details"}
      </button>
      {open && (
        <div className="recipe-columns">
          <div className="recipe-column">
            <p className="ingredients-label">Ingredients</p>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, i) => (
                <li className="ingredient-item" key={i}>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="recipe-column">
              <p className="ingredients-label">Instructions</p>
              <ol className="instructions-list">
                {recipe.instructions.map((step, i) => (
                  <li className="instruction-item" key={i}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
      <div className="notes-section">
        <p className="ingredients-label">My Notes</p>
        {editingNotes ? (
          <>
            <textarea
              className="notes-textarea"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="How did it turn out? Any tweaks you made?"
              rows={3}
            />
            <div className="notes-actions">
              <button
                className="notes-save-btn"
                onClick={saveNotes}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save note"}
              </button>
              <button
                className="notes-cancel-btn"
                onClick={() => {
                  setEditingNotes(false);
                  setNotesText(recipe.notes || "");
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="notes-display" onClick={() => setEditingNotes(true)}>
            {notesText ? (
              <p className="notes-text">{notesText}</p>
            ) : (
              <p className="notes-placeholder">Click to add a note...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [groceryMinimized, setGroceryMinimized] = useState(false);
  const [groceryIngredients, setGroceryIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(false);

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

  async function handleDelete(id: string) {
    const res = await fetch("/api/recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setSelectedRecipes((prev) => prev.filter((r) => r !== id));
    }
  }

  function toggleRecipeSelection(id: string) {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }

  async function generateGroceryList() {
    const rawIngredients = recipes
      .filter((r) => selectedRecipes.includes(r.id))
      .flatMap((r) => r.ingredients);

    setGroceryIngredients([]);
    setCheckedIngredients([]);
    setGroceryOpen(true);
    setGroceryMinimized(false);
    setGroceryLoading(true);

    try {
      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: rawIngredients }),
      });
      const data = await res.json();
      if (data.ingredients) setGroceryIngredients(data.ingredients);
    } catch {
      setGroceryIngredients(rawIngredients);
    }

    setGroceryLoading(false);
  }

  function toggleIngredient(ingredient: string) {
    setCheckedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient],
    );
  }

  function handleNotesSaved(id: string, notes: string) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));
  }

  function handleTagsUpdated(id: string, tags: string[]) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, tags } : r)));
  }

  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags || [])));
  const allSources = Array.from(
    new Set(recipes.map((r) => r.source_domain).filter(Boolean)),
  ) as string[];
  const hasActiveFilters = activeTags.length > 0 || activeSources.length > 0;

  const filteredRecipes = recipes
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');

        html { font-size: 112%; }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: #fdf6ee;
          font-family: 'Lato', sans-serif;
          color: #3a2a38;
          min-height: 100vh;
          border-top: 5px solid #5e445a;
        }

        .page {
          max-width: 860px;
          margin: 0 auto;
          padding: 60px 32px 80px;
        }

        .header { margin-bottom: 24px; border-bottom: 2px solid #5e445a; padding-bottom: 24px; }
        .header-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #dc7243; margin-bottom: 8px; }
        .header-title { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: #5e445a; line-height: 1.1; margin-bottom: 8px; }
        .header-subtitle { font-size: 15px; color: #a65a6e; font-weight: 300; }

        .grocery-btn-wrapper { position: sticky; top: 16px; z-index: 50; margin-bottom: 24px; }

        .grocery-btn {
          background: #4e6646; color: white; border: 3px solid rgba(255,255,255,0.9);
          border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase; cursor: pointer;
          font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2); white-space: nowrap;
        }
        .grocery-btn:hover { background: #3a4e32; transform: scale(1.04) rotate(-0.5deg); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }

        .form-section {
          background: #fff; border: 1.5px solid #5e445a; border-radius: 12px;
          padding: 28px; margin-bottom: 48px; box-shadow: 0 2px 16px rgba(94,68,90,0.07);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .form-section:hover { transform: scale(1.01) rotate(0.3deg); box-shadow: 0 8px 32px rgba(94,68,90,0.13); }

        .form-label { display: block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #5e445a; margin-bottom: 10px; }
        .form-row { display: flex; gap: 12px; }

        .form-input {
          flex: 1; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 12px 16px;
          font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38;
          background: #fdf6ee; outline: none; transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #dc7243; }
        .form-input::placeholder { color: #c4a898; }

        .submit-btn {
          background: #dc7243; color: #fff; border: none; border-radius: 8px;
          padding: 12px 24px; font-size: 13px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s; white-space: nowrap;
        }
        .submit-btn:hover { background: #c45e30; transform: scale(1.04) rotate(-0.5deg); box-shadow: 0 4px 16px rgba(220,114,67,0.3); }
        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { background: #e0b89e; cursor: not-allowed; transform: none; }

        .error-msg { margin-top: 12px; font-size: 13px; color: #c0392b; }

        .recipes-header { font-family: 'Playfair Display', serif; font-size: 22px; color: #5e445a; margin-bottom: 20px; }
        .empty-msg { color: #a65a6e; font-size: 14px; font-style: italic; }

        .search-row { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }

        .search-input {
          flex: 1; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 10px 16px;
          font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38;
          background: #fff; outline: none; transition: border-color 0.2s;
        }
        .search-input:focus { border-color: #dc7243; }
        .search-input::placeholder { color: #c4a898; }

        .sort-select {
          border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 10px 40px 10px 16px;
          font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235e445a' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 14px center;
          appearance: none; outline: none; cursor: pointer; transition: border-color 0.2s, transform 0.2s;
        }
        .sort-select:focus { border-color: #dc7243; }
        .sort-select:hover { transform: scale(1.03) rotate(-0.5deg); }

        .filter-row { display: flex; gap: 8px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; }

        .multiselect-wrapper { position: relative; }

        .multiselect-btn {
          background: #fff; border: 1.5px solid #e0cfc0; border-radius: 8px;
          padding: 8px 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
          color: #6b4a5e; cursor: pointer; font-family: 'Lato', sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .multiselect-btn:hover { border-color: #5e445a; color: #5e445a; transform: scale(1.03); }
        .multiselect-btn.active { background: #5e445a; border-color: #5e445a; color: #fff; }

        .multiselect-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0;
          background: #fff; border: 1.5px solid #e0cfc0; border-radius: 10px;
          box-shadow: 0 4px 20px rgba(94,68,90,0.12); z-index: 200;
          min-width: 180px; max-height: 240px; overflow-y: auto; padding: 6px 0;
        }

        .multiselect-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; font-size: 13px; font-family: 'Lato', sans-serif;
          color: #3a2a38; cursor: pointer; transition: background 0.15s;
        }
        .multiselect-item:hover { background: #fdf6ee; }
        .multiselect-item input { accent-color: #5e445a; cursor: pointer; }
        .multiselect-empty { padding: 10px 14px; font-size: 13px; color: #c4a898; font-style: italic; }

        .clear-filters-btn {
          background: none; border: none; color: #a65a6e; font-size: 12px;
          font-family: 'Lato', sans-serif; cursor: pointer; padding: 4px 8px;
          text-decoration: underline; transition: color 0.2s;
        }
        .clear-filters-btn:hover { color: #dc7243; }

        .recipe-card {
          background: #fff; border: 1.5px solid #e8d8c4; border-radius: 12px;
          padding: 24px 28px; margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(94,68,90,0.06);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          position: relative;
        }
        .recipe-card:hover { transform: scale(1.01) rotate(0.4deg); box-shadow: 0 8px 28px rgba(94,68,90,0.13); }
        .recipe-card.selected { border-color: #e8d8c4; box-shadow: 0 20px 60px rgba(94,68,90,0.25), 0 8px 24px rgba(94,68,90,0.15); transform: scale(1.04) rotate(0.6deg); z-index: 10; }

        .recipe-image-wrapper { position: relative; margin-bottom: 16px; border-radius: 8px; overflow: hidden; cursor: pointer; height: 180px; }

        .recipe-image-bg {
          position: absolute;
          inset: -10px;
          background-size: cover;
          background-position: center;
          filter: blur(12px) brightness(0.85);
          transform: scale(1.1);
          transition: transform 0.4s ease;
          z-index: 0;
        }

        .recipe-image-wrapper:hover .recipe-image-bg {
          transform: scale(1.25);
        }

        .recipe-image {
          position: relative;
          width: 100%;
          height: 180px;
          object-fit: contain;
          display: block;
          z-index: 1;
          transition: transform 0.4s ease;
        }

        .recipe-image-wrapper:hover .recipe-image {
          transform: scale(1.05);
        }

        .source-badge {
          position: absolute; top: 10px; left: 10px;
          background: rgba(94,68,90,0.85); color: #fff;
          font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
          padding: 4px 10px; border-radius: 20px; backdrop-filter: blur(4px);
          z-index: 3; pointer-events: none;
        }

        .recipe-image-overlay {
          position: absolute; inset: 0; background: rgba(94,68,90,0);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.3s; border-radius: 8px;
          z-index: 2;
        }
        .recipe-image-wrapper:hover .recipe-image-overlay { background: rgba(94,68,90,0.45); }
        .overlay-checked { background: rgba(94,68,90,0.25) !important; }
        .recipe-image-wrapper:hover .overlay-checked { background: rgba(94,68,90,0.55) !important; }

        .overlay-icons { display: flex; gap: 20px; align-items: center; }

        .overlay-checkmark, .overlay-trash {
          width: 48px; height: 48px; opacity: 0; transform: scale(0.8);
          transition: opacity 0.2s, transform 0.2s;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
        }
        .recipe-image-wrapper:hover .overlay-checkmark,
        .recipe-image-wrapper:hover .overlay-trash { opacity: 1; transform: scale(1); }
        .overlay-checked .overlay-checkmark { opacity: 1; transform: scale(1); }
        .overlay-checkmark:hover { transform: scale(1.2) !important; filter: drop-shadow(0 4px 12px rgba(255,255,255,0.4)); }

        .overlay-trash-btn { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; }
        .overlay-trash-btn:hover .overlay-trash { transform: scale(1.2) !important; filter: drop-shadow(0 4px 12px rgba(220,50,50,0.6)) !important; }

        .no-image-actions { display: flex; justify-content: flex-end; margin-bottom: 8px; }
        .no-image-trash-btn { background: none; border: none; cursor: pointer; padding: 4px; opacity: 0.4; transition: opacity 0.2s, transform 0.2s; }
        .no-image-trash-btn:hover { opacity: 1; transform: scale(1.15); }

        .recipe-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; align-items: center; }

        .recipe-tag {
          background: #f5ede3; border: 1px solid #e0cfc0; border-radius: 20px;
          padding: 3px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          color: #a65a6e; cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.15s;
        }
        .recipe-tag:hover { background: #fde8e0; border-color: #dc7243; color: #dc7243; }

        .tag-input-wrapper { position: relative; display: flex; align-items: center; }

        .tag-input {
          border: 1.5px dashed #e0cfc0; border-radius: 20px; padding: 3px 28px 3px 10px;
          font-size: 11px; font-family: 'Lato', sans-serif; color: #3a2a38;
          background: transparent; outline: none; width: 110px; transition: border-color 0.2s;
        }
        .tag-input:focus { border-color: #dc7243; }
        .tag-input::placeholder { color: #c4a898; }

        .tag-add-btn {
          position: absolute; right: 6px; background: #4e6646; color: white;
          border: none; border-radius: 50%; width: 16px; height: 16px;
          font-size: 14px; line-height: 1; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 0; transition: background 0.2s, transform 0.2s;
        }
        .tag-add-btn:hover { background: #3a4e32; transform: scale(1.15); }

        .tag-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0;
          background: #fff; border: 1.5px solid #e0cfc0; border-radius: 10px;
          box-shadow: 0 4px 16px rgba(94,68,90,0.12); z-index: 200;
          min-width: 150px; overflow: hidden;
        }
        .tag-dropdown-item {
          display: block; width: 100%; text-align: left; background: none; border: none;
          padding: 8px 14px; font-size: 12px; font-family: 'Lato', sans-serif;
          color: #3a2a38; cursor: pointer; transition: background 0.15s;
        }
        .tag-dropdown-item:hover { background: #fdf6ee; color: #dc7243; }

        .recipe-card-header { display: flex; align-items: flex-start; }

        .recipe-title {
          font-family: 'Playfair Display', serif; font-size: 20px; color: #5e445a;
          text-decoration: none; display: block; line-height: 1.3; flex: 1;
        }
        .recipe-title:hover { color: #dc7243; }

        .recipe-divider { border: none; border-top: 1px solid #f0e0d0; margin: 16px 0; }
        .recipe-details { margin-top: 4px; position: relative; }

        .recipe-preview { max-height: 80px; overflow: hidden; position: relative; pointer-events: none; }
        .recipe-preview::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(transparent, #fff); }

        .recipe-summary {
          font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          color: #dc7243; cursor: pointer; user-select: none; margin-top: 8px;
          display: inline-block; background: none; border: none; padding: 0;
          font-family: 'Lato', sans-serif; transition: color 0.2s, transform 0.2s;
        }
        .recipe-summary:hover { color: #c45e30; transform: scale(1.04) rotate(-0.5deg); }

        .recipe-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px; }

        .ingredients-label { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #dd9d5b; margin-bottom: 10px; }
        .ingredients-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }

        .ingredient-item { font-size: 14px; color: #6b4a5e; padding-left: 16px; position: relative; line-height: 1.5; }
        .ingredient-item::before { content: '—'; position: absolute; left: 0; color: #dd9d5b; font-size: 12px; }

        .instructions-list { list-style: none; display: flex; flex-direction: column; gap: 8px; counter-reset: steps; }
        .instruction-item { font-size: 14px; color: #6b4a5e; padding-left: 28px; position: relative; line-height: 1.6; counter-increment: steps; }
        .instruction-item::before { content: counter(steps); position: absolute; left: 0; top: 1px; background: #5e445a; color: white; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

        .notes-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0e0d0; }
        .notes-display { cursor: pointer; padding: 10px 14px; border-radius: 8px; border: 1.5px dashed #e0cfc0; transition: border-color 0.2s, background 0.2s; min-height: 42px; }
        .notes-display:hover { border-color: #dc7243; background: #fdf6ee; }
        .notes-text { font-size: 14px; color: #6b4a5e; line-height: 1.6; }
        .notes-placeholder { font-size: 14px; color: #c4a898; font-style: italic; }

        .notes-textarea { width: 100%; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38; background: #fdf6ee; outline: none; resize: vertical; transition: border-color 0.2s; line-height: 1.6; }
        .notes-textarea:focus { border-color: #dc7243; }
        .notes-actions { display: flex; gap: 8px; margin-top: 8px; }

        .notes-save-btn { background: #dc7243; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s; }
        .notes-save-btn:hover { background: #c45e30; transform: scale(1.03) rotate(-0.5deg); }
        .notes-save-btn:disabled { background: #e0b89e; cursor: not-allowed; transform: none; }

        .notes-cancel-btn { background: none; color: #a65a6e; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: border-color 0.2s, transform 0.2s; }
        .notes-cancel-btn:hover { border-color: #a65a6e; transform: scale(1.03) rotate(0.5deg); }

        .grocery-panel { position: fixed; bottom: 0; right: 24px; width: 340px; background: #fff; border: 1.5px solid #5e445a; border-bottom: none; border-radius: 12px 12px 0 0; box-shadow: 0 -4px 24px rgba(94,68,90,0.15); z-index: 100; max-height: 60vh; display: flex; flex-direction: column; }
        .grocery-minimized { max-height: none; }
        .grocery-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #5e445a; color: white; border-radius: 10px 10px 0 0; cursor: pointer; font-size: 14px; font-weight: 700; font-family: 'Lato', sans-serif; user-select: none; }
        .grocery-minimize-btn { background: none; border: none; color: white; cursor: pointer; font-size: 12px; padding: 0; }
        .grocery-panel-body { overflow-y: auto; padding: 16px 18px; flex: 1; }
        .grocery-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .grocery-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #3a2a38; line-height: 1.4; }
        .grocery-item input[type="checkbox"] { margin-top: 2px; accent-color: #dc7243; flex-shrink: 0; }
        .grocery-checked { text-decoration: line-through; color: #b0a0a8; }

        .grocery-breakdown {
          list-style: none;
          margin-top: 4px;
          padding-left: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .grocery-breakdown-item {
          font-size: 11px;
          color: #a65a6e;
          padding-left: 10px;
          position: relative;
          line-height: 1.4;
        }

        .grocery-breakdown-item::before {
          content: '·';
          position: absolute;
          left: 0;
          color: #dd9d5b;
        }
      `}</style>

      <div className="page">
        <header className="header">
          <p className="header-eyebrow">Your Recipe Collection</p>
          <h1 className="header-title">Culinary Cloud</h1>
          <p className="header-subtitle">
            Paste a recipe URL to save its ingredients.
          </p>
        </header>

        <div className="form-section">
          <label className="form-label">Recipe URL</label>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                className="form-input"
                type="url"
                placeholder="https://www.preppykitchen.com/recipe/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Recipe"}
              </button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>

        <h2 className="recipes-header">Saved Recipes</h2>

        {selectedRecipes.length > 0 && (
          <div className="grocery-btn-wrapper">
            <button className="grocery-btn" onClick={generateGroceryList}>
              🛒 Generate Grocery List ({selectedRecipes.length} recipe
              {selectedRecipes.length > 1 ? "s" : ""})
            </button>
          </div>
        )}

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

        {filteredRecipes.length === 0 && recipes.length === 0 && (
          <p className="empty-msg">No recipes saved yet. Add one above.</p>
        )}
        {filteredRecipes.length === 0 && recipes.length > 0 && (
          <p className="empty-msg">No recipes match your search.</p>
        )}

        {filteredRecipes.map((recipe) => (
          <div
            className={`recipe-card ${selectedRecipes.includes(recipe.id) ? "selected" : ""}`}
            key={recipe.id}
          >
            {recipe.image_url ? (
              <div
                className="recipe-image-wrapper"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".overlay-trash-btn"))
                    return;
                  toggleRecipeSelection(recipe.id);
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
                />
                {recipe.source_domain && (
                  <div className="source-badge">{recipe.source_domain}</div>
                )}
                <div
                  className={`recipe-image-overlay ${selectedRecipes.includes(recipe.id) ? "overlay-checked" : ""}`}
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
                        handleDelete(recipe.id);
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
              </div>
            ) : (
              <div className="no-image-actions">
                <button
                  className="no-image-trash-btn"
                  onClick={() => handleDelete(recipe.id)}
                  aria-label="Delete recipe"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <polyline
                      points="3 6 5 6 21 6"
                      stroke="#dc7243"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M19 6l-1 14H6L5 6"
                      stroke="#dc7243"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 11v6M14 11v6"
                      stroke="#dc7243"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 6V4h6v2"
                      stroke="#dc7243"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            <TagInput
              recipe={recipe}
              allTags={allTags}
              onTagsUpdated={handleTagsUpdated}
            />

            <div className="recipe-card-header">
              <a
                className="recipe-title"
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {recipe.title}
              </a>
            </div>
            <hr className="recipe-divider" />
            <IngredientPreview
              recipe={recipe}
              onNotesSaved={handleNotesSaved}
              onTagsUpdated={handleTagsUpdated}
              allTags={allTags}
            />
          </div>
        ))}
      </div>

      {groceryOpen && (
        <div
          className={`grocery-panel ${groceryMinimized ? "grocery-minimized" : ""}`}
        >
          <div
            className="grocery-panel-header"
            onClick={() => setGroceryMinimized((prev) => !prev)}
          >
            <span>
              🛒{" "}
              {groceryLoading
                ? "Combining ingredients..."
                : `Grocery List (${groceryIngredients.length - checkedIngredients.length} remaining)`}
            </span>
            <button className="grocery-minimize-btn">
              {groceryMinimized ? "▲" : "▼"}
            </button>
          </div>
          {!groceryMinimized && (
            <div className="grocery-panel-body">
              <ul className="grocery-list">
                {groceryIngredients.map((ingredient, i) => {
                  const [main, breakdownPart] =
                    ingredient.split(" | breakdown: ");
                  const breakdown = breakdownPart
                    ? breakdownPart.split(", ")
                    : [];
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
      )}
    </>
  );
}
