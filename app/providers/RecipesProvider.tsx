"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getAuthHeaders } from "@/lib/supabase";
import type { Recipe } from "@/types";
import { useAuth } from "@/hooks/useAuth";

type RecipesContextType = {
  recipes: Recipe[];
  selectedRecipeIds: string[];
  isInitialLoading: boolean;
  fetchRecipes: () => Promise<void>;
  addRecipe: (
    url: string,
    autoTagging: boolean,
    youtubeExtraction: boolean,
  ) => Promise<{
    success: boolean;
    error?: string;
    duplicate?: boolean;
    title?: string;
  }>;
  deleteRecipe: (id: string) => Promise<void>;
  updateRecipeTags: (id: string, tags: string[]) => void;
  updateRecipeNotes: (id: string, notes: string) => void;
  toggleSelectRecipe: (id: string) => void;
  clearSelection: () => void;
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
};

export const RecipesContext = createContext<RecipesContextType | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/recipes", { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecipes(data);
      }
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      await fetchRecipes();
      setIsInitialLoading(false);
    };
    init();
  }, [fetchRecipes]);

  const addRecipe = useCallback(
    async (url: string, autoTagging: boolean, youtubeExtraction: boolean) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: {
            ...headers,
            "x-auto-tagging": String(autoTagging),
            "x-youtube-extraction": String(youtubeExtraction),
          },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: data.error || "Something went wrong",
          };
        }

        if (data._duplicate) {
          return { success: false, duplicate: true, title: data.title };
        }

        setRecipes((prev) => [data, ...prev]);
        return { success: true };
      } catch (err) {
        return { success: false, error: "Network error" };
      }
    },
    [],
  );

  const deleteRecipe = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/recipes", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        setSelectedRecipeIds((prev) => prev.filter((r) => r !== id));
      }
    } catch (err) {
      console.error("Failed to delete recipe:", err);
    }
  }, []);

  const updateRecipeTags = useCallback((id: string, tags: string[]) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, tags } : r)));
  }, []);

  const updateRecipeNotes = useCallback((id: string, notes: string) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));
  }, []);

  const toggleSelectRecipe = useCallback((id: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRecipeIds([]);
  }, []);

  return (
    <RecipesContext.Provider
      value={{
        recipes,
        selectedRecipeIds,
        isInitialLoading,
        fetchRecipes,
        addRecipe,
        deleteRecipe,
        updateRecipeTags,
        updateRecipeNotes,
        toggleSelectRecipe,
        clearSelection,
        setRecipes,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}
