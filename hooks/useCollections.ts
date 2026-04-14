import { useContext } from "react";
import { CollectionsContext } from "@/app/providers/CollectionsProvider";

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within CollectionsProvider");
  }
  return context;
}
