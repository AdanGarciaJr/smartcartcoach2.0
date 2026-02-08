import React, { useMemo, useRef, useState } from "react";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { GroceryList, GroceryListHandle } from "./components/GroceryList";
import { FoodProduct } from "./api/foodApi";
import { ProductCompare } from "./components/ProductCompare";
import { FoodSearch } from "./components/FoodSearch";
import { UserProfile } from "./components/UserProfile";
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
          <UserProfile />
        </p>
      </header>

      <main className="app-main">
        <div className="layout">
          <section className="card">
            <h2 className="card-title">Scan or search</h2>
            <p className="card-subtitle">
              Add products, then compare nutrition side by side.
            </p>

            <div className="form">
              <BarcodeScanner onProductLoaded={handleProductLoaded} />
              <FoodSearch onPickProduct={handleProductLoaded} />
            </div>

            {scannedItems.length > 0 ? (
              <div className="compare-block">
                <h2 className="section-title">Recently scanned items</h2>

                <ul className="recent-grid">
                  {scannedItems.map((item) => (
                    <li key={item.barcode} className="recent-item">
                      <div className="recent-meta">
                        <div className="recent-name">{item.name}</div>
                        <div className="recent-sub">
                          Barcode: <span className="mono">{item.barcode}</span>
                        </div>
                      </div>

                      <div className="recent-actions">
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

                <div className="compare-controls">
                  <label>
                    Compare left:
                    <select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
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
                    <select value={rightId} onChange={(e) => setRightId(e.target.value)}>
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
            ) : (
              <p className="empty-state">
                No products scanned yet. Scan a barcode or search to start.
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">Grocery List</h2>
            <p className="card-subtitle">Keep a running list while you browse.</p>

            <GroceryList ref={groceryRef} />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <small>SmartCart Coach 2.0 · Capstone prototype · Milestone 2</small>
      </footer>
    </div>
  );
};
