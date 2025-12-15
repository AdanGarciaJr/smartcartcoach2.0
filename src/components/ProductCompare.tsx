import React, { useMemo } from "react";
import { FoodProduct } from "../api/foodApi";
import { SwapScoreBadge } from "./SwapScoreBadge";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function computeSwapScore(price: number, calories: number): number {
  const maxCalories = 800;
  const maxPrice = 15;

  const caloriesScore = 1 - clamp(calories, 0, maxCalories) / maxCalories;
  const priceScore = 1 - clamp(price, 0, maxPrice) / maxPrice;

  return clamp((0.6 * caloriesScore + 0.4 * priceScore) * 100, 0, 100);
}

function caloriesFromProduct(p: FoodProduct): number {
  // Prefer kcal if present
  return p.nutriments.energyKcal ?? 0;
}

export const ProductCompare: React.FC<{
  left?: FoodProduct | null;
  right?: FoodProduct | null;
  leftPrice?: number;
  rightPrice?: number;
}> = ({ left, right, leftPrice = 3.99, rightPrice = 3.99 }) => {
  const leftCalories = left ? caloriesFromProduct(left) : 0;
  const rightCalories = right ? caloriesFromProduct(right) : 0;

  const leftScore = useMemo(() => computeSwapScore(leftPrice, leftCalories), [leftPrice, leftCalories]);
  const rightScore = useMemo(() => computeSwapScore(rightPrice, rightCalories), [rightPrice, rightCalories]);

  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <h2 className="card-title">Product Comparison</h2>
      <p className="card-subtitle">Pick any two scanned products and compare nutrition + Swap Score.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{left?.name ?? "Select left product"}</h3>
          {left?.brand && <p style={{ opacity: 0.85 }}>Brand: {left.brand}</p>}
          {left && (
            <>
              <p>Calories (kcal): <strong>{leftCalories}</strong></p>
              <p>Protein: <strong>{left.nutriments.protein ?? "-"}</strong></p>
              <p>Carbs: <strong>{left.nutriments.carbs ?? "-"}</strong></p>
              <p>Fat: <strong>{left.nutriments.fat ?? "-"}</strong></p>
              <div style={{ marginTop: 10 }}>
                <SwapScoreBadge score={leftScore} />
              </div>
            </>
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{right?.name ?? "Select right product"}</h3>
          {right?.brand && <p style={{ opacity: 0.85 }}>Brand: {right.brand}</p>}
          {right && (
            <>
              <p>Calories (kcal): <strong>{rightCalories}</strong></p>
              <p>Protein: <strong>{right.nutriments.protein ?? "-"}</strong></p>
              <p>Carbs: <strong>{right.nutriments.carbs ?? "-"}</strong></p>
              <p>Fat: <strong>{right.nutriments.fat ?? "-"}</strong></p>
              <div style={{ marginTop: 10 }}>
                <SwapScoreBadge score={rightScore} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};