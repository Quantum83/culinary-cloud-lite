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
    name: "Warm Neutral",
    vars: {
      bg: "#F9F8F6",
      primary: "#415E72",
      accent: "#B77466",
      gold: "#D1A980",
    },
  },
  {
    name: "Sage Garden",
    vars: {
      bg: "#F7F4EA",
      primary: "#748873",
      accent: "#B87C4C",
      gold: "#D1A980",
    },
  },
  {
    name: "Dusty Rose",
    vars: {
      bg: "#F3F4F4",
      primary: "#853953",
      accent: "#B77466",
      gold: "#D6A99D",
    },
  },
];

const DARK_PRESETS: { name: string; vars: ThemeVars }[] = [
  {
    name: "Deep Ocean",
    vars: {
      bg: "#17313E",
      primary: "#9BB4C0",
      accent: "#86B0BD",
      gold: "#E1D0B3",
    },
  },
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
    name: "Forest Night",
    vars: {
      bg: "#2C2C2C",
      primary: "#A8BBA3",
      accent: "#748873",
      gold: "#ECE7D1",
    },
  },
  {
    name: "Dark Plum",
    vars: {
      bg: "#612D53",
      primary: "#C5B0CD",
      accent: "#D6A99D",
      gold: "#FFE1AF",
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
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedVars = JSON.parse(saved);
        setVars(savedVars);
        const match = presets.find(
          (p) =>
            p.vars.bg === savedVars.bg &&
            p.vars.primary === savedVars.primary &&
            p.vars.accent === savedVars.accent &&
            p.vars.gold === savedVars.gold,
        );
        setSelectedPreset(match?.name ?? null);
      }
    } catch {}
  }, [storageKey]);

  function update(key: keyof ThemeVars, value: string) {
    const newVars = { ...vars, [key]: value };
    setVars(newVars);
    setSelectedPreset(null);
    localStorage.setItem(storageKey, JSON.stringify(newVars));
    if (isActive) applyThemeVars(newVars);
  }

  function applyPreset(preset: ThemeVars, name: string) {
    setVars(preset);
    setSelectedPreset(name);
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
        {selectedPreset && (
          <span className="theme-preset-name">{selectedPreset}</span>
        )}
      </p>
      <div className="theme-presets">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className={`theme-preset-swatch ${selectedPreset === preset.name ? "selected" : ""}`}
            onClick={() => applyPreset(preset.vars, preset.name)}
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
  const [autoTagging, setAutoTagging] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("autoTagging") !== "false";
  });
  const [youtubeExtraction, setYoutubeExtraction] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("youtubeExtraction") !== "false";
  });
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
          <p className="settings-title">Settings</p>
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
          <div className="theme-section">
            <p className="theme-section-title">Features</p>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Auto-tagging</span>
              <button
                className={`settings-toggle-btn ${autoTagging ? "on" : "off"}`}
                onClick={() => {
                  const next = !autoTagging;
                  setAutoTagging(next);
                  localStorage.setItem("autoTagging", String(next));
                }}
                aria-label="Toggle auto-tagging"
              >
                {autoTagging ? "ON" : "OFF"}
              </button>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">
                  YouTube extraction
                </span>
                <button
                  className={`settings-toggle-btn ${youtubeExtraction ? "on" : "off"}`}
                  onClick={() => {
                    const next = !youtubeExtraction;
                    setYoutubeExtraction(next);
                    localStorage.setItem("youtubeExtraction", String(next));
                  }}
                  aria-label="Toggle YouTube extraction"
                >
                  {youtubeExtraction ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
