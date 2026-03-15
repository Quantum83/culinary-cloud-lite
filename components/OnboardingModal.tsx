"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "onboardingComplete";

function AppPreviewAnimation() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`ob-animation ob-app-preview ${visible ? "ob-visible" : ""}`}
    >
      <div className="ob-app-layout-mini">
        <div className="ob-sidebar-mini">
          <div className="ob-sidebar-label-mini">COLLECTIONS</div>
          <div className="ob-sidebar-item active">📚 All Recipes</div>
          <div className="ob-sidebar-item">📁 Dinners</div>
          <div className="ob-sidebar-item">📁 Desserts</div>
          <div className="ob-sidebar-divider" />
          <div className="ob-sidebar-item">📅 Meal Planner</div>
          <div className="ob-sidebar-item">🛒 Grocery List</div>
        </div>
        <div className="ob-main-mini">
          <div className="ob-save-bar-mini">
            <div className="ob-save-input-mini">
              https://example-website.com/recipe...
            </div>
            <div className="ob-save-btn-mini">Save</div>
          </div>
          <div className="ob-cards-mini">
            {[
              {
                emoji: "🍪",
                title: "Chocolate Chip Cookies",
                tags: ["cookies", "baking"],
              },
              {
                emoji: "🍝",
                title: "Spaghetti Carbonara",
                tags: ["pasta", "dinner"],
              },
            ].map((card, i) => (
              <div key={i} className="ob-card-mini-full">
                <div className="ob-card-mini-image">{card.emoji}</div>
                <div className="ob-card-mini-body">
                  <div className="ob-card-mini-title">{card.title}</div>
                  <div className="ob-card-mini-tags">
                    {card.tags.map((t) => (
                      <span key={t} className="ob-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UrlAnimation() {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; color: string; angle: number }[]
  >([]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => {
      setPhase(3);
      setParticles(
        Array.from({ length: 16 }, (_, i) => ({
          id: i,
          x: 50 + Math.random() * 20 - 10,
          y: 60 + Math.random() * 10 - 5,
          color: ["#dc7243", "#dd9d5b", "#5e445a", "#a65a6e", "#4e6646"][
            Math.floor(Math.random() * 5)
          ],
          angle: (i / 16) * 360,
        })),
      );
    }, 2000);
    const t4 = setTimeout(() => setParticles([]), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="ob-animation ob-url-animation">
      <div className={`ob-url-bar ${phase >= 1 ? "ob-typing" : ""}`}>
        <div className="ob-url-icon">🔗</div>
        <div className="ob-url-text">
          {phase >= 1 && (
            <span className="ob-typewriter">
              https://example-website.com/chocolate-chip-cookies
            </span>
          )}
        </div>
        {phase >= 2 && <div className="ob-url-check">✓</div>}
      </div>
      <div className={`ob-arrow-down ${phase >= 2 ? "ob-visible" : ""}`}>↓</div>
      <div
        className={`ob-recipe-card-mini ${phase >= 3 ? "ob-pop-in" : ""}`}
        style={{ position: "relative" }}
      >
        <div className="ob-card-image-full">
          <span style={{ fontSize: 32 }}>🍪</span>
        </div>
        <div className="ob-card-below">
          <div className="ob-card-tags" style={{ marginBottom: 4 }}>
            <span className="ob-tag">🍪 cookies</span>
            <span className="ob-tag">🍫 chocolate</span>
            <span className="ob-tag">🧁 baking</span>
          </div>
          <div className="ob-card-title">Chocolate Chip Cookies</div>
          <div className="ob-card-meta">
            ⏱ 15 min &nbsp;🔥 12 min &nbsp;🍽 24 cookies
          </div>
        </div>
        {particles.map((p) => (
          <div
            key={p.id}
            className="ob-particle"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: p.color,
                "--angle": `${p.angle}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

function ViewsAnimation() {
  const [activeView, setActiveView] = useState(0);
  const views = ["Scroll", "List", "Grid"];

  useEffect(() => {
    const interval = setInterval(() => setActiveView((v) => (v + 1) % 3), 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ob-animation ob-views-animation">
      <div className="ob-view-tabs">
        {views.map((v, i) => (
          <div
            key={v}
            className={`ob-view-tab ${activeView === i ? "active" : ""}`}
          >
            {v}
          </div>
        ))}
      </div>
      <div className="ob-view-preview">
        {activeView === 0 && (
          <div className="ob-scroll-preview">
            {[
              { e: "🍪", t: "Chocolate Chip Cookies" },
              { e: "🍝", t: "Spaghetti Carbonara" },
            ].map((r, i) => (
              <div key={i} className="ob-scroll-card-full">
                <div className="ob-scroll-card-image">{r.e}</div>
                <div className="ob-scroll-card-body">
                  <div className="ob-card-tag-row">
                    <span className="ob-tag">baking</span>
                    <span className="ob-tag">dessert</span>
                  </div>
                  <div className="ob-scroll-card-title">{r.t}</div>
                  <div className="ob-scroll-card-meta">
                    ⏱ 15 min &nbsp;🍽 24 servings
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeView === 1 && (
          <div className="ob-list-preview">
            {[
              { e: "🍪", t: "Chocolate Chip Cookies" },
              { e: "🍝", t: "Spaghetti Carbonara" },
              { e: "🥗", t: "Caesar Salad" },
              { e: "🍲", t: "Chicken Soup" },
            ].map((r, i) => (
              <div key={i} className="ob-list-row-mini">
                <div
                  className="ob-mini-thumb"
                  style={{
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {r.e}
                </div>
                <div className="ob-line ob-line-title" style={{ flex: 1 }} />
                <div className="ob-mini-tag" />
              </div>
            ))}
          </div>
        )}
        {activeView === 2 && (
          <div className="ob-grid-preview">
            {[{ e: "🍪" }, { e: "🍝" }, { e: "🥗" }, { e: "🍲" }].map(
              (r, i) => (
                <div key={i} className="ob-grid-card-mini">
                  <div
                    className="ob-mini-image-sq"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {r.e}
                  </div>
                  <div
                    className="ob-line ob-line-short"
                    style={{ margin: "6px 8px 4px" }}
                  />
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionsAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPhase((p) => (p + 1) % 5), 1000);
    return () => clearInterval(interval);
  }, []);

  const recipes = [
    { e: "🍪", t: "Cookies", col: "Desserts" },
    { e: "🍝", t: "Pasta", col: "Dinners" },
    { e: "🎂", t: "Birthday Cake", col: "Desserts" },
    { e: "🍲", t: "Chicken Soup", col: "Dinners" },
  ];

  return (
    <div className="ob-animation ob-collections-animation">
      <div className="ob-collections-layout">
        <div className="ob-recipe-cards-col">
          {recipes.map((r, i) => (
            <div
              key={r.t}
              className={`ob-recipe-card-chip ${phase === i ? "ob-chip-moving" : phase > i ? "ob-chip-done" : ""}`}
            >
              <span className="ob-chip-emoji">{r.e}</span>
              <span className="ob-chip-text">{r.t}</span>
            </div>
          ))}
        </div>
        <div className="ob-arrow-right">→</div>
        <div className="ob-collection-folders">
          {["Dinners", "Desserts"].map((c) => (
            <div key={c} className="ob-folder">
              <span>📁</span>
              <span>{c}</span>
              <span className="ob-folder-count">
                {
                  recipes.filter(
                    (r, i) => r.col === c && phase > recipes.indexOf(r),
                  ).length
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlannerAnimation() {
  const [positions, setPositions] = useState<Record<string, string>>({});
  const days = ["Mon", "Tue", "Wed", "Thu"];
  const chips = [
    { id: "a", emoji: "🍪", label: "Cookies", color: "#dc7243" },
    { id: "b", emoji: "🍝", label: "Pasta", color: "#5e445a" },
    { id: "c", emoji: "🍲", label: "Soup", color: "#4e6646" },
  ];

  useEffect(() => {
    const sequence = [
      { id: "a", day: "Mon" },
      { id: "b", day: "Wed" },
      { id: "c", day: "Thu" },
    ];
    sequence.forEach((s, i) => {
      setTimeout(
        () => setPositions((p) => ({ ...p, [s.id]: s.day })),
        600 + i * 800,
      );
    });
  }, []);

  return (
    <div className="ob-animation ob-planner-animation">
      <div className="ob-mini-week">
        {days.map((d) => (
          <div key={d} className="ob-mini-day">
            <div className="ob-mini-day-label">{d}</div>
            <div className="ob-mini-day-body">
              {chips
                .filter((c) => positions[c.id] === d)
                .map((c) => (
                  <div
                    key={c.id}
                    className="ob-mini-chip-card"
                    style={{ borderColor: c.color }}
                  >
                    <span>{c.emoji}</span>
                    <span
                      style={{ fontSize: 8, color: c.color, fontWeight: 700 }}
                    >
                      {c.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="ob-unscheduled-mini">
        {chips
          .filter((c) => !positions[c.id])
          .map((c) => (
            <div
              key={c.id}
              className="ob-mini-chip-card ob-chip-waiting"
              style={{ borderColor: c.color }}
            >
              <span>{c.emoji}</span>
              <span style={{ fontSize: 8, color: c.color, fontWeight: 700 }}>
                {c.label}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function CompareAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="ob-animation ob-compare-animation">
      <div className={`ob-compare-cards ${phase >= 1 ? "ob-visible" : ""}`}>
        {[
          { e: "🍪", t: "Classic Choc Chip", tags: ["cookies", "baking"] },
          { e: "🍪", t: "Brown Butter Cookies", tags: ["cookies", "baking"] },
        ].map((r, i) => (
          <div key={i} className="ob-compare-card-mini">
            <div className="ob-compare-image">{r.e}</div>
            <div className="ob-compare-card-title">{r.t}</div>
            <div
              className="ob-card-tags"
              style={{ justifyContent: "center", marginTop: 4 }}
            >
              {r.tags.map((t) => (
                <span key={t} className="ob-tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {phase >= 2 && (
        <div className="ob-compare-result">
          <div className="ob-compare-result-label">
            ✨ Chef's Assistant says:
          </div>
          <div className="ob-compare-result-text">
            The brown butter version uses significantly less sugar but adds an
            extra egg yolk, resulting in a chewier, nuttier cookie with more
            depth. The classic is sweeter and crispier with a more
            straightforward flavour.
          </div>
        </div>
      )}
    </div>
  );
}

function GroceryAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const recipes = [
    {
      e: "🍪",
      name: "Cookies",
      ingredients: ["2 cups flour", "3 eggs", "1 cup butter"],
    },
    {
      e: "🎂",
      name: "Cake",
      ingredients: ["1 cup flour", "2 eggs", "½ cup butter"],
    },
  ];
  const combined = ["3 cups flour", "5 eggs", "1½ cups butter"];

  return (
    <div className="ob-animation ob-grocery-animation">
      <div className="ob-grocery-layout">
        <div className={`ob-recipe-stacks ${phase >= 1 ? "ob-visible" : ""}`}>
          {recipes.map((r, i) => (
            <div
              key={i}
              className={`ob-recipe-stack ${phase >= 2 ? "ob-merging" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="ob-stack-header">
                <span>{r.e}</span>
                <span className="ob-stack-name">{r.name}</span>
              </div>
              {r.ingredients.map((ing, j) => (
                <div key={j} className="ob-stack-ingredient">
                  {ing}
                </div>
              ))}
            </div>
          ))}
        </div>
        {phase >= 1 && <div className="ob-grocery-arrow">→</div>}
        {phase >= 2 && (
          <div className="ob-combined-list">
            <div className="ob-combined-header">Combined</div>
            {combined.map((c, i) => (
              <div
                key={i}
                className="ob-combined-item"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <span className="ob-combined-check">✓</span> {c}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeAnimation() {
  const themes = [
    {
      bg: "#fdf6ee",
      primary: "#5e445a",
      accent: "#dc7243",
      gold: "#dd9d5b",
      label: "Warm Cream",
    },
    {
      bg: "#17313E",
      primary: "#9BB4C0",
      accent: "#86B0BD",
      gold: "#E1D0B3",
      label: "Deep Ocean",
    },
    {
      bg: "#2C2C2C",
      primary: "#A8BBA3",
      accent: "#748873",
      gold: "#ECE7D1",
      label: "Forest Night",
    },
    {
      bg: "#F7F4EA",
      primary: "#748873",
      accent: "#B87C4C",
      gold: "#D1A980",
      label: "Sage Garden",
    },
  ];
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevIdx((i) => i);
      setIdx((i) => (i + 1) % themes.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const t = themes[idx];

  return (
    <div className="ob-animation ob-theme-animation">
      <div
        className="ob-theme-preview"
        style={{
          background: t.bg,
          borderColor: t.primary,
          transition: "all 0.7s ease",
        }}
      >
        <div className="ob-theme-header" style={{ borderColor: t.primary }}>
          <div
            className="ob-theme-title"
            style={{ color: t.primary, transition: "color 0.7s" }}
          >
            Culinary Cloud
          </div>
          <div className="ob-theme-dots">
            <div
              className="ob-dot"
              style={{ background: t.primary, transition: "background 0.7s" }}
            />
            <div
              className="ob-dot"
              style={{ background: t.accent, transition: "background 0.7s" }}
            />
          </div>
        </div>
        <div className="ob-theme-hex-row">
          {(["primary", "accent", "gold"] as const).map((key) => (
            <div key={key} className="ob-theme-hex-item">
              <div
                className="ob-theme-hex-dot"
                style={{ background: t[key], transition: "background 0.7s" }}
              />
              <div
                className="ob-theme-hex-value"
                style={{ color: t.primary, transition: "color 0.7s" }}
              >
                {t[key]}
              </div>
            </div>
          ))}
        </div>
        <div
          className="ob-theme-card"
          style={{
            background:
              t.bg === "#fdf6ee" || t.bg === "#F7F4EA"
                ? "white"
                : `color-mix(in srgb, ${t.bg} 70%, white 30%)`,
            borderColor: `color-mix(in srgb, ${t.bg} 50%, white 50%)`,
            transition: "all 0.7s",
          }}
        >
          <div
            className="ob-theme-bar"
            style={{ background: t.accent, transition: "background 0.7s" }}
          />
          <div
            className="ob-theme-line"
            style={{
              background: t.primary,
              opacity: 0.3,
              transition: "background 0.7s",
            }}
          />
          <div
            className="ob-theme-line ob-theme-line-short"
            style={{
              background: t.primary,
              opacity: 0.2,
              transition: "background 0.7s",
            }}
          />
        </div>
        <div
          className="ob-theme-label"
          style={{ color: t.accent, transition: "color 0.7s" }}
        >
          {t.label}
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    id: 1,
    emoji: "👋",
    title: "Welcome to Culinary Cloud",
    subtitle:
      "Your personal AI-powered cookbook. Save recipes, plan meals, and shop smarter, all in one place.",
    animation: <AppPreviewAnimation />,
  },
  {
    id: 2,
    emoji: "🔗",
    title: "Save Any Recipe Instantly",
    subtitle:
      "Paste a URL and we extract the important info without the fluff. AI automatically tags every recipe for you.",
    animation: <UrlAnimation />,
  },
  {
    id: 3,
    emoji: "📚",
    title: "Browse Your Way",
    subtitle:
      "Switch between scroll, list, and grid views. Add tags, write personal notes, and find anything instantly.",
    animation: <ViewsAnimation />,
  },
  {
    id: 4,
    emoji: "📁",
    title: "Organize with Collections",
    subtitle:
      "Group recipes into collections however makes sense to you. By cuisine, occasion, or anything else.",
    animation: <CollectionsAnimation />,
  },
  {
    id: 5,
    emoji: "📅",
    title: "Plan Your Week",
    subtitle:
      "Drag and drop recipes onto your weekly planner. See your whole week at a glance.",
    animation: <PlannerAnimation />,
  },
  {
    id: 6,
    emoji: "⚖️",
    title: "Compare Recipes",
    subtitle:
      "Select 2 to 4 recipes and let our Chef's Assistant highlight the key differences in ingredients, technique and flavour profile.",
    animation: <CompareAnimation />,
  },
  {
    id: 7,
    emoji: "🛒",
    title: "Smart Grocery Lists",
    subtitle:
      "Generate a grocery list from selected recipes or your whole meal plan. We combine and deduplicate ingredients automatically.",
    animation: <GroceryAnimation />,
  },
  {
    id: 8,
    emoji: "🎨",
    title: "Make It Yours",
    subtitle:
      "Customize the theme as much as you want. Choose from presets or build your own palette.",
    animation: <ThemeAnimation />,
  },
  {
    id: 9,
    emoji: "🚀",
    title: "More Coming Soon",
    subtitle:
      "We're constantly adding new features. Have an idea or found a bug? We'd love to hear from you.",
    animation: null,
    isLast: true,
  },
];

export default function OnboardingModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setIsVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  }

  function goTo(idx: number) {
    if (isAnimating || idx === current) return;
    setDirection(idx > current ? "forward" : "back");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsAnimating(false);
    }, 200);
  }

  function next() {
    if (current < SLIDES.length - 1) goTo(current + 1);
  }
  function prev() {
    if (current > 0) goTo(current - 1);
  }

  if (!isVisible) return null;

  const slide = SLIDES[current];

  return (
    <div className="ob-overlay">
      <div className="ob-modal">
        <button className="ob-skip" onClick={dismiss}>
          Skip
        </button>

        <div
          className={`ob-slide ${isAnimating ? (direction === "forward" ? "ob-exit-left" : "ob-exit-right") : "ob-enter"} ${!(slide as any).animation && !(slide as any).isLast ? "ob-slide-centered" : ""}`}
        >
          <div className="ob-emoji">{slide.emoji}</div>
          <h2 className="ob-title">{slide.title}</h2>
          <p className="ob-subtitle">{slide.subtitle}</p>

          {slide.animation && (
            <div className="ob-animation-container">{slide.animation}</div>
          )}

          {(slide as any).isLast && (
            <div className="ob-last-links">
              <a
                href="https://insigh.to/b/culinary-cloud-20"
                target="_blank"
                rel="noopener noreferrer"
                className="ob-feedback-btn"
              >
                💬 Give Feedback
              </a>
              <div className="ob-socials">
                <a
                  href="https://www.linkedin.com/in/basem-zaky-450733312/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="ob-social-icon"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/BasZak25"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="ob-social-icon"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="mailto:baszaksocial@gmail.com"
                  aria-label="Email"
                  className="ob-social-icon"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>
              </div>
              <p className="ob-built-by">
                Built by <strong>BasZak</strong>
              </p>
            </div>
          )}
        </div>

        <div className="ob-nav">
          <button
            className="ob-nav-btn"
            onClick={prev}
            disabled={current === 0}
          >
            ←
          </button>
          <div className="ob-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`ob-dot-btn ${i === current ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          {current === SLIDES.length - 1 ? (
            <button className="ob-nav-btn ob-nav-done" onClick={dismiss}>
              Done ✓
            </button>
          ) : (
            <button className="ob-nav-btn" onClick={next}>
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
