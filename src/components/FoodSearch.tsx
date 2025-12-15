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

  const canSearch = useMemo(() => debounced.length >= 2, [debounced]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!canSearch) {
        setResults([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const foods = await searchFoods(debounced, 12);
        if (!cancelled) setResults(foods);
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
  }, [debounced, canSearch]);

  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <h2 className="card-title">Search foods</h2>
      <p className="card-subtitle">Search by product name or brand (no barcode needed).</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: oreo, greek yogurt, doritos…"
          style={{ padding: 10, minWidth: 280, flex: 1 }}
        />
        <span style={{ opacity: 0.8, fontSize: 13 }}>
          {canSearch ? "Searching…" : "Type 2+ chars"}
        </span>
      </div>

      {loading && <p style={{ marginTop: 10 }}>Looking up products…</p>}
      {error && <p style={{ marginTop: 10, color: "red" }}>{error}</p>}

      {!loading && !error && canSearch && results.length === 0 && (
        <p style={{ marginTop: 10 }}>No results found.</p>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {results.map((p) => (
            <div
              key={p.barcode + p.name}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.12)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 260 }}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : (
                  <div style={{ width: 54, height: 54, borderRadius: 10, background: "rgba(255,255,255,0.08)" }} />
                )}

                <div>
                  <div style={{ fontWeight: 800 }}>{p.name}</div>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>
                    {p.brand ? `Brand: ${p.brand}` : "Brand: -"}
                    {" · "}
                    {p.nutriments.energyKcal != null ? `${p.nutriments.energyKcal} kcal/100g` : "kcal: -"}
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => onPickProduct(p)}>
                Add to results
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};