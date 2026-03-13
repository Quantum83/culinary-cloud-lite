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
  isGroceryOpen: boolean;
  onSelect: (id: string | null) => void;
  onPlannerSelect: () => void;
  onGroceryOpen: () => void;
  onCollectionsUpdated: (collections: Collection[]) => void;
  onSettingsOpen: () => void;
};

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  isPlannerActive,
  isGroceryOpen,
  onSelect,
  onPlannerSelect,
  onGroceryOpen,
  onCollectionsUpdated,
  onSettingsOpen,
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
        <li role="separator" className="sidebar-divider" />
        <li
          className={`collection-item ${isPlannerActive ? "active" : ""}`}
          onClick={onPlannerSelect}
        >
          <span className="collection-icon">📅</span>
          <span className="collection-name">Meal Planner</span>
        </li>
        <li
          className={`collection-item ${isGroceryOpen ? "active" : ""}`}
          onClick={onGroceryOpen}
        >
          <span className="collection-icon">🛒</span>
          <span className="collection-name">Grocery List</span>
        </li>
      </ul>

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

      <div className="sidebar-spacer" />

      <button
        className="settings-gear-btn"
        onClick={onSettingsOpen}
        aria-label="Theme settings"
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span className="settings-gear-label">Theme</span>
      </button>
    </aside>
  );
}
