"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthHeaders } from "@/lib/supabase";

const PRESET_TAGS = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
  "vegetarian",
  "vegan",
  "quick",
  "baking",
  "healthy",
  "comfort food",
  "italian",
  "mexican",
  "asian",
  "american",
  "chocolate",
  "cookies",
  "cake",
  "soup",
  "salad",
  "pasta",
];

type TagInputProps = {
  recipeId: string;
  currentTags: string[];
  allTags: string[];
  onTagsUpdated: (id: string, tags: string[]) => void;
};

export default function TagInput({
  recipeId,
  currentTags,
  allTags,
  onTagsUpdated,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = Array.from(new Set([...PRESET_TAGS, ...allTags]))
    .filter((t) => !currentTags.includes(t))
    .filter(
      (t) => input === "" || t.toLowerCase().includes(input.toLowerCase()),
    );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function addTag(tag: string) {
    const newTag = tag.trim().toLowerCase();
    if (!newTag || currentTags.includes(newTag)) return;
    const newTags = [...currentTags, newTag];
    onTagsUpdated(recipeId, newTags);
    const headers = await getAuthHeaders();
    await fetch("/api/recipes", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: recipeId, tags: newTags }),
    });
    setInput("");
    setIsOpen(false);
  }

  async function removeTag(tag: string) {
    const newTags = currentTags.filter((t) => t !== tag);
    onTagsUpdated(recipeId, newTags);
    const headers = await getAuthHeaders();
    await fetch("/api/recipes", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: recipeId, tags: newTags }),
    });
  }

  return (
    <div className="recipe-tags" ref={wrapperRef}>
      {currentTags.map((tag) => (
        <span
          key={tag}
          className="recipe-tag"
          onClick={() => removeTag(tag)}
          title="Click to remove"
        >
          {tag}
        </span>
      ))}
      <div className="tag-input-wrapper">
        <input
          className="tag-input"
          type="text"
          placeholder="add tag"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === "Escape") setIsOpen(false);
          }}
        />
        <button
          className="tag-add-btn"
          onClick={() => addTag(input)}
          aria-label="Add tag"
        >
          +
        </button>
        {isOpen && suggestions.length > 0 && (
          <div className="tag-dropdown">
            {suggestions.slice(0, 8).map((tag) => (
              <button
                key={tag}
                className="tag-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
