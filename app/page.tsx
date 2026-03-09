"use client";

import { useState, useEffect } from "react";
import { supabase, getAuthHeaders } from "@/lib/supabase";
import RecipeList from "@/components/RecipeList";
import CollectionsSidebar from "@/components/CollectionsSidebar";
import StickyActions from "@/components/StickyActions";
import GroceryPanel from "@/components/GroceryPanel";
import CompareModal from "@/components/CompareModal";
import MealPlanner from "@/components/MealPlanner";

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

type Collection = {
  id: string;
  name: string;
  recipe_ids: string[];
};

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
  const [showGroceryPanel, setShowGroceryPanel] = useState(false);
  const [groceryPanelKey, setGroceryPanelKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    initSession();
  }, []);

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
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers,
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
    const headers_promise = getAuthHeaders();
    headers_promise.then((headers) => {
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

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? null;
  const selectedRecipes = recipes.filter((r) =>
    selectedRecipeIds.includes(r.id),
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');

        :root {
          --primary: #5e445a;
          --accent: #dc7243;
          --gold: #dd9d5b;
          --bg: #fdf6ee;
        }

        html { font-size: 112%; }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: var(--bg);
          font-family: 'Lato', sans-serif;
          color: #3a2a38;
          min-height: 100vh;
          border-top: 5px solid var(--primary);
        }

        .app-layout {
          display: flex;
          min-height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
        }

        .main-content-wrapper {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .collections-sidebar {
          width: 220px;
          flex-shrink: 0;
          padding: 40px 16px;
          border-right: none;
          background: #ede3d8;
          position: sticky;
          top: 24px;
          height: calc(100vh - 96px);
          margin: 24px 0 24px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(94,68,90,0.13);
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .collections-sidebar:hover {
          box-shadow: 0 8px 36px rgba(94,68,90,0.2);
          transform: translateY(-2px);
        }

        .sidebar-label { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
        .sidebar-divider { border: none; border-top: 1px solid #e8d8c4; margin: 12px 0; }

        .collections-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .collection-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #6b4a5e;
          transition: background 0.15s, color 0.15s;
          position: relative;
          list-style: none;
        }

        .collection-item:hover { background: #f0e4d4; }
        .collection-item.active { background: var(--primary); color: white; }
        .collection-item.active .collection-count { background: rgba(255,255,255,0.2); color: white; }
        .planner-item { margin-top: 4px; }

        .collection-icon { font-size: 14px; flex-shrink: 0; }
        .collection-name { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .collection-count { font-size: 10px; background: #e8d8c4; color: #6b4a5e; padding: 1px 6px; border-radius: 10px; font-weight: 700; }

        .collection-delete-btn { background: none; border: none; color: #c4a898; cursor: pointer; font-size: 16px; padding: 0 2px; line-height: 1; opacity: 0; transition: opacity 0.15s, color 0.15s; }
        .collection-item:hover .collection-delete-btn { opacity: 1; }
        .collection-delete-btn:hover { color: var(--accent); }
        .collection-delete-confirm { display: flex; gap: 4px; position: absolute; right: 8px; }
        .confirm-delete-btn { background: var(--accent); color: white; border: none; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-family: 'Lato', sans-serif; }
        .cancel-delete-btn { background: #e8d8c4; color: #6b4a5e; border: none; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-family: 'Lato', sans-serif; }

        .new-collection-btn { background: none; border: 1.5px dashed #e0cfc0; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #a65a6e; cursor: pointer; font-family: 'Lato', sans-serif; font-weight: 700; transition: border-color 0.2s, color 0.2s; text-align: left; margin-top: 8px; }
        .new-collection-btn:hover { border-color: var(--accent); color: var(--accent); }
        .new-collection-form { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
        .new-collection-input { border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-family: 'Lato', sans-serif; color: #3a2a38; background: #fff; outline: none; }
        .new-collection-input:focus { border-color: var(--accent); }
        .new-collection-save { background: var(--accent); color: white; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Lato', sans-serif; }
        .new-collection-cancel { background: none; color: #a65a6e; border: 1px solid #e0cfc0; border-radius: 6px; padding: 5px 10px; font-size: 11px; cursor: pointer; font-family: 'Lato', sans-serif; }

        .main-content { width: 100%; max-width: 860px; padding: 60px 32px 100px; min-width: 0; }

        .header { margin-bottom: 24px; border-bottom: 2px solid var(--primary); padding-bottom: 24px; }
        .header-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
        .header-title { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: var(--primary); line-height: 1.1; margin-bottom: 8px; }
        .header-subtitle { font-size: 15px; color: #a65a6e; font-weight: 300; }

        .form-section { background: #fff; border: 1.5px solid var(--primary); border-radius: 12px; padding: 28px; margin-bottom: 48px; box-shadow: 0 2px 16px rgba(94,68,90,0.07); transition: transform 0.2s, box-shadow 0.2s; }
        .form-section:hover { transform: scale(1.01) rotate(0.3deg); box-shadow: 0 8px 32px rgba(94,68,90,0.13); }
        .form-label { display: block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--primary); margin-bottom: 10px; }
        .form-row { display: flex; gap: 12px; }
        .form-input { flex: 1; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 12px 16px; font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38; background: var(--bg); outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: var(--accent); }
        .form-input::placeholder { color: #c4a898; }
        .submit-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; white-space: nowrap; }
        .submit-btn:hover { background: #c45e30; transform: scale(1.04) rotate(-0.5deg); box-shadow: 0 4px 16px rgba(220,114,67,0.3); }
        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { background: #e0b89e; cursor: not-allowed; transform: none; }
        .error-msg { margin-top: 12px; font-size: 13px; color: #c0392b; }

        .recipes-header { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--primary); margin-bottom: 20px; }
        .empty-msg { color: #a65a6e; font-size: 14px; font-style: italic; }

        .sticky-actions { position: sticky; top: 16px; z-index: 50; display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }

        .grocery-btn { background: #4e6646; color: white; border: 3px solid rgba(255,255,255,0.9); border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.2); white-space: nowrap; }
        .grocery-btn:hover { background: #3a4e32; transform: scale(1.04) rotate(-0.5deg); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }

        .compare-btn { background: #a65a6e; color: white; border: 3px solid rgba(255,255,255,0.9); border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.2); white-space: nowrap; }
        .compare-btn:hover { background: #8a4a5a; transform: scale(1.04) rotate(-0.5deg); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }

        .add-collection-btn { background: var(--gold); color: white; border: 3px solid rgba(255,255,255,0.9); border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.2); white-space: nowrap; }
        .add-collection-btn:hover { background: #c4843a; transform: scale(1.04) rotate(-0.5deg); }

        .add-planner-btn { background: var(--primary); color: white; border: 3px solid rgba(255,255,255,0.9); border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.2); white-space: nowrap; }
        .add-planner-btn:hover { background: #3a2a38; transform: scale(1.04) rotate(-0.5deg); }

        .collection-picker-wrapper { position: relative; }
        .collection-picker { position: absolute; top: calc(100% + 8px); left: 0; background: #fff; border: 1.5px solid #e0cfc0; border-radius: 12px; box-shadow: 0 4px 20px rgba(94,68,90,0.15); z-index: 100; min-width: 200px; overflow: hidden; padding: 6px 0; }
        .collection-picker-item { display: block; width: 100%; text-align: left; background: none; border: none; padding: 10px 16px; font-size: 13px; font-family: 'Lato', sans-serif; color: #3a2a38; cursor: pointer; transition: background 0.15s; }
        .collection-picker-item:hover { background: var(--bg); color: var(--accent); }
        .collection-picker-new { padding: 8px 12px; border-top: 1px solid #f0e0d0; }
        .collection-picker-input { width: 100%; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-family: 'Lato', sans-serif; color: #3a2a38; background: var(--bg); outline: none; }
        .collection-picker-input:focus { border-color: var(--accent); }
        .collection-picker-input::placeholder { color: #c4a898; }

        .recipe-list { display: flex; flex-direction: column; }
        .search-row { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
        .search-input { flex: 1; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38; background: #fff; outline: none; transition: border-color 0.2s; }
        .search-input:focus { border-color: var(--accent); }
        .search-input::placeholder { color: #c4a898; }
        .sort-select { border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 10px 40px 10px 16px; font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235e445a' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 14px center; appearance: none; outline: none; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
        .sort-select:focus { border-color: var(--accent); }
        .sort-select:hover { transform: scale(1.03) rotate(-0.5deg); }
        .filter-row { display: flex; gap: 8px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; }
        .multiselect-wrapper { position: relative; }
        .multiselect-btn { background: #fff; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; color: #6b4a5e; cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.2s; white-space: nowrap; }
        .multiselect-btn:hover { border-color: var(--primary); color: var(--primary); transform: scale(1.03); }
        .multiselect-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }
        .multiselect-dropdown { position: absolute; top: calc(100% + 4px); left: 0; background: #fff; border: 1.5px solid #e0cfc0; border-radius: 10px; box-shadow: 0 4px 20px rgba(94,68,90,0.12); z-index: 200; min-width: 180px; max-height: 240px; overflow-y: auto; padding: 6px 0; }
        .multiselect-item { display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 13px; font-family: 'Lato', sans-serif; color: #3a2a38; cursor: pointer; transition: background 0.15s; }
        .multiselect-item:hover { background: var(--bg); }
        .multiselect-item input { accent-color: var(--primary); cursor: pointer; }
        .multiselect-empty { padding: 10px 14px; font-size: 13px; color: #c4a898; font-style: italic; }
        .clear-filters-btn { background: none; border: none; color: #a65a6e; font-size: 12px; font-family: 'Lato', sans-serif; cursor: pointer; padding: 4px 8px; text-decoration: underline; transition: color 0.2s; }
        .clear-filters-btn:hover { color: var(--accent); }

        .recipe-card { background: #fff; border: 1.5px solid #e8d8c4; border-radius: 12px; padding: 24px 28px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(94,68,90,0.06); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; position: relative; }
        .recipe-card:hover { transform: scale(1.01) rotate(0.4deg); box-shadow: 0 8px 28px rgba(94,68,90,0.13); }
        .recipe-card.selected { border-color: #e8d8c4; box-shadow: 0 20px 60px rgba(94,68,90,0.25), 0 8px 24px rgba(94,68,90,0.15); transform: scale(1.04) rotate(0.6deg); z-index: 10; }

        .recipe-image-wrapper { position: relative; margin-bottom: 16px; border-radius: 8px; overflow: hidden; cursor: pointer; height: 180px; }
        .recipe-image-bg { position: absolute; inset: -10px; background-size: cover; background-position: center; filter: blur(12px) brightness(0.85); transform: scale(1.1); transition: transform 0.4s ease; z-index: 0; }
        .recipe-image-wrapper:hover .recipe-image-bg { transform: scale(1.25); }
        .recipe-image { position: relative; width: 100%; height: 180px; object-fit: contain; display: block; z-index: 1; transition: transform 0.4s ease; }
        .recipe-image-wrapper:hover .recipe-image { transform: scale(1.05); }

        .source-badge { position: absolute; top: 10px; left: 10px; background: rgba(94,68,90,0.85); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 20px; backdrop-filter: blur(4px); z-index: 3; pointer-events: none; }
        .recipe-image-overlay { position: absolute; inset: 0; background: rgba(94,68,90,0); display: flex; align-items: center; justify-content: center; transition: background 0.3s; border-radius: 8px; z-index: 2; }
        .recipe-image-wrapper:hover .recipe-image-overlay { background: rgba(94,68,90,0.45); }
        .overlay-checked { background: rgba(94,68,90,0.25) !important; }
        .recipe-image-wrapper:hover .overlay-checked { background: rgba(94,68,90,0.55) !important; }
        .overlay-icons { display: flex; gap: 20px; align-items: center; }
        .overlay-checkmark, .overlay-trash { width: 48px; height: 48px; opacity: 0; transform: scale(0.8); transition: opacity 0.2s, transform 0.2s; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3)); }
        .recipe-image-wrapper:hover .overlay-checkmark, .recipe-image-wrapper:hover .overlay-trash { opacity: 1; transform: scale(1); }
        .overlay-checked .overlay-checkmark { opacity: 1; transform: scale(1); }
        .overlay-checkmark:hover { transform: scale(1.2) !important; filter: drop-shadow(0 4px 12px rgba(255,255,255,0.4)); }
        .overlay-trash-btn { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; }
        .overlay-trash-btn:hover .overlay-trash { transform: scale(1.2) !important; filter: drop-shadow(0 4px 12px rgba(220,50,50,0.6)) !important; }
        .no-image-actions { display: flex; justify-content: flex-end; margin-bottom: 8px; }
        .no-image-trash-btn { background: none; border: none; cursor: pointer; padding: 4px; opacity: 0.4; transition: opacity 0.2s, transform 0.2s; }
        .no-image-trash-btn:hover { opacity: 1; transform: scale(1.15); }

        .recipe-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; align-items: center; }
        .recipe-tag { background: #f5ede3; border: 1px solid #e0cfc0; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: #a65a6e; cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.15s; }
        .recipe-tag:hover { background: #fde8e0; border-color: var(--accent); color: var(--accent); }
        .tag-input-wrapper { position: relative; display: flex; align-items: center; }
        .tag-input { border: 1.5px dashed #e0cfc0; border-radius: 20px; padding: 3px 28px 3px 10px; font-size: 11px; font-family: 'Lato', sans-serif; color: #3a2a38; background: transparent; outline: none; width: 110px; transition: border-color 0.2s; }
        .tag-input:focus { border-color: var(--accent); }
        .tag-input::placeholder { color: #c4a898; }
        .tag-add-btn { position: absolute; right: 6px; background: #4e6646; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.2s, transform 0.2s; }
        .tag-add-btn:hover { background: #3a4e32; transform: scale(1.15); }
        .tag-dropdown { position: absolute; top: calc(100% + 4px); left: 0; background: #fff; border: 1.5px solid #e0cfc0; border-radius: 10px; box-shadow: 0 4px 16px rgba(94,68,90,0.12); z-index: 200; min-width: 150px; overflow: hidden; }
        .tag-dropdown-item { display: block; width: 100%; text-align: left; background: none; border: none; padding: 8px 14px; font-size: 12px; font-family: 'Lato', sans-serif; color: #3a2a38; cursor: pointer; transition: background 0.15s; }
        .tag-dropdown-item:hover { background: var(--bg); color: var(--accent); }

        .recipe-card-header { display: flex; align-items: flex-start; }
        .recipe-title { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--primary); text-decoration: none; display: block; line-height: 1.3; flex: 1; }
        .recipe-title:hover { color: var(--accent); }
        .recipe-divider { border: none; border-top: 1px solid #f0e0d0; margin: 16px 0; }
        .recipe-details { margin-top: 4px; position: relative; }
        .recipe-preview { max-height: 80px; overflow: hidden; position: relative; pointer-events: none; }
        .recipe-preview::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(transparent, #fff); }
        .recipe-summary { font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); cursor: pointer; user-select: none; margin-top: 8px; display: inline-block; background: none; border: none; padding: 0; font-family: 'Lato', sans-serif; transition: color 0.2s, transform 0.2s; }
        .recipe-summary:hover { color: #c45e30; transform: scale(1.04) rotate(-0.5deg); }

        .scale-controls { display: flex; gap: 6px; margin: 12px 0 8px; }
        .scale-btn { background: #fff; border: 1.5px solid #e0cfc0; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700; color: #6b4a5e; cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.15s; }
        .scale-btn:hover { border-color: var(--primary); color: var(--primary); }
        .scale-btn.active { background: var(--primary); border-color: var(--primary); color: white; }

        .recipe-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px; }
        .ingredients-label { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
        .ingredients-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .ingredient-item { font-size: 14px; color: #6b4a5e; padding-left: 16px; position: relative; line-height: 1.5; }
        .ingredient-item::before { content: '—'; position: absolute; left: 0; color: var(--gold); font-size: 12px; }
        .instructions-list { list-style: none; display: flex; flex-direction: column; gap: 8px; counter-reset: steps; }
        .instruction-item { font-size: 14px; color: #6b4a5e; padding-left: 28px; position: relative; line-height: 1.6; counter-increment: steps; }
        .instruction-item::before { content: counter(steps); position: absolute; left: 0; top: 1px; background: var(--primary); color: white; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

        .notes-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0e0d0; }
        .notes-display { cursor: pointer; padding: 10px 14px; border-radius: 8px; border: 1.5px dashed #e0cfc0; transition: border-color 0.2s, background 0.2s; min-height: 42px; }
        .notes-display:hover { border-color: var(--accent); background: var(--bg); }
        .notes-text { font-size: 14px; color: #6b4a5e; line-height: 1.6; }
        .notes-placeholder { font-size: 14px; color: #c4a898; font-style: italic; }
        .notes-textarea { width: 100%; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: 'Lato', sans-serif; color: #3a2a38; background: var(--bg); outline: none; resize: vertical; transition: border-color 0.2s; line-height: 1.6; }
        .notes-textarea:focus { border-color: var(--accent); }
        .notes-actions { display: flex; gap: 8px; margin-top: 8px; }
        .notes-save-btn { background: var(--accent); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: background 0.2s, transform 0.2s; }
        .notes-save-btn:hover { background: #c45e30; transform: scale(1.03) rotate(-0.5deg); }
        .notes-save-btn:disabled { background: #e0b89e; cursor: not-allowed; transform: none; }
        .notes-cancel-btn { background: none; color: #a65a6e; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; font-family: 'Lato', sans-serif; transition: border-color 0.2s, transform 0.2s; }
        .notes-cancel-btn:hover { border-color: #a65a6e; transform: scale(1.03) rotate(0.5deg); }

        .grocery-panel { position: fixed; bottom: 0; right: 24px; width: 340px; background: #fff; border: 1.5px solid var(--primary); border-bottom: none; border-radius: 12px 12px 0 0; box-shadow: 0 -4px 24px rgba(94,68,90,0.15); z-index: 100; max-height: 60vh; display: flex; flex-direction: column; }
        .grocery-minimized { max-height: none; }
        .grocery-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--primary); color: white; border-radius: 10px 10px 0 0; cursor: pointer; font-size: 14px; font-weight: 700; font-family: 'Lato', sans-serif; user-select: none; }
        .grocery-minimize-btn { background: none; border: none; color: white; cursor: pointer; font-size: 12px; padding: 0; }
        .grocery-panel-body { overflow-y: auto; padding: 16px 18px; flex: 1; }
        .grocery-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .grocery-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #3a2a38; line-height: 1.4; }
        .grocery-item input[type="checkbox"] { margin-top: 2px; accent-color: var(--accent); flex-shrink: 0; }
        .grocery-checked { text-decoration: line-through; color: #b0a0a8; }
        .grocery-breakdown { list-style: none; margin-top: 4px; padding-left: 4px; display: flex; flex-direction: column; gap: 2px; }
        .grocery-breakdown-item { font-size: 11px; color: #a65a6e; padding-left: 10px; position: relative; line-height: 1.4; }
        .grocery-breakdown-item::before { content: '·'; position: absolute; left: 0; color: var(--gold); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(58,42,56,0.5); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal { background: var(--bg); border-radius: 16px; width: 100%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 80px rgba(58,42,56,0.3); }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px; border-bottom: 1.5px solid #e8d8c4; }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--primary); }
        .modal-close { background: none; border: none; font-size: 18px; color: #a65a6e; cursor: pointer; padding: 4px; transition: color 0.2s, transform 0.2s; }
        .modal-close:hover { color: var(--primary); transform: scale(1.2); }
        .modal-body { overflow-y: auto; padding: 24px 28px; display: flex; flex-direction: column; gap: 24px; }
        .compare-cards-grid { display: grid; gap: 16px; }
        .compare-cards-grid:has(> :nth-child(2):last-child) { grid-template-columns: 1fr 1fr; }
        .compare-cards-grid:has(> :nth-child(3):last-child) { grid-template-columns: 1fr 1fr 1fr; }
        .compare-cards-grid:has(> :nth-child(4):last-child) { grid-template-columns: 1fr 1fr; }
        .compare-card { background: #fff; border: 1.5px solid #e8d8c4; border-radius: 12px; padding: 16px; }
        .compare-card-image-wrapper { position: relative; height: 120px; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
        .compare-card-image { position: relative; width: 100%; height: 120px; object-fit: contain; display: block; z-index: 1; }
        .compare-card-title { font-family: 'Playfair Display', serif; font-size: 15px; color: var(--primary); text-decoration: none; display: block; line-height: 1.3; margin-bottom: 8px; }
        .compare-card-title:hover { color: var(--accent); }
        .comparison-box { background: #fff; border: 1.5px solid #e8d8c4; border-radius: 12px; padding: 20px; }
        .comparison-loading { font-size: 14px; color: #a65a6e; font-style: italic; }
        .comparison-error { font-size: 14px; color: #c0392b; }
        .comparison-text { font-size: 14px; color: #6b4a5e; line-height: 1.7; }

        .meal-planner { display: flex; flex-direction: column; gap: 24px; }
        .planner-header { display: flex; align-items: center; justify-content: space-between; }
        .planner-actions { display: flex; gap: 12px; align-items: center; }
        .clear-planner-btn { background: none; border: 1.5px solid #e0cfc0; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #a65a6e; cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.2s; }
        .clear-planner-btn:hover { border-color: var(--accent); color: var(--accent); }

        .unscheduled-pool { background: #fff; border: 2px dashed #e0cfc0; border-radius: 12px; padding: 16px; transition: border-color 0.2s, background 0.2s; }
        .unscheduled-pool.drag-over { border-color: var(--gold); background: var(--bg); }
        .pool-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
        .pool-recipes { display: flex; flex-wrap: wrap; gap: 8px; }

        .planner-empty { text-align: center; padding: 48px 24px; color: #a65a6e; }
        .planner-empty p { margin-bottom: 8px; font-size: 14px; line-height: 1.6; }
        .planner-empty strong { color: var(--primary); }

        .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }

        .day-column { background: #fff; border: 1.5px solid #e8d8c4; border-radius: 12px; padding: 12px; min-height: 160px; transition: border-color 0.2s, background 0.2s; display: flex; flex-direction: column; }
        .day-column.drag-over { border-color: var(--primary); background: #f5ede3; }
        .day-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--primary); margin-bottom: 10px; }
        .day-recipes { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .day-empty { font-size: 12px; color: #c4a898; font-style: italic; text-align: center; margin-top: 12px; }

        .planner-recipe-chip { display: flex; align-items: center; gap: 6px; background: var(--bg); border: 1px solid #e0cfc0; border-radius: 8px; padding: 6px 8px; cursor: grab; transition: all 0.15s; user-select: none; }
        .planner-recipe-chip:hover { border-color: var(--primary); box-shadow: 0 2px 8px rgba(94,68,90,0.12); }
        .planner-recipe-chip.dragging { opacity: 0.4; transform: scale(0.95); }
        .chip-image { width: 28px; height: 28px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .chip-title { font-size: 11px; color: var(--primary); font-weight: 600; flex: 1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
        .chip-remove { background: none; border: none; color: #c4a898; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; flex-shrink: 0; transition: color 0.15s; }
        .chip-remove:hover { color: var(--accent); }

        .toast-container { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 500; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
        .toast { background: var(--primary); color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: 'Lato', sans-serif; box-shadow: 0 4px 16px rgba(58,42,56,0.25); animation: toastIn 0.2s ease; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .week-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 640px) {
          .collections-sidebar { width: auto; height: auto; position: static; flex-direction: row; overflow-x: auto; padding: 12px 16px; border-right: none; border-bottom: 1.5px solid #e8d8c4; }
          .collections-list { flex-direction: row; flex: none; }
          .collection-item { white-space: nowrap; }
          .app-layout { flex-direction: column; }
          .main-content { padding: 24px 16px 80px; }
          .compare-cards-grid { grid-template-columns: 1fr !important; }
          .week-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .footer { position: fixed; bottom: 0; left: 0; right: 0; height: 48px; background: var(--bg); border-top: 1px solid #e8d8c4; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; z-index: 90; }
        .footer-text { font-size: 13px; color: #a65a6e; }
        .footer-text strong { color: var(--primary); }
        .footer-links { display: flex; gap: 16px; align-items: center; }
        .footer-icon { color: #a65a6e; transition: color 0.2s, transform 0.2s; display: flex; }
        .footer-icon:hover { color: var(--primary); transform: scale(1.15); }
      `}</style>

      <div className="app-layout">
        <CollectionsSidebar
          collections={collections}
          activeCollectionId={activeCollectionId}
          isPlannerActive={isPlannerActive}
          onSelect={(id) => {
            setActiveCollectionId(id);
            setIsPlannerActive(false);
          }}
          onPlannerSelect={() => {
            setIsPlannerActive(true);
            setActiveCollectionId(null);
          }}
          onCollectionsUpdated={setCollections}
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
              onGenerateGroceryList={() => {
                setGroceryPanelKey((k) => k + 1);
                setShowGroceryPanel(true);
              }}
              onCompare={() => setIsComparing(true)}
              onAddToCollection={handleAddToCollection}
              onCreateAndAddCollection={handleCreateAndAddCollection}
              onAddToPlanner={handleAddToPlanner}
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
            href="https://x.com/YOUR_HANDLE"
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
        </div>
      </footer>

      {showGroceryPanel && (
        <GroceryPanel
          key={groceryPanelKey}
          selectedRecipeIds={selectedRecipeIds}
          recipes={recipes}
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
    </>
  );
}
