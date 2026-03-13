"use client";

import { useState, useEffect, useRef } from "react";

type ThemeVars = {
  bg: string;
  primary: string;
  accent: string;
  gold: string;
};

type SettingsSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LIGHT_PRESETS: { name: string; vars: ThemeVars }[] = [
  {
    name: "Warm Cream",
    vars: {
      bg: "#fdf6ee",
      primary: "#5e445a",
      accent: "#dc7243",
      gold: "#dd9d5b",
    },
  },
  {
    name: "Sage",
    vars: {
      bg: "#f0f4ef",
      primary: "#3a5a40",
      accent: "#6a9e6f",
      gold: "#a0b87a",
    },
  },
  {
    name: "Lavender",
    vars: {
      bg: "#f3f0f9",
      primary: "#4a3f6b",
      accent: "#7c6baa",
      gold: "#b49fcc",
    },
  },
  {
    name: "Rose",
    vars: {
      bg: "#fdf0f2",
      primary: "#7a3048",
      accent: "#c4637a",
      gold: "#d4956a",
    },
  },
];

const DARK_PRESETS: { name: string; vars: ThemeVars }[] = [
  {
    name: "Blue Night",
    vars: {
      bg: "#2D3250",
      primary: "#F6B17A",
      accent: "#F6B17A",
      gold: "#E8B06A",
    },
  },
  {
    name: "Deep Plum",
    vars: {
      bg: "#1e1518",
      primary: "#c9a8c0",
      accent: "#e8855a",
      gold: "#e8b06a",
    },
  },
  {
    name: "Forest",
    vars: {
      bg: "#1a2420",
      primary: "#7ec8a0",
      accent: "#5aaa78",
      gold: "#a8c870",
    },
  },
  {
    name: "Espresso",
    vars: {
      bg: "#322C2B",
      primary: "#E4C59E",
      accent: "#AF8260",
      gold: "#c4a060",
    },
  },
];

const STORAGE_KEY_LIGHT = "themeLight";
const STORAGE_KEY_DARK = "themeDark";

export function applyThemeVars(vars: ThemeVars) {
  const root = document.documentElement;
  root.style.setProperty("--bg", vars.bg);
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--accent", vars.accent);
  root.style.setProperty("--gold", vars.gold);
}

function SwatchColor({ color }: { color: string }) {
  return (
    <span
      className="swatch-color"
      style={{ "--swatch-color": color } as React.CSSProperties}
    />
  );
}

function ThemeSection({
  title,
  presets,
  storageKey,
  isActive,
}: {
  title: string;
  presets: typeof LIGHT_PRESETS;
  storageKey: string;
  isActive: boolean;
}) {
  const [vars, setVars] = useState<ThemeVars>(presets[0].vars);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setVars(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  function update(key: keyof ThemeVars, value: string) {
    const newVars = { ...vars, [key]: value };
    setVars(newVars);
    localStorage.setItem(storageKey, JSON.stringify(newVars));
    if (isActive) applyThemeVars(newVars);
  }

  function applyPreset(preset: ThemeVars) {
    setVars(preset);
    localStorage.setItem(storageKey, JSON.stringify(preset));
    if (isActive) applyThemeVars(preset);
  }

  const fields: { key: keyof ThemeVars; label: string }[] = [
    { key: "bg", label: "Background" },
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "gold", label: "Gold" },
  ];

  return (
    <div className={`theme-section ${isActive ? "theme-section-active" : ""}`}>
      <p className="theme-section-title">
        {title}
        {isActive && <span className="theme-active-badge">Active</span>}
      </p>
      <div className="theme-presets">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className="theme-preset-swatch"
            onClick={() => applyPreset(preset.vars)}
            title={preset.name}
            aria-label={`Apply ${preset.name} preset`}
          >
            <SwatchColor color={preset.vars.bg} />
            <SwatchColor color={preset.vars.primary} />
            <SwatchColor color={preset.vars.accent} />
            <SwatchColor color={preset.vars.gold} />
          </button>
        ))}
      </div>
      <div className="theme-inputs">
        {fields.map(({ key, label }) => (
          <div key={key} className="theme-input-row">
            <label
              htmlFor={`${storageKey}-${key}`}
              className="theme-input-label"
            >
              {label}
            </label>
            <div className="theme-input-wrapper">
              <span
                className="theme-color-dot"
                style={{ "--dot-color": vars[key] } as React.CSSProperties}
              />
              <input
                id={`${storageKey}-${key}`}
                className="theme-hex-input"
                type="text"
                value={vars[key]}
                onChange={(e) => update(key, e.target.value)}
                maxLength={7}
                spellCheck={false}
                aria-label={`${label} hex color`}
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsSidebar({
  isOpen,
  onClose,
}: SettingsSidebarProps) {
  const [isDark, setIsDark] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="settings-overlay"
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        aria-hidden="true"
      />
      <aside className="settings-sidebar" aria-label="Theme settings">
        <div className="settings-header">
          <p className="settings-title">Theme Settings</p>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        <div className="settings-body">
          <ThemeSection
            title="Light Theme"
            presets={LIGHT_PRESETS}
            storageKey={STORAGE_KEY_LIGHT}
            isActive={!isDark}
          />
          <ThemeSection
            title="Dark Theme"
            presets={DARK_PRESETS}
            storageKey={STORAGE_KEY_DARK}
            isActive={isDark}
          />
        </div>
      </aside>
    </>
  );
}
