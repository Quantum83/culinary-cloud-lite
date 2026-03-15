"use client";

import { useState, useEffect } from "react";
import { supabase, getAuthHeaders } from "@/lib/supabase";
import RecipeList from "@/components/RecipeList";
import CollectionsSidebar from "@/components/CollectionsSidebar";
import StickyActions from "@/components/StickyActions";
import GroceryPanel from "@/components/GroceryPanel";
import CompareModal from "@/components/CompareModal";
import MealPlanner from "@/components/MealPlanner";
import SettingsSidebar, { applyThemeVars } from "@/components/SettingsSidebar";

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
type Collection = { id: string; name: string; recipe_ids: string[] };
type WeekData = Record<string, string[]>;
type Toast = { message: string; id: number };

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [weekData, setWeekData] = useState<WeekData>({});
  const [unscheduled, setUnscheduled] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );
  const [isPlannerActive, setIsPlannerActive] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isGroceryOpen, setIsGroceryOpen] = useState(false);
  const [groceryPanelKey, setGroceryPanelKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [plannerGroceryTrigger, setPlannerGroceryTrigger] = useState(0);
  const [grocerySource, setGrocerySource] = useState<"selected" | "planner">(
    "selected",
  );
  const [groceryRegenerate, setGroceryRegenerate] = useState(0);
  const groceryIngredientSource =
    grocerySource === "planner"
      ? [...unscheduled, ...Object.values(weekData).flat()]
          .filter((id, idx, arr) => arr.indexOf(id) === idx)
          .map((id) => recipes.find((r) => r.id === id))
          .filter(Boolean)
          .flatMap((r) => r!.ingredients.map((ing) => `[${r!.title}] ${ing}`))
      : recipes
          .filter((r) => selectedRecipeIds.includes(r.id))
          .flatMap((r) => r.ingredients.map((ing) => `[${r.title}] ${ing}`));

  useEffect(() => {
    // Init dark mode
    const savedDark = localStorage.getItem("darkMode") === "true";
    if (savedDark) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
    // Apply saved theme vars
    const savedTheme = localStorage.getItem(
      savedDark ? "themeDark" : "themeLight",
    );
    if (savedTheme) {
      try {
        applyThemeVars(JSON.parse(savedTheme));
      } catch {}
    } else if (savedDark) {
      // Apply Deep Ocean default for dark
      applyThemeVars({
        bg: "#17313E",
        primary: "#9BB4C0",
        accent: "#86B0BD",
        gold: "#E1D0B3",
      });
    }
    initSession();
  }, []);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
    const savedTheme = localStorage.getItem(next ? "themeDark" : "themeLight");
    if (savedTheme) {
      try {
        applyThemeVars(JSON.parse(savedTheme));
      } catch {}
    } else if (next) {
      applyThemeVars({
        bg: "#17313E",
        primary: "#9BB4C0",
        accent: "#86B0BD",
        gold: "#E1D0B3",
      });
    } else {
      applyThemeVars({
        bg: "#fdf6ee",
        primary: "#5e445a",
        accent: "#dc7243",
        gold: "#dd9d5b",
      });
    }
  }

  async function initSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) await supabase.auth.signInAnonymously();
    await Promise.all([fetchRecipes(), fetchCollections(), fetchMealPlan()]);
  }

  async function fetchRecipes() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/recipes", { headers });
    const data = await res.json();
    if (Array.isArray(data)) setRecipes(data);
  }

  async function fetchCollections() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/collections", { headers });
    const data = await res.json();
    if (Array.isArray(data)) setCollections(data);
  }

  async function fetchMealPlan() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/meal-plan", { headers });
    const data = await res.json();
    if (data.week_data) setWeekData(data.week_data);
    if (data.unscheduled) setUnscheduled(data.unscheduled);
  }

  function showToast(message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, id }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setHasError("");
    const headers = await getAuthHeaders();
    const autoTagging = localStorage.getItem("autoTagging") !== "false";
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { ...headers, "x-auto-tagging": String(autoTagging) },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      setHasError(data.error || "Something went wrong");
    } else {
      setUrl("");
      setRecipes((prev) => [data, ...prev]);
    }
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/recipes", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setSelectedRecipeIds((prev) => prev.filter((r) => r !== id));
      setCollections((prev) =>
        prev.map((c) => ({
          ...c,
          recipe_ids: c.recipe_ids.filter((rid) => rid !== id),
        })),
      );
    }
  }

  function handleSelect(id: string) {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }

  function handleTagsUpdated(id: string, tags: string[]) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, tags } : r)));
  }

  function handleNotesSaved(id: string, notes: string) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));
  }

  async function handleAddToCollection(collectionId: string) {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    const newIds = Array.from(
      new Set([...collection.recipe_ids, ...selectedRecipeIds]),
    );
    const headers = await getAuthHeaders();
    const res = await fetch("/api/collections", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: collectionId, recipe_ids: newIds }),
    });
    const data = await res.json();
    if (!data.error) {
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? data : c)),
      );
      showToast(
        `Added ${selectedRecipeIds.length} recipe${selectedRecipeIds.length > 1 ? "s" : ""} to "${collection.name}"`,
      );
    }
  }

  async function handleCreateAndAddCollection(name: string) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/collections", {
      method: "POST",
      headers,
      body: JSON.stringify({ name, recipe_ids: selectedRecipeIds }),
    });
    const data = await res.json();
    if (!data.error) {
      setCollections((prev) => [...prev, data]);
      showToast(
        `Created "${name}" with ${selectedRecipeIds.length} recipe${selectedRecipeIds.length > 1 ? "s" : ""}`,
      );
    }
  }

  function handleAddToPlanner() {
    const newUnscheduled = Array.from(
      new Set([...unscheduled, ...selectedRecipeIds]),
    );
    setUnscheduled(newUnscheduled);
    setIsPlannerActive(true);
    setSelectedRecipeIds([]);
    showToast(
      `Added ${selectedRecipeIds.length} recipe${selectedRecipeIds.length > 1 ? "s" : ""} to planner`,
    );
    getAuthHeaders().then((headers) => {
      fetch("/api/meal-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          week_data: weekData,
          unscheduled: newUnscheduled,
        }),
      });
    });
  }

  function handlePlannerChange(
    newWeekData: WeekData,
    newUnscheduled: string[],
  ) {
    setWeekData(newWeekData);
    setUnscheduled(newUnscheduled);
  }

  return (
    <>
      <div className="app-layout">
        <CollectionsSidebar
          collections={collections}
          activeCollectionId={activeCollectionId}
          isPlannerActive={isPlannerActive}
          isGroceryOpen={isGroceryOpen}
          isDark={isDark}
          grocerySource={grocerySource}
          onSelect={(id) => {
            setActiveCollectionId(id);
            setIsPlannerActive(false);
          }}
          onPlannerSelect={() => {
            setIsPlannerActive(true);
            setActiveCollectionId(null);
            setIsGroceryOpen(false);
          }}
          onGroceryToggle={() => setIsGroceryOpen((p) => !p)}
          onGroceryRegenerate={() => {
            setIsGroceryOpen(true);
            setGroceryRegenerate((n) => n + 1);
          }}
          onGrocerySourceChange={setGrocerySource}
          onCollectionsUpdated={setCollections}
          onSettingsOpen={() => setIsSettingsOpen(true)}
          onDarkToggle={toggleDark}
        />

        <div className="main-content-wrapper">
          <main className="main-content">
            <header className="header">
              <p className="header-eyebrow">Your Recipe Collection</p>
              <h1 className="header-title">Culinary Cloud</h1>
              <p className="header-subtitle">
                Save recipes, build grocery lists, and keep your kitchen
                organized.
              </p>
            </header>

            {!isPlannerActive && (
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
                    <button
                      className="submit-btn"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Recipe"}
                    </button>
                  </div>
                  {hasError && <p className="error-msg">{hasError}</p>}
                </form>
              </div>
            )}

            <h2 className="recipes-header">
              {isPlannerActive
                ? "Meal Planner"
                : activeCollectionId
                  ? (collections.find((c) => c.id === activeCollectionId)
                      ?.name ?? "Collection")
                  : "Saved Recipes"}
            </h2>

            <StickyActions
              selectedRecipeIds={selectedRecipeIds}
              recipes={recipes}
              collections={collections}
              isPlannerActive={isPlannerActive}
              onCompare={() => setIsComparing(true)}
              onAddToCollection={handleAddToCollection}
              onCreateAndAddCollection={handleCreateAndAddCollection}
              onAddToPlanner={handleAddToPlanner}
              onDeselectAll={() => setSelectedRecipeIds([])}
            />

            {isPlannerActive ? (
              <MealPlanner
                recipes={recipes}
                weekData={weekData}
                unscheduled={unscheduled}
                onWeekDataChange={handlePlannerChange}
              />
            ) : (
              <RecipeList
                recipes={recipes}
                selectedRecipeIds={selectedRecipeIds}
                activeCollectionRecipeIds={
                  activeCollectionId
                    ? (collections.find((c) => c.id === activeCollectionId)
                        ?.recipe_ids ?? null)
                    : null
                }
                onSelect={handleSelect}
                onDelete={handleDelete}
                onTagsUpdated={handleTagsUpdated}
                onNotesSaved={handleNotesSaved}
              />
            )}
          </main>
        </div>

        {isSettingsOpen && (
          <SettingsSidebar
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>

      {isGroceryOpen && (
        <GroceryPanel
          ingredientSource={groceryIngredientSource}
          onClose={() => setIsGroceryOpen(false)}
          shouldRegenerate={groceryRegenerate}
          isHidden={!isGroceryOpen}
        />
      )}

      {isComparing && (
        <CompareModal
          recipes={recipes.filter((r) => selectedRecipeIds.includes(r.id))}
          onClose={() => setIsComparing(false)}
        />
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>

      <footer className="footer">
        <p className="footer-text">
          Built by <strong>BasZak</strong>
        </p>
        <div className="footer-links">
          <a
            href="https://www.linkedin.com/in/basem-zaky-450733312/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="footer-icon"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="https://x.com/BasZak25"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="footer-icon"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="mailto:baszaksocial@gmail.com"
            aria-label="Email"
            className="footer-icon"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </a>
          <a
            href="https://insigh.to/b/culinary-cloud-20"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Feedback"
            className="footer-icon"
            title="Give feedback"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </a>
        </div>
      </footer>
    </>
  );
}
