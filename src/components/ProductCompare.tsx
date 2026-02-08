import React from "react";
import { FoodProduct, Nutriments } from "../api/foodApi";

function caloriesFromProduct(p: FoodProduct): number | null {
  return p.nutrimentsPerServing?.energyKcal ?? p.nutriments.energyKcal ?? null;
}

function shownMacros(p: FoodProduct): { macros: Nutriments; label: string } {
  const servingAvailable = Object.values(p.nutrimentsPerServing || {}).some((v) => v != null);
  if (servingAvailable) {
    return {
      macros: p.nutrimentsPerServing,
      label: `per serving${p.servingSize ? ` (${p.servingSize})` : ""}`,
    };
  }
  return { macros: p.nutriments, label: "per 100g" };
}

type BetterRule = "higher" | "lower";

function metricColor(
  mine: number | null | undefined,
  other: number | null | undefined,
  rule: BetterRule
): React.CSSProperties {
  if (mine == null || other == null) return { color: "inherit" };
  if (mine === other) return { color: "inherit" };

  const iAmBetter = rule === "higher" ? mine > other : mine < other;
  return iAmBetter ? { color: "#16a34a", fontWeight: 700 } : { color: "#dc2626", fontWeight: 700 };
}

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n == null) return "-";
  return `${n}${suffix}`;
}

export const ProductCompare: React.FC<{
  left?: FoodProduct | null;
  right?: FoodProduct | null;
  leftPrice?: number;
  rightPrice?: number;
}> = ({ left, right, leftPrice = 3.99, rightPrice = 3.99 }) => {
  const leftShown = left ? shownMacros(left) : null;
  const rightShown = right ? shownMacros(right) : null;

  const leftCalories = left ? caloriesFromProduct(left) : null;
  const rightCalories = right ? caloriesFromProduct(right) : null;

  const L = leftShown?.macros;
  const R = rightShown?.macros;

  return (
    <div className="card">
      <h3>Product Compare</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* LEFT */}
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
          <h4 style={{ marginTop: 0 }}>Left</h4>

          {!left ? (
            <p style={{ opacity: 0.8 }}>Pick a product to compare.</p>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 700 }}>{left.name}</p>
              {!!left.brand && <p style={{ margin: "4px 0 0", opacity: 0.9 }}>{left.brand}</p>}

              <p style={{ marginTop: 10 }}>
                Basis: <strong>{leftShown?.label}</strong>
              </p>

              <p>
                Price (USD):{" "}
                <strong style={metricColor(leftPrice, rightPrice, "lower")}>
                  {fmt(leftPrice, " USD")}
                </strong>
              </p>

              <p>
                Calories (kcal):{" "}
                <strong style={metricColor(leftCalories, rightCalories, "lower")}>
                  {fmt(leftCalories)}
                </strong>
              </p>

              <p>
                Protein (g):{" "}
                <strong style={metricColor(L?.protein, R?.protein, "higher")}>
                  {fmt(L?.protein)}
                </strong>
              </p>

              <p>
                Carbs (g):{" "}
                <strong style={metricColor(L?.carbs, R?.carbs, "lower")}>
                  {fmt(L?.carbs)}
                </strong>
              </p>

              <p>
                Fat (g):{" "}
                <strong style={metricColor(L?.fat, R?.fat, "lower")}>
                  {fmt(L?.fat)}
                </strong>
              </p>

              <p>
                Sugars (g):{" "}
                <strong style={metricColor(L?.sugars, R?.sugars, "lower")}>
                  {fmt(L?.sugars)}
                </strong>
              </p>

              <p>
                Salt (g):{" "}
                <strong style={metricColor(L?.salt, R?.salt, "lower")}>
                  {fmt(L?.salt)}
                </strong>
              </p>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
          <h4 style={{ marginTop: 0 }}>Right</h4>

          {!right ? (
            <p style={{ opacity: 0.8 }}>Pick a product to compare.</p>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 700 }}>{right.name}</p>
              {!!right.brand && <p style={{ margin: "4px 0 0", opacity: 0.9 }}>{right.brand}</p>}

              <p style={{ marginTop: 10 }}>
                Basis: <strong>{rightShown?.label}</strong>
              </p>

              <p>
                Price (USD):{" "}
                <strong style={metricColor(rightPrice, leftPrice, "lower")}>
                  {fmt(rightPrice, " USD")}
                </strong>
              </p>

              <p>
                Calories (kcal):{" "}
                <strong style={metricColor(rightCalories, leftCalories, "lower")}>
                  {fmt(rightCalories)}
                </strong>
              </p>

              <p>
                Protein (g):{" "}
                <strong style={metricColor(R?.protein, L?.protein, "higher")}>
                  {fmt(R?.protein)}
                </strong>
              </p>

              <p>
                Carbs (g):{" "}
                <strong style={metricColor(R?.carbs, L?.carbs, "lower")}>
                  {fmt(R?.carbs)}
                </strong>
              </p>

              <p>
                Fat (g):{" "}
                <strong style={metricColor(R?.fat, L?.fat, "lower")}>
                  {fmt(R?.fat)}
                </strong>
              </p>

              <p>
                Sugars (g):{" "}
                <strong style={metricColor(R?.sugars, L?.sugars, "lower")}>
                  {fmt(R?.sugars)}
                </strong>
              </p>

              <p>
                Salt (g):{" "}
                <strong style={metricColor(R?.salt, L?.salt, "lower")}>
                  {fmt(R?.salt)}
                </strong>
              </p>
            </>
          )}
        </div>
      </div>

      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Green = better, Red = worse. Rules: higher protein is better; lower price/calories/carbs/fat/sugars/salt is better.
      </p>
    </div>
  );
};