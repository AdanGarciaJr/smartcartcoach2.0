import React, { useEffect, useMemo, useState } from "react";
import { FoodProduct, searchFoods } from "../api/foodApi";

export const FoodSearch: React.FC<{
  onPickProduct: (p: FoodProduct) => void;
}> = ({ onPickProduct }) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FoodProduct[]>([]);

  // debounce typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // fetch on debounced
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debounced) {
        setResults([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const items = await searchFoods(debounced);
        if (!cancelled) setResults(items);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const hasResults = useMemo(() => results.length > 0, [results]);

  return (
    <div className="card">
      <h3>Food Search</h3>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Search products</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: greek yogurt, tortilla, cereal…"
        />
      </label>

      {loading && <p style={{ marginTop: 10 }}>Searching…</p>}
      {error && <p style={{ marginTop: 10, color: "crimson" }}>{error}</p>}

      {!loading && !error && debounced && !hasResults && (
        <p style={{ marginTop: 10, opacity: 0.85 }}>No results found.</p>
      )}

      {hasResults && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {results.map((p) => {
            const servingAvailable =
              Object.values(p.nutrimentsPerServing || {}).some((v) => v != null);

            const kcalLabel =
              p.nutrimentsPerServing?.energyKcal != null
                ? `${p.nutrimentsPerServing.energyKcal} kcal/serving${p.servingSize ? ` (${p.servingSize})` : ""}`
                : p.nutriments.energyKcal != null
                  ? `${p.nutriments.energyKcal} kcal/100g`
                  : "kcal: -";

            return (
              <div
                key={p.barcode || `${p.name}-${p.brand}-${Math.random()}`}
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 8,
                        background: "#222",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      No image
                    </div>
                  )}

                  <div style={{ flex: 1, display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    {!!p.brand && <div style={{ opacity: 0.9 }}>{p.brand}</div>}
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {kcalLabel}
                      {!servingAvailable && " (serving data not provided)"}
                    </div>
                  </div>
                </div>

                <button type="button" onClick={() => onPickProduct(p)}>
                  Add to results
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};