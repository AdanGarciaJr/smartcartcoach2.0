import React from "react";
import { GroceryList } from "./components/GroceryList";
import "./styles.css";

export const App: React.FC = () => {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>SmartCart Coach 2.0</h1>
        <p>
          Milestone 1 prototype. This version focuses on a basic grocery list and
          a simple client side Swap Score to demonstrate core decision support.
        </p>
      </header>

      <main className="app-main">
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