"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { AuthUser } from "@/types";

type AuthContextType = {
  user: AuthUser | null;
  isAuthModalOpen: boolean;
  showNudgeModal: boolean;
  nudgeBannerDismissed: boolean;
  nudgeModalDismissed: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  handleAuthSuccess: (
    action: "signup" | "signin",
  ) => Promise<"signup" | "signin">; // ← Changed this line
  handleSignOut: () => Promise<void>;
  dismissNudgeBanner: () => void;
  dismissNudgeModal: () => void;
  setShowNudgeModal: (show: boolean) => void;
  refreshUserState: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [nudgeBannerDismissed, setNudgeBannerDismissed] = useState(true);
  const [nudgeModalDismissed, setNudgeModalDismissed] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Load nudge states from localStorage
    setNudgeBannerDismissed(
      localStorage.getItem("authNudgeBannerDismissed") === "true",
    );
    setNudgeModalDismissed(
      localStorage.getItem("authNudgeModalDismissed") === "true",
    );

    // Check for pending Google auth redirect
    const pendingAction = localStorage.getItem("pendingAuthAction");
    if (pendingAction) {
      localStorage.removeItem("pendingAuthAction");
      // Toast will be shown by the component using this context
    }

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? null,
          isAnonymous: session.user.is_anonymous ?? true,
        });
      } else {
        setUser(null);
      }
    });

    // Initialize session
    initSession();

    return () => subscription.unsubscribe();
  }, []);

  async function initSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
    } catch (err) {
      console.error("Session init failed:", err);
    }
  }

  const refreshUserState = useCallback(async () => {
    const {
      data: { user: updatedUser },
    } = await supabase.auth.getUser();
    if (updatedUser) {
      setUser({
        email: updatedUser.email ?? null,
        isAnonymous: updatedUser.is_anonymous ?? false,
      });
    }
  }, []);

  const handleAuthSuccess = useCallback(
    async (action: "signup" | "signin") => {
      setIsAuthModalOpen(false);
      await refreshUserState();
      // Return action so consuming component can show appropriate toast & refetch data
      return action;
    },
    [refreshUserState],
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    await supabase.auth.signInAnonymously();
    setUser(null);
    // Consuming component will handle data clearing & refetching
  }, []);

  const dismissNudgeBanner = useCallback(() => {
    setNudgeBannerDismissed(true);
    localStorage.setItem("authNudgeBannerDismissed", "true");
  }, []);

  const dismissNudgeModal = useCallback(() => {
    setShowNudgeModal(false);
    setNudgeModalDismissed(true);
    localStorage.setItem("authNudgeModalDismissed", "true");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        showNudgeModal,
        nudgeBannerDismissed,
        nudgeModalDismissed,
        setIsAuthModalOpen,
        handleAuthSuccess,
        handleSignOut,
        dismissNudgeBanner,
        dismissNudgeModal,
        setShowNudgeModal,
        refreshUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
