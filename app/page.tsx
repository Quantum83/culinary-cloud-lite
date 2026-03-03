"use client";

import { useState, useEffect } from "react";

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  source_url: string;
  created_at: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    setRecipes(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      setUrl("");
      fetchRecipes();
    }

    setLoading(false);
  }

  const filteredRecipes = recipes
    .filter((recipe) =>
      recipe.title.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sort === "oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      return 0;
    });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: #fdf6ee;
          font-family: 'Lato', sans-serif;
          color: #3a2a38;
          min-height: 100vh;
          border-top: 5px solid #5e445a;
        }

        .page {
          max-width: 720px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .header {
          margin-bottom: 48px;
          border-bottom: 2px solid #5e445a;
          padding-bottom: 24px;
        }

        .header-eyebrow {
          font-family: 'Lato', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #dc7243;
          margin-bottom: 8px;
        }

        .header-title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 700;
          color: #5e445a;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .header-subtitle {
          font-size: 15px;
          color: #a65a6e;
          font-weight: 300;
        }

        .form-section {
          background: #fff;
          border: 1.5px solid #5e445a;
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 48px;
          box-shadow: 0 2px 16px rgba(94,68,90,0.07);
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #5e445a;
          margin-bottom: 10px;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-input {
          flex: 1;
          border: 1.5px solid #e0cfc0;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'Lato', sans-serif;
          color: #3a2a38;
          background: #fdf6ee;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: #dc7243;
        }

        .form-input::placeholder {
          color: #c4a898;
        }

        .submit-btn {
          background: #dc7243;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: 'Lato', sans-serif;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
        }

        .submit-btn:hover {
          background: #c45e30;
        }

        .submit-btn:active {
          transform: scale(0.98);
        }

        .submit-btn:disabled {
          background: #e0b89e;
          cursor: not-allowed;
          transform: none;
        }

        .error-msg {
          margin-top: 12px;
          font-size: 13px;
          color: #c0392b;
          font-weight: 400;
        }

        .recipes-header {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #5e445a;
          margin-bottom: 20px;
        }

        .empty-msg {
          color: #a65a6e;
          font-size: 14px;
          font-style: italic;
        }

        .recipe-card {
          background: #fff;
          border: 1.5px solid #e8d8c4;
          border-radius: 12px;
          padding: 24px 28px;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(94,68,90,0.06);
          transition: box-shadow 0.2s;
        }

        .recipe-card:hover {
          box-shadow: 0 4px 24px rgba(94,68,90,0.13);
        }

        .recipe-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #5e445a;
          text-decoration: none;
          display: block;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .recipe-title:hover {
          color: #dc7243;
        }

        .ingredients-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #dd9d5b;
          margin-bottom: 10px;
        }

        .ingredients-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ingredient-item {
          font-size: 14px;
          color: #6b4a5e;
          padding-left: 16px;
          position: relative;
          line-height: 1.5;
        }

        .ingredient-item::before {
          content: '—';
          position: absolute;
          left: 0;
          color: #dd9d5b;
          font-size: 12px;
        }

        .recipe-divider {
          border: none;
          border-top: 1px solid #f0e0d0;
          margin: 16px 0;
        }

        .recipe-image {
          width: 100%;
          height: 180px;
          object-fit: contain;
          background: #f5ede3;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .recipe-details {
          margin-top: 4px;
        }

        .recipe-summary {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #dc7243;
          cursor: pointer;
          user-select: none;
          margin-bottom: 16px;
          list-style: none;
        }

        .recipe-summary:hover {
          color: #c45e30;
        }

        .recipe-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .instructions-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          counter-reset: steps;
        }

        .instruction-item {
          font-size: 14px;
          color: #6b4a5e;
          padding-left: 28px;
          position: relative;
          line-height: 1.6;
          counter-increment: steps;
        }

        .instruction-item::before {
          content: counter(steps);
          position: absolute;
          left: 0;
          top: 1px;
          background: #5e445a;
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .search-input {
          flex: 1;
          border: 1.5px solid #e0cfc0;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-family: 'Lato', sans-serif;
          color: #3a2a38;
          background: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: #dc7243;
        }

        .search-input::placeholder {
          color: #c4a898;
        }

        .sort-select {
          border: 1.5px solid #e0cfc0;
          border-radius: 8px;
          padding: 10px 40px 10px 16px;
          font-size: 14px;
          font-family: 'Lato', sans-serif;
          color: #3a2a38;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235e445a' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 14px center;
          appearance: none;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .sort-select:focus {
          border-color: #dc7243;
        }
      `}</style>

      <div className="page">
        <header className="header">
          <p className="header-eyebrow">Your Recipe Collection</p>
          <h1 className="header-title">Culinary Cloud</h1>
          <p className="header-subtitle">Paste a recipe URL to save it.</p>
        </header>

        <div className="form-section">
          <label className="form-label">Recipe URL</label>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                className="form-input"
                type="url"
                placeholder="https://www.preppykitchen.com/recipe/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Recipe"}
              </button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>

        <h2 className="recipes-header">Saved Recipes</h2>
        <div className="search-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="sort-select"
            aria-label="Sort recipes"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>

        {filteredRecipes.length === 0 && recipes.length === 0 && (
          <p className="empty-msg">No recipes saved yet. Add one above.</p>
        )}
        {filteredRecipes.length === 0 && recipes.length > 0 && (
          <p className="empty-msg">No recipes match your search.</p>
        )}

        {filteredRecipes.map((recipe) => (
          <div className="recipe-card" key={recipe.id}>
            {recipe.image_url && (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="recipe-image"
              />
            )}
            <a
              className="recipe-title"
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {recipe.title}
            </a>
            <hr className="recipe-divider" />
            <details className="recipe-details">
              <summary className="recipe-summary">Show details</summary>
              <div className="recipe-columns">
                <div className="recipe-column">
                  <p className="ingredients-label">Ingredients</p>
                  <ul className="ingredients-list">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li className="ingredient-item" key={i}>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div className="recipe-column">
                    <p className="ingredients-label">Instructions</p>
                    <ol className="instructions-list">
                      {recipe.instructions.map((step, i) => (
                        <li className="instruction-item" key={i}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </details>
          </div>
        ))}
      </div>
    </>
  );
}
