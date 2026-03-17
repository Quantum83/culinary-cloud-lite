"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, getAuthHeaders } from "@/lib/supabase";

type AuthModalProps = {
  isAnonymous: boolean;
  onClose: () => void;
  onAuthSuccess: (action: "signup" | "signin") => void;
};

export default function AuthModal({
  isAnonymous,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "signup" && isAnonymous) {
        // Convert anonymous user via admin API
        const headers = await getAuthHeaders();
        const res = await fetch("/api/auth/convert", {
          method: "POST",
          headers,
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create account");

        // Sign in with new credentials to refresh session
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        onAuthSuccess("signup");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess("signin");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setIsLoading(false);
  }

  async function handleGoogleAuth() {
    setIsLoading(true);
    setError("");

    try {
      localStorage.setItem(
        "pendingAuthAction",
        mode === "signup" ? "signup" : "signin",
      );

      if (mode === "signup" && isAnonymous) {
        const { error } = await supabase.auth.linkIdentity({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      localStorage.removeItem("pendingAuthAction");
      setError(err.message || "Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal auth-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body auth-modal-body">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Sign Up
            </button>
            <button
              className={`auth-tab ${mode === "signin" ? "active" : ""}`}
              onClick={() => {
                setMode("signin");
                setError("");
              }}
            >
              Sign In
            </button>
          </div>

          <button
            className="google-auth-btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleEmailAuth}>
            <div className="auth-field">
              <label className="form-label">Email</label>
              <input
                className="form-input auth-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="form-label">Password</label>
              <input
                className="form-input auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {mode === "signup" && (
                <p className="auth-password-hint">Minimum 6 characters</p>
              )}
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button
              className="submit-btn auth-submit-btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <p className="auth-reassurance">
            {mode === "signup"
              ? "✓ Your existing recipes will be preserved. An account lets you access them on any device."
              : "Sign in to access your saved recipes on this device."}
          </p>
        </div>
      </div>
    </div>
  );
}
