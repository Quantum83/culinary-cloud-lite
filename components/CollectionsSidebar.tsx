"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/supabase";
import type { Collection, AuthUser } from "@/types";

type CollectionsSidebarProps = {
  collections: Collection[];
  activeCollectionId: string | null;
  isPlannerActive: boolean;
  isGroceryOpen: boolean;
  isDark: boolean;
  grocerySource: "selected" | "planner";
  user: AuthUser | null;
  onSelect: (id: string | null) => void;
  onPlannerSelect: () => void;
  onGroceryToggle: () => void;
  onGroceryRegenerate: () => void;
  onGrocerySourceChange: (source: "selected" | "planner") => void;
  onCollectionsUpdated: (collections: Collection[]) => void;
  onSettingsOpen: () => void;
  onDarkToggle: () => void;
  onAuthClick: () => void;
  onSignOut: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  isPlannerActive,
  isGroceryOpen,
  isDark,
  grocerySource,
  user,
  onSelect,
  onPlannerSelect,
  onGroceryToggle,
  onGroceryRegenerate,
  onGrocerySourceChange,
  onCollectionsUpdated,
  onSettingsOpen,
  onDarkToggle,
  onAuthClick,
  onSignOut,
  isMobileOpen,
  onMobileClose,
}: CollectionsSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
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
    <aside
      className={`collections-sidebar ${isMobileOpen ? "mobile-open" : ""}`}
    >
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

      <li
        className={`collection-item ${isPlannerActive ? "active" : ""}`}
        onClick={onPlannerSelect}
      >
        <span className="collection-icon">📅</span>
        <span className="collection-name">Meal Planner</span>
      </li>

      <div className="grocery-sidebar-widget">
        <div className="grocery-sidebar-row">
          <button
            className={`grocery-sidebar-main ${isGroceryOpen ? "active" : ""}`}
            onClick={onGroceryToggle}
          >
            <span className="collection-icon">🛒</span>
            <span className="grocery-sidebar-label">Grocery List</span>
          </button>
          <button
            className="grocery-sidebar-regen"
            onClick={onGroceryRegenerate}
            aria-label="Regenerate grocery list"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
        <div
          className={`grocery-source-dropdown ${isSourceOpen ? "open" : ""}`}
        >
          <p className="grocery-source-label">Generate from:</p>
          <button
            className={`grocery-source-option ${grocerySource === "selected" ? "selected" : ""}`}
            onClick={() => {
              onGrocerySourceChange("selected");
              setIsSourceOpen(false);
            }}
          >
            Selected Recipes
          </button>
          <button
            className={`grocery-source-option ${grocerySource === "planner" ? "selected" : ""}`}
            onClick={() => {
              onGrocerySourceChange("planner");
              setIsSourceOpen(false);
            }}
          >
            Meal Planner
          </button>
        </div>
        <button
          className={`grocery-source-chevron ${isSourceOpen ? "open" : ""}`}
          onClick={() => setIsSourceOpen((p) => !p)}
          aria-label="Select grocery source"
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <hr className="sidebar-divider" />
      <p className="sidebar-label">Account</p>

      {user && !user.isAnonymous ? (
        <div className="sidebar-account-card">
          <div className="sidebar-account-row">
            <div className="sidebar-account-avatar">
              {user.email ? user.email[0] : "?"}
            </div>
            <div className="sidebar-account-details">
              <div className="sidebar-account-email">{user.email}</div>
              <div className="sidebar-account-status">
                <span>✓</span> Synced
              </div>
            </div>
          </div>
          <button
            className="sidebar-signout-btn"
            onClick={() => {
              onSignOut();
              onMobileClose();
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          className="sidebar-signin-btn"
          onClick={() => {
            onAuthClick();
            onMobileClose();
          }}
        >
          <span>🔐</span>
          Sign In / Sign Up
        </button>
      )}

      <div className="sidebar-bottom-row">
        <button
          className="settings-gear-btn"
          onClick={onSettingsOpen}
          aria-label="Settings"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="settings-gear-label">Settings</span>
        </button>
        <button
          className="dark-toggle-sidebar"
          onClick={onDarkToggle}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
