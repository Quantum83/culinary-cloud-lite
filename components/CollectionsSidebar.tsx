"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/supabase";

type Collection = {
  id: string;
  name: string;
  recipe_ids: string[];
};

type CollectionsSidebarProps = {
  collections: Collection[];
  activeCollectionId: string | null;
  isPlannerActive: boolean;
  onSelect: (id: string | null) => void;
  onPlannerSelect: () => void;
  onCollectionsUpdated: (collections: Collection[]) => void;
};

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  isPlannerActive,
  onSelect,
  onPlannerSelect,
  onCollectionsUpdated,
}: CollectionsSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createCollection() {
    if (!newName.trim()) return;
    const headers = await getAuthHeaders();
    const res = await fetch("/api/collections", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!data.error) {
      onCollectionsUpdated([...collections, data]);
      setNewName("");
      setIsCreating(false);
    }
  }

  async function deleteCollection(id: string) {
    const headers = await getAuthHeaders();
    await fetch("/api/collections", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    onCollectionsUpdated(collections.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  return (
    <aside className="collections-sidebar">
      <p className="sidebar-label">Collections</p>
      <ul className="collections-list">
        <li
          className={`collection-item ${!isPlannerActive && activeCollectionId === null ? "active" : ""}`}
          onClick={() => onSelect(null)}
        >
          <span className="collection-icon">📚</span>
          <span className="collection-name">All Recipes</span>
        </li>
        {collections.map((collection) => (
          <li
            key={collection.id}
            className={`collection-item ${!isPlannerActive && activeCollectionId === collection.id ? "active" : ""}`}
            onClick={() => onSelect(collection.id)}
          >
            <span className="collection-icon">📁</span>
            <span className="collection-name">{collection.name}</span>
            <span className="collection-count">
              {collection.recipe_ids.length}
            </span>
            {deletingId === collection.id ? (
              <div
                className="collection-delete-confirm"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="confirm-delete-btn"
                  onClick={() => deleteCollection(collection.id)}
                >
                  Delete
                </button>
                <button
                  className="cancel-delete-btn"
                  onClick={() => setDeletingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="collection-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(collection.id);
                }}
                aria-label="Delete collection"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="sidebar-divider" />

      <li
        className={`collection-item planner-item ${isPlannerActive ? "active" : ""}`}
        onClick={onPlannerSelect}
      >
        <span className="collection-icon">📅</span>
        <span className="collection-name">Meal Planner</span>
      </li>

      {isCreating ? (
        <div className="new-collection-form">
          <input
            className="new-collection-input"
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createCollection();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewName("");
              }
            }}
            autoFocus
          />
          <button className="new-collection-save" onClick={createCollection}>
            Save
          </button>
          <button
            className="new-collection-cancel"
            onClick={() => {
              setIsCreating(false);
              setNewName("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="new-collection-btn"
          onClick={() => setIsCreating(true)}
        >
          + New Collection
        </button>
      )}
    </aside>
  );
}
