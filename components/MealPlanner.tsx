"use client";

import { useState, useRef } from "react";
import { getAuthHeaders } from "@/lib/supabase";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  source_url: string;
  ingredients: string[];
};

type WeekData = Record<string, string[]>;

type MealPlannerProps = {
  recipes: Recipe[];
  weekData: WeekData;
  unscheduled: string[];
  onWeekDataChange: (weekData: WeekData, unscheduled: string[]) => void;
};

async function savePlan(weekData: WeekData, unscheduled: string[]) {
  const headers = await getAuthHeaders();
  await fetch("/api/meal-plan", {
    method: "POST",
    headers,
    body: JSON.stringify({ week_data: weekData, unscheduled }),
  });
}

export default function MealPlanner({
  recipes,
  weekData,
  unscheduled,
  onWeekDataChange,
}: MealPlannerProps) {
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const [isDraggingFrom, setIsDraggingFrom] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Touch drag state
  const touchDragId = useRef<string | null>(null);
  const touchDragFrom = useRef<string | null>(null);
  const touchGhost = useRef<HTMLElement | null>(null);
  const autoScrollRef = useRef<number | null>(null);

  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

  // ── Mouse/Desktop drag handlers ──
  function handleDragStart(recipeId: string, fromDay: string | null) {
    setIsDraggingId(recipeId);
    setIsDraggingFrom(fromDay);
  }

  function handleDrop(targetDay: string) {
    if (!isDraggingId) return;
    performMove(isDraggingId, isDraggingFrom, targetDay);
    setIsDraggingId(null);
    setIsDraggingFrom(null);
    setDragOverTarget(null);
  }

  // ── Touch drag handlers ──
  function handleTouchStart(
    e: React.TouchEvent,
    recipeId: string,
    fromDay: string | null,
  ) {
    touchDragId.current = recipeId;
    touchDragFrom.current = fromDay;
    setIsDraggingId(recipeId);

    // Create ghost element
    const el = e.currentTarget as HTMLElement;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.8";
    ghost.style.zIndex = "9999";
    ghost.style.width = el.offsetWidth + "px";
    ghost.style.transform = "scale(1.05)";
    ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
    ghost.style.borderRadius = "8px";
    const touch = e.touches[0];
    ghost.style.left = touch.clientX - el.offsetWidth / 2 + "px";
    ghost.style.top = touch.clientY - el.offsetHeight / 2 + "px";
    document.body.appendChild(ghost);
    touchGhost.current = ghost;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchDragId.current || !touchGhost.current) return;

    const touch = e.touches[0];
    const ghost = touchGhost.current;
    const el = e.currentTarget as HTMLElement;
    ghost.style.left = touch.clientX - el.offsetWidth / 2 + "px";
    ghost.style.top = touch.clientY - el.offsetHeight / 2 + "px";

    // Find drop zone
    ghost.style.display = "none";
    const elementBelow = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    ghost.style.display = "";
    const dropZone = elementBelow?.closest("[data-dropzone]") as HTMLElement;
    if (dropZone) {
      setDragOverTarget(dropZone.dataset.dropzone || null);
    } else {
      setDragOverTarget(null);
    }

    // Auto-scroll when near edges
    const scrollZone = 80; // px from edge to trigger scroll
    const scrollSpeed = 8;
    const viewportHeight = window.innerHeight;

    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }

    if (touch.clientY > viewportHeight - scrollZone) {
      // Near bottom — scroll down
      const intensity =
        (touch.clientY - (viewportHeight - scrollZone)) / scrollZone;
      const scroll = () => {
        window.scrollBy(0, scrollSpeed * intensity);
        autoScrollRef.current = requestAnimationFrame(scroll);
      };
      autoScrollRef.current = requestAnimationFrame(scroll);
    } else if (touch.clientY < scrollZone) {
      // Near top — scroll up
      const intensity = (scrollZone - touch.clientY) / scrollZone;
      const scroll = () => {
        window.scrollBy(0, -scrollSpeed * intensity);
        autoScrollRef.current = requestAnimationFrame(scroll);
      };
      autoScrollRef.current = requestAnimationFrame(scroll);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Cancel auto-scroll
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }

    if (!touchDragId.current) return;

    // Remove ghost
    if (touchGhost.current) {
      document.body.removeChild(touchGhost.current);
      touchGhost.current = null;
    }

    const touch = e.changedTouches[0];

    // Find drop zone
    const elementBelow = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    const dropZone = elementBelow?.closest("[data-dropzone]") as HTMLElement;

    if (dropZone?.dataset.dropzone) {
      performMove(
        touchDragId.current,
        touchDragFrom.current,
        dropZone.dataset.dropzone,
      );
    }

    touchDragId.current = null;
    touchDragFrom.current = null;
    setIsDraggingId(null);
    setDragOverTarget(null);
  }

  // ── Shared move logic ──
  function performMove(
    recipeId: string,
    fromDay: string | null,
    targetDay: string,
  ) {
    const newWeekData = { ...weekData };
    const newUnscheduled = [...unscheduled];

    if (fromDay === null) {
      const idx = newUnscheduled.indexOf(recipeId);
      if (idx > -1) newUnscheduled.splice(idx, 1);
    } else {
      newWeekData[fromDay] = (newWeekData[fromDay] || []).filter(
        (id) => id !== recipeId,
      );
    }

    if (targetDay === "unscheduled") {
      if (!newUnscheduled.includes(recipeId)) newUnscheduled.push(recipeId);
    } else {
      if (!newWeekData[targetDay]) newWeekData[targetDay] = [];
      if (!newWeekData[targetDay].includes(recipeId))
        newWeekData[targetDay].push(recipeId);
    }

    onWeekDataChange(newWeekData, newUnscheduled);
    savePlan(newWeekData, newUnscheduled);
  }

  function removeFromPlanner(recipeId: string) {
    const newWeekData = { ...weekData };
    for (const day of Object.keys(newWeekData)) {
      newWeekData[day] = newWeekData[day].filter((id) => id !== recipeId);
    }
    const newUnscheduled = unscheduled.filter((id) => id !== recipeId);
    onWeekDataChange(newWeekData, newUnscheduled);
    savePlan(newWeekData, newUnscheduled);
  }

  async function clearPlanner() {
    onWeekDataChange({}, []);
    savePlan({}, []);
  }

  const hasAnyRecipes =
    unscheduled.length > 0 ||
    Object.values(weekData).some((ids) => ids.length > 0);

  return (
    <div className="meal-planner">
      <div className="planner-header">
        <div className="planner-actions">
          <button className="clear-planner-btn" onClick={clearPlanner}>
            Clear Planner
          </button>
        </div>
      </div>

      <div
        className={`unscheduled-pool ${dragOverTarget === "unscheduled" ? "drag-over" : ""}`}
        data-dropzone="unscheduled"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverTarget("unscheduled");
        }}
        onDragLeave={() => setDragOverTarget(null)}
        onDrop={() => handleDrop("unscheduled")}
      >
        <p className="pool-label">Unscheduled — drag to a day</p>
        <div className="pool-recipes">
          {unscheduled.map((id) => {
            const recipe = recipeMap[id];
            if (!recipe) return null;
            return (
              <div
                key={id}
                className={`planner-recipe-chip ${isDraggingId === id ? "dragging" : ""}`}
                draggable
                onDragStart={() => handleDragStart(id, null)}
                onDragEnd={() => {
                  setIsDraggingId(null);
                  setIsDraggingFrom(null);
                }}
                onTouchStart={(e) => handleTouchStart(e, id, null)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="chip-image"
                  />
                )}
                <span className="chip-title">{recipe.title}</span>
                <button
                  className="chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlanner(id);
                  }}
                  aria-label="Remove from planner"
                >
                  ×
                </button>
              </div>
            );
          })}
          {unscheduled.length === 0 && (
            <p className="pool-empty">
              Drag scheduled recipes here to unschedule
            </p>
          )}
        </div>
      </div>

      {!hasAnyRecipes && (
        <div className="planner-empty">
          <p>No recipes in your planner yet.</p>
          <p>
            Check some recipes and click <strong>Add to Planner</strong> to get
            started.
          </p>
        </div>
      )}

      <div className="week-grid">
        {DAYS.map((day) => {
          const dayKey = day.toLowerCase();
          const dayRecipeIds = weekData[dayKey] || [];
          const isDragTarget = dragOverTarget === dayKey;

          return (
            <div
              key={day}
              className={`day-column ${isDragTarget ? "drag-over" : ""}`}
              data-dropzone={dayKey}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTarget(dayKey);
              }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={() => handleDrop(dayKey)}
            >
              <p className="day-label">{day}</p>
              <div className="day-recipes">
                {dayRecipeIds.map((id) => {
                  const recipe = recipeMap[id];
                  if (!recipe) return null;
                  return (
                    <div
                      key={id}
                      className={`planner-recipe-chip ${isDraggingId === id ? "dragging" : ""}`}
                      draggable
                      onDragStart={() => handleDragStart(id, dayKey)}
                      onDragEnd={() => {
                        setIsDraggingId(null);
                        setIsDraggingFrom(null);
                      }}
                      onTouchStart={(e) => handleTouchStart(e, id, dayKey)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="chip-image"
                        />
                      )}
                      <span className="chip-title">{recipe.title}</span>
                      <button
                        className="chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlanner(id);
                        }}
                        aria-label="Remove from planner"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {dayRecipeIds.length === 0 && (
                  <p className="day-empty">Drop here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
