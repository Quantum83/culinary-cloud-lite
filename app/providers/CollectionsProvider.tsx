"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getAuthHeaders } from "@/lib/supabase";
import type { Collection } from "@/types";

type CollectionsContextType = {
  collections: Collection[];
  fetchCollections: () => Promise<void>;
  createCollection: (
    name: string,
    recipeIds?: string[],
  ) => Promise<Collection | null>;
  updateCollection: (id: string, recipeIds: string[]) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  removeRecipeFromCollections: (recipeId: string) => void;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
};

export const CollectionsContext = createContext<CollectionsContextType | null>(
  null,
);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([]);

  const fetchCollections = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/collections", { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCollections(data);
      }
    } catch (err) {
      console.error("Failed to fetch collections:", err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(
    async (name: string, recipeIds: string[] = []) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/collections", {
          method: "POST",
          headers,
          body: JSON.stringify({ name, recipe_ids: recipeIds }),
        });
        const data = await res.json();

        if (!data.error) {
          setCollections((prev) => [...prev, data]);
          return data;
        }
        return null;
      } catch (err) {
        console.error("Failed to create collection:", err);
        return null;
      }
    },
    [],
  );

  const updateCollection = useCallback(
    async (id: string, recipeIds: string[]) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/collections", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ id, recipe_ids: recipeIds }),
        });
        const data = await res.json();

        if (!data.error) {
          setCollections((prev) => prev.map((c) => (c.id === id ? data : c)));
        }
      } catch (err) {
        console.error("Failed to update collection:", err);
      }
    },
    [],
  );

  const deleteCollection = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/collections", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  }, []);

  const removeRecipeFromCollections = useCallback((recipeId: string) => {
    setCollections((prev) =>
      prev.map((c) => ({
        ...c,
        recipe_ids: c.recipe_ids.filter((rid) => rid !== recipeId),
      })),
    );
  }, []);

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        fetchCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        removeRecipeFromCollections,
        setCollections,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}
