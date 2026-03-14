"use client";

import { useState } from "react";
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

  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

  function handleDragStart(recipeId: string, fromDay: string | null) {
    setIsDraggingId(recipeId);
    setIsDraggingFrom(fromDay);
  }

  function handleDrop(targetDay: string) {
    if (!isDraggingId) return;

    const newWeekData = { ...weekData };
    const newUnscheduled = [...unscheduled];

    if (isDraggingFrom === null) {
      const idx = newUnscheduled.indexOf(isDraggingId);
      if (idx > -1) newUnscheduled.splice(idx, 1);
    } else {
      newWeekData[isDraggingFrom] = (newWeekData[isDraggingFrom] || []).filter(
        (id) => id !== isDraggingId,
      );
    }

    if (targetDay === "unscheduled") {
      if (!newUnscheduled.includes(isDraggingId))
        newUnscheduled.push(isDraggingId);
    } else {
      if (!newWeekData[targetDay]) newWeekData[targetDay] = [];
      if (!newWeekData[targetDay].includes(isDraggingId))
        newWeekData[targetDay].push(isDraggingId);
    }

    setIsDraggingId(null);
    setIsDraggingFrom(null);
    setDragOverTarget(null);
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
                  onClick={() => removeFromPlanner(id)}
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
                        onClick={() => removeFromPlanner(id)}
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
