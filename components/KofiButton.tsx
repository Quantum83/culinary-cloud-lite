"use client";

import { useState } from "react";

export default function KofiButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="kofi-floating-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Support on Ko-fi"
        title="Buy me a coffee"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M6 13c0 3.5 2.5 6 6 6s6-2.5 6-6v-2H6v2z" fill="#fff" />
          <path
            d="M18 8h1.5a2.5 2.5 0 0 1 0 5H18"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 8h14v3c0 3.87-3.13 7-7 7s-7-3.13-7-7V8z"
            stroke="#fff"
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M9 4c0 1 .5 2 2 2s2-1 2-2"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="kofi-overlay" onClick={() => setIsOpen(false)}>
          <div className="kofi-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="kofi-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <iframe
              src="https://ko-fi.com/baszak/?hidefeed=true&widget=true&embed=true&preview=true"
              style={{
                border: "none",
                width: "100%",
                padding: "4px",
                background: "#f9f9f9",
                borderRadius: "12px",
              }}
              height="712"
              title="Support on Ko-fi"
            />
          </div>
        </div>
      )}
    </>
  );
}
