import React, { useMemo, useRef, useState } from "react";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { GroceryList, GroceryListHandle } from "./components/GroceryList";
import { FoodProduct } from "./api/foodApi";
import { ProductCompare } from "./components/ProductCompare";
import { FoodSearch } from "./components/FoodSearch";
import "./styles.css";

export const App: React.FC = () => {
  const [scannedItems, setScannedItems] = useState<FoodProduct[]>([]);
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const groceryRef = useRef<GroceryListHandle>(null);

  const handleProductLoaded = (product: FoodProduct) => {
    // avoid duplicates by barcode
    setScannedItems((prev) => {
      const exists = prev.some((p) => p.barcode === product.barcode);
      if (exists) return prev;
      return [product, ...prev];
    });
  };

  const leftProduct = useMemo(
    () => scannedItems.find((p) => p.barcode === leftId) ?? null,
    [scannedItems, leftId]
  );

  const rightProduct = useMemo(
    () => scannedItems.find((p) => p.barcode === rightId) ?? null,
    [scannedItems, rightId]
  );

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>SmartCart Coach 2.0</h1>

        <p>
          Milestone 2 prototype. Scan products, add scanned items to your grocery list,
          and compare two products side by side with a Swap Score.
        </p>
      </header>

      <main className="app-main">
        <section style={{ marginBottom: "2rem" }}>
          <BarcodeScanner onProductLoaded={handleProductLoaded} />
          <FoodSearch onPickProduct={handleProductLoaded} />
          {scannedItems.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h2>Recently scanned items</h2>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {scannedItems.map((item) => (
                  <li
                    key={item.barcode}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{item.name}</div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        {item.brand ? `Brand: ${item.brand}` : "Brand: -"} · Barcode: {item.barcode}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() =>
                          groceryRef.current?.addExternalItem({
                            name: item.name,
                            calories: item.nutriments.energyKcal ?? 0,
                            price: 3.99, // placeholder until you add real price integration
                          })
                        }
                      >
                        Add to Grocery List
                      </button>

                      <button type="button" onClick={() => setLeftId(item.barcode)}>
                        Set as Left
                      </button>

                      <button type="button" onClick={() => setRightId(item.barcode)}>
                        Set as Right
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <label>
                  Compare left:
                  <select
                    value={leftId}
                    onChange={(e) => setLeftId(e.target.value)}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="">Select…</option>
                    {scannedItems.map((p) => (
                      <option key={p.barcode} value={p.barcode}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Compare right:
                  <select
                    value={rightId}
                    onChange={(e) => setRightId(e.target.value)}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="">Select…</option>
                    {scannedItems.map((p) => (
                      <option key={p.barcode} value={p.barcode}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <ProductCompare left={leftProduct} right={rightProduct} />
            </div>
          )}
        </section>

        <GroceryList ref={groceryRef} />
      </main>

      <footer className="app-footer">
        <small>SmartCart Coach 2.0 · Capstone prototype · Milestone 2</small>
      </footer>
    </div>
  );
};