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
  const [isGenerating, setIsGenerating] = useState(false);
  const [groceryIngredients, setGroceryIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [isGroceryOpen, setIsGroceryOpen] = useState(false);
  const [isGroceryMinimized, setIsGroceryMinimized] = useState(false);

  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

  const scheduledRecipeIds = new Set(Object.values(weekData).flat());

  function handleDragStart(recipeId: string, fromDay: string | null) {
    setIsDraggingId(recipeId);
    setIsDraggingFrom(fromDay);
  }

  function handleDrop(targetDay: string) {
    if (!isDraggingId) return;

    const newWeekData = { ...weekData };
    const newUnscheduled = [...unscheduled];

    // Remove from source
    if (isDraggingFrom === null) {
      const idx = newUnscheduled.indexOf(isDraggingId);
      if (idx > -1) newUnscheduled.splice(idx, 1);
    } else {
      newWeekData[isDraggingFrom] = (newWeekData[isDraggingFrom] || []).filter(
        (id) => id !== isDraggingId,
      );
    }

    // Add to target
    if (targetDay === "unscheduled") {
      if (!newUnscheduled.includes(isDraggingId))
        newUnscheduled.push(isDraggingId);
    } else {
      if (!newWeekData[targetDay]) newWeekData[targetDay] = [];
      if (!newWeekData[targetDay].includes(isDraggingId)) {
        newWeekData[targetDay].push(isDraggingId);
      }
    }

    setIsDraggingId(null);
    setIsDraggingFrom(null);
    setDragOverTarget(null);
    onWeekDataChange(newWeekData, newUnscheduled);
    savePlan(newWeekData, newUnscheduled);
  }

  function removeFromDay(recipeId: string, day: string) {
    const newWeekData = {
      ...weekData,
      [day]: (weekData[day] || []).filter((id) => id !== recipeId),
    };
    const newUnscheduled = [...unscheduled, recipeId];
    onWeekDataChange(newWeekData, newUnscheduled);
    savePlan(newWeekData, newUnscheduled);
  }

  function removeFromUnscheduled(recipeId: string) {
    const newUnscheduled = unscheduled.filter((id) => id !== recipeId);
    onWeekDataChange(weekData, newUnscheduled);
    savePlan(weekData, newUnscheduled);
  }

  async function clearPlanner() {
    onWeekDataChange({}, []);
    savePlan({}, []);
  }

  async function generateGroceryList() {
    const allScheduledRecipes = Object.values(weekData)
      .flat()
      .map((id) => recipeMap[id])
      .filter(Boolean);

    const allScheduledIngredients = allScheduledRecipes.flatMap((r) =>
      r.ingredients.map((ing: string) => `[${r.title}] ${ing}`),
    );

    setGroceryIngredients([]);
    setCheckedIngredients([]);
    setIsGroceryOpen(true);
    setIsGroceryMinimized(false);
    setIsGenerating(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers,
        body: JSON.stringify({ ingredients: allScheduledIngredients }),
      });
      const data = await res.json();
      if (data.ingredients) setGroceryIngredients(data.ingredients);
    } catch {
      setGroceryIngredients(allScheduledIngredients);
    }
    setIsGenerating(false);
  }

  function toggleIngredient(ingredient: string) {
    setCheckedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient],
    );
  }

  const hasScheduledRecipes = Object.values(weekData).some(
    (ids) => ids.length > 0,
  );

  return (
    <div className="meal-planner">
      <div className="planner-header">
        <div className="planner-actions">
          {hasScheduledRecipes && (
            <button
              className="planner-grocery-btn"
              onClick={generateGroceryList}
            >
              🛒 Grocery List for This Week
            </button>
          )}
          <button className="clear-planner-btn" onClick={clearPlanner}>
            Clear Planner
          </button>
        </div>
      </div>

      {unscheduled.length > 0 && (
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
                    onClick={() => removeFromUnscheduled(id)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unscheduled.length === 0 && !hasScheduledRecipes && (
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
                        onClick={() => removeFromDay(id, dayKey)}
                        aria-label="Remove"
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

      {isGroceryOpen && (
        <div
          className={`grocery-panel ${isGroceryMinimized ? "grocery-minimized" : ""}`}
        >
          <div
            className="grocery-panel-header"
            onClick={() => setIsGroceryMinimized((p) => !p)}
          >
            <span>
              🛒{" "}
              {isGenerating
                ? "Combining ingredients..."
                : `Grocery List (${groceryIngredients.length - checkedIngredients.length} remaining)`}
            </span>
            <button className="grocery-minimize-btn">
              {isGroceryMinimized ? "▲" : "▼"}
            </button>
          </div>
          {!isGroceryMinimized && (
            <div className="grocery-panel-body">
              <ul className="grocery-list">
                {groceryIngredients.map((ingredient, i) => {
                  const [main, breakdownPart] =
                    ingredient.split(" | breakdown: ");
                  const breakdown = breakdownPart
                    ? breakdownPart.split(", ")
                    : [];
                  return (
                    <li key={i} className="grocery-item">
                      <input
                        type="checkbox"
                        aria-label={`Have ${main}`}
                        checked={checkedIngredients.includes(ingredient)}
                        onChange={() => toggleIngredient(ingredient)}
                      />
                      <div>
                        <span
                          className={
                            checkedIngredients.includes(ingredient)
                              ? "grocery-checked"
                              : ""
                          }
                        >
                          {main}
                        </span>
                        {breakdown.length > 0 && (
                          <ul className="grocery-breakdown">
                            {breakdown.map((item, j) => (
                              <li key={j} className="grocery-breakdown-item">
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
