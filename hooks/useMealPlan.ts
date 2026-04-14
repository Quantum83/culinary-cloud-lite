import { useContext } from "react";
import { MealPlanContext } from "@/app/providers/MealPlanProvider";

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error("useMealPlan must be used within MealPlanProvider");
  }
  return context;
}
