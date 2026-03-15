"use client";

import { useRef } from "react";
import RecipeCard from "./RecipeCard";

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
