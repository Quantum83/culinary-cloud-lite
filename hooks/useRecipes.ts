import { useContext } from "react";
import { RecipesContext } from "@/app/providers/RecipesProvider";

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error("useRecipes must be used within RecipesProvider");
  }
  return context;
}
