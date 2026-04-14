"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getAuthHeaders } from "@/lib/supabase";
import type { WeekData } from "@/types";

type MealPlanContextType = {
  weekData: WeekData;
  unscheduled: string[];
  fetchMealPlan: () => Promise<void>;
  saveMealPlan: (
    newWeekData: WeekData,
    newUnscheduled: string[],
  ) => Promise<void>;
  updateWeekData: (newWeekData: WeekData, newUnscheduled: string[]) => void;
  addToUnscheduled: (recipeIds: string[]) => void;
  clearMealPlan: () => Promise<void>;
  setWeekData: React.Dispatch<React.SetStateAction<WeekData>>;
  setUnscheduled: React.Dispatch<React.SetStateAction<string[]>>;
};

export const MealPlanContext = createContext<MealPlanContextType | null>(null);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [weekData, setWeekData] = useState<WeekData>({});
  const [unscheduled, setUnscheduled] = useState<string[]>([]);

  const fetchMealPlan = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/meal-plan", { headers });
      const data = await res.json();
      if (data.week_data) setWeekData(data.week_data);
      if (data.unscheduled) setUnscheduled(data.unscheduled);
    } catch (err) {
      console.error("Failed to fetch meal plan:", err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  const saveMealPlan = useCallback(
    async (newWeekData: WeekData, newUnscheduled: string[]) => {
      try {
        const headers = await getAuthHeaders();
        await fetch("/api/meal-plan", {
          method: "POST",
          headers,
          body: JSON.stringify({
            week_data: newWeekData,
            unscheduled: newUnscheduled,
          }),
        });
        setWeekData(newWeekData);
        setUnscheduled(newUnscheduled);
      } catch (err) {
        console.error("Failed to save meal plan:", err);
      }
    },
    [],
  );

  const updateWeekData = useCallback(
    (newWeekData: WeekData, newUnscheduled: string[]) => {
      setWeekData(newWeekData);
      setUnscheduled(newUnscheduled);
    },
    [],
  );

  const addToUnscheduled = useCallback(
    (recipeIds: string[]) => {
      setUnscheduled((prev) => {
        const newUnscheduled = Array.from(new Set([...prev, ...recipeIds]));
        // Auto-save to backend
        getAuthHeaders().then((headers) => {
          fetch("/api/meal-plan", {
            method: "POST",
            headers,
            body: JSON.stringify({
              week_data: weekData,
              unscheduled: newUnscheduled,
            }),
          });
        });
        return newUnscheduled;
      });
    },
    [weekData],
  );

  const clearMealPlan = useCallback(async () => {
    const emptyWeekData: WeekData = {};
    const emptyUnscheduled: string[] = [];

    try {
      const headers = await getAuthHeaders();
      await fetch("/api/meal-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          week_data: emptyWeekData,
          unscheduled: emptyUnscheduled,
        }),
      });
      setWeekData(emptyWeekData);
      setUnscheduled(emptyUnscheduled);
    } catch (err) {
      console.error("Failed to clear meal plan:", err);
    }
  }, []);

  return (
    <MealPlanContext.Provider
      value={{
        weekData,
        unscheduled,
        fetchMealPlan,
        saveMealPlan,
        updateWeekData,
        addToUnscheduled,
        clearMealPlan,
        setWeekData,
        setUnscheduled,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  );
}
