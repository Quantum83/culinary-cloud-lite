"use client";

import { useState } from "react";

type Recipe = { id: string; ingredients: string[]; title: string };
type Collection = { id: string; name: string; recipe_ids: string[] };

type StickyActionsProps = {
  selectedRecipeIds: string[];
  recipes: Recipe[];
  collections: Collection[];
  isPlannerActive: boolean;
  onCompare: () => void;
  onAddToCollection: (collectionId: string) => void;
  onCreateAndAddCollection: (name: string) => void;
  onAddToPlanner: () => void;
  onDeselectAll: () => void;
};

export default function StickyActions({
  selectedRecipeIds,
  collections,
  isPlannerActive,
  onCompare,
  onAddToCollection,
  onCreateAndAddCollection,
  onAddToPlanner,
  onDeselectAll,
}: StickyActionsProps) {
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const canCompare =
    selectedRecipeIds.length >= 2 && selectedRecipeIds.length <= 4;

  if (selectedRecipeIds.length === 0) return null;

  return (
    <div className="sticky-actions">
      {canCompare && !isPlannerActive && (
        <button className="compare-btn" onClick={onCompare}>
          ⚖️ Compare ({selectedRecipeIds.length})
        </button>
      )}
      {!isPlannerActive && (
        <div className="collection-picker-wrapper">
          <button
            className="add-collection-btn"
            onClick={() => setShowCollectionPicker((p) => !p)}
          >
            📁 Add to Collection
          </button>
          {showCollectionPicker && (
            <div className="collection-picker">
              {collections.length === 0 && (
                <p className="multiselect-empty">No collections yet</p>
              )}
              {collections.map((c) => (
                <button
                  key={c.id}
                  className="collection-picker-item"
                  onClick={() => {
                    onAddToCollection(c.id);
                    setShowCollectionPicker(false);
                  }}
                >
                  {c.name}
                </button>
              ))}
              <div className="collection-picker-new">
                <input
                  className="collection-picker-input"
                  type="text"
                  placeholder="New collection..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCollectionName.trim()) {
                      onCreateAndAddCollection(newCollectionName.trim());
                      setNewCollectionName("");
                      setShowCollectionPicker(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      <button className="add-planner-btn" onClick={onAddToPlanner}>
        📅 Add to Planner ({selectedRecipeIds.length})
      </button>
      <button className="deselect-btn" onClick={onDeselectAll}>
        ✕ Clear
      </button>
    </div>
  );
}
