import React, { useMemo, useState } from "react";
import { FoodProduct, Nutriments } from "../api/foodApi";

function caloriesFromProduct(p: FoodProduct): number | null {
  return p.nutrimentsPerServing?.energyKcal ?? p.nutriments.energyKcal ?? null;
}

function shownMacros(p: FoodProduct): { macros: Nutriments; label: string } {
  const servingAvailable = Object.values(p.nutrimentsPerServing || {}).some(
    (v) => v != null
  );

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

  return iAmBetter
    ? { color: "#16a34a", fontWeight: 700 }
    : { color: "#dc2626", fontWeight: 700 };
}

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n == null) return "-";
  return `${n}${suffix}`;
}

type AiRecommendation = {
  name: string;
  brand?: string;
  barcode?: string;
  why?: string[];
  tradeoffs?: string[];
};

type AiResponse = {
  recommendation?: AiRecommendation | null;
  reason?: string;
  raw?: string;
};

export const ProductCompare: React.FC<{
  left?: FoodProduct | null;
  right?: FoodProduct | null;
  candidates: FoodProduct[];
  leftPrice?: number;
  rightPrice?: number;
}> = ({
  left,
  right,
  candidates,
  leftPrice = 3.99,
  rightPrice = 3.99,
}) => {
  const leftShown = left ? shownMacros(left) : null;
  const rightShown = right ? shownMacros(right) : null;

  const leftCalories = left ? caloriesFromProduct(left) : null;
  const rightCalories = right ? caloriesFromProduct(right) : null;

  const L = leftShown?.macros;
  const R = rightShown?.macros;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<AiResponse | null>(null);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        c?.barcode &&
        c.barcode !== left?.barcode &&
        c.barcode !== right?.barcode
    );
  }, [candidates, left?.barcode, right?.barcode]);

  async function handleAiRecommend() {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      if (!left || !right) {
        setAiError("Select both Left and Right first.");
        return;
      }

      const resp = await fetch(
        "https://smartcartcoach2-0.onrender.com/api/recommend-replacement",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            left,
            right,
            candidates: filteredCandidates.slice(0, 25),
            goals: ["lower calories", "lower sodium", "higher protein"],
          }),
        }
      );

      const rawText = await resp.text();

      console.log("AI status:", resp.status);
      console.log("AI raw response:", rawText);

      if (!resp.ok) {
        throw new Error(`AI request failed (${resp.status}): ${rawText}`);
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }

      setAiResult(data);
    } catch (e: any) {
      console.error("AI error:", e);
      setAiError(e?.message ?? "AI recommendation failed.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Product Compare</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <h4>Left</h4>
          {left && (
            <>
              <p>{left.name}</p>
              <p>
                Calories:{" "}
                <strong style={metricColor(leftCalories, rightCalories, "lower")}>
                  {fmt(leftCalories)}
                </strong>
              </p>
              <p>
                Protein:{" "}
                <strong style={metricColor(L?.protein, R?.protein, "higher")}>
                  {fmt(L?.protein)}
                </strong>
              </p>
            </>
          )}
        </div>

        <div>
          <h4>Right</h4>
          {right && (
            <>
              <p>{right.name}</p>
              <p>
                Calories:{" "}
                <strong style={metricColor(rightCalories, leftCalories, "lower")}>
                  {fmt(rightCalories)}
                </strong>
              </p>
              <p>
                Protein:{" "}
                <strong style={metricColor(R?.protein, L?.protein, "higher")}>
                  {fmt(R?.protein)}
                </strong>
              </p>
            </>
          )}
        </div>
      </div>

      {/* AI Section */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleAiRecommend}
          disabled={!left || !right || aiLoading}
        >
          {aiLoading ? "AI thinking..." : "AI: Recommend a Better Replacement"}
        </button>

        {aiError && (
          <p style={{ color: "red", marginTop: 10 }}>{aiError}</p>
        )}

        {aiResult?.recommendation && (
          <div style={{ marginTop: 12 }}>
            <strong>{aiResult.recommendation.name}</strong>
            {aiResult.recommendation.why?.map((w, i) => (
              <p key={i}>• {w}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};