// src/App.tsx
import React, { useState } from "react";
import { GroceryList } from "./components/GroceryList";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { FoodProduct } from "./api/foodApi";
import "./styles.css";

export const App: React.FC = () => {
  const [scannedItems, setScannedItems] = useState<FoodProduct[]>([]);

  const handleProductLoaded = (product: FoodProduct) => {
    setScannedItems((prev) => [...prev, product]);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>SmartCart Coach 2.0</h1>
        <p>
          Milestone 1 prototype. This version focuses on a basic grocery list and
          a simple client side Swap Score to demonstrate core decision support.
          {/* for Milestone 2 you can update this text later */}
        </p>
      </header>

      <main className="app-main">
        {/* New: barcode scanner */}
        <section style={{ marginBottom: "2rem" }}>
          <BarcodeScanner onProductLoaded={handleProductLoaded} />

          {scannedItems.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h2>Recently scanned items</h2>
              <ul>
                {scannedItems.map((item) => (
                  <li key={item.barcode}>
                    {item.name} {item.brand && `(${item.brand})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Your existing grocery list feature stays untouched */}
        <GroceryList />
      </main>

      <footer className="app-footer">
        <small>
          SmartCart Coach 2.0 &middot; Capstone prototype &middot; Milestone 1
        </small>
      </footer>
    </div>
  );
};