"use client";

import { useRef } from "react";
import RecipeCard from "./RecipeCard";
import type { Recipe } from "@/types";

type RecipeDetailModalProps = {
  recipe: Recipe;
  isSelected: boolean;
  allTags: string[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTagsUpdated: (id: string, tags: string[]) => void;
  onNotesSaved: (id: string, notes: string) => void;
};

export default function RecipeDetailModal({
  recipe,
  isSelected,
  allTags,
  onClose,
  onSelect,
  onDelete,
  onTagsUpdated,
  onNotesSaved,
}: RecipeDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="modal recipe-detail-modal">
        <div className="modal-header">
          <h2 className="modal-title">Recipe Details</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <RecipeCard
            recipe={recipe}
            isSelected={isSelected}
            allTags={allTags}
            onSelect={onSelect}
            onDelete={(id) => {
              onDelete(id);
              onClose();
            }}
            onTagsUpdated={onTagsUpdated}
            onNotesSaved={onNotesSaved}
          />
        </div>
      </div>
    </div>
  );
}
