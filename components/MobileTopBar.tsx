"use client";

import type { AuthUser } from "@/types";

type MobileTopBarProps = {
  onMenuOpen: () => void;
  onAuthClick: () => void;
  user: AuthUser | null;
  isDark: boolean;
};

export default function MobileTopBar({
  onMenuOpen,
  onAuthClick,
  user,
  isDark,
}: MobileTopBarProps) {
  return (
    <div className="mobile-top-bar">
      <button
        className="mobile-menu-btn"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className="mobile-top-bar-title">Culinary Cloud</h1>

      <button
        className="mobile-account-btn"
        onClick={onAuthClick}
        aria-label={user && !user.isAnonymous ? "Account" : "Sign in"}
      >
        {user && !user.isAnonymous ? (
          <div className="mobile-account-avatar">
            {user.email ? user.email[0].toUpperCase() : "?"}
          </div>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>
    </div>
  );
}
