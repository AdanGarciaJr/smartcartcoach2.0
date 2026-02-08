import React, { useImperativeHandle, forwardRef, useState } from "react";
import { GroceryItem } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SwapScoreBadge } from "./SwapScoreBadge";

interface NewItemFormState {
  name: string;
  price: string;
  calories: string;
}

function computeSwapScore(price: number, calories: number): number {
  const maxCalories = 800;
  const maxPrice = 15;

  const caloriesClamped = Math.min(Math.max(calories, 0), maxCalories);
  const priceClamped = Math.min(Math.max(price, 0), maxPrice);

  const caloriesScore = 1 - caloriesClamped / maxCalories;
  const priceScore = 1 - priceClamped / maxPrice;

  const combined = 0.6 * caloriesScore + 0.4 * priceScore;
  return Math.max(0, Math.min(100, combined * 100));
}

export type GroceryListHandle = {
  addExternalItem: (item: { name: string; calories: number; price?: number }) => void;
};

export const GroceryList = forwardRef<GroceryListHandle>(function GroceryList(_, ref) {
  const [items, setItems] = useLocalStorage<GroceryItem[]>("smartcart:groceryList", []);

  const [form, setForm] = useState<NewItemFormState>({
    name: "",
    price: "",
    calories: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addItem(name: string, price: number, calories: number) {
    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      price,
      calories,
      swapScore: computeSwapScore(price, calories),
    };
    setItems((prev) => [...prev, newItem]);
  }

  useImperativeHandle(ref, () => ({
    addExternalItem: (item) => {
      const price = item.price ?? 3.99;
      addItem(item.name, price, item.calories);
    },
  }));

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();

    const price = parseFloat(form.price);
    const calories = parseFloat(form.calories);

    if (!form.name.trim() || isNaN(price) || isNaN(calories)) {
      alert("Please enter a name, price, and calories.");
      return;
    }

    addItem(form.name, price, calories);
    setForm({ name: "", price: "", calories: "" });
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="card">
      <h2 className="card-title">Grocery List</h2>
      <p className="card-subtitle">
        Add items manually or from scanned products. Swap Score uses price + calories.
      </p>

      <form className="form" onSubmit={handleAddItem}>
        <div className="form-row">
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Whole wheat bread"
            />
          </label>

          <label>
            Price (USD)
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="3.49"
              inputMode="decimal"
            />
          </label>

          <label>
            Calories per serving
            <input
              name="calories"
              value={form.calories}
              onChange={handleChange}
              placeholder="120"
              inputMode="decimal"
            />
          </label>
        </div>

        <button type="submit" className="btn-primary">
          Add Item
        </button>
      </form>

      {items.length === 0 ? (
        <p className="empty-state">No items yet. Add a few products to see their Swap Scores.</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Calories</th>
              <th>Swap Score</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.calories.toFixed(0)}</td>
                <td>
                  <SwapScoreBadge score={item.swapScore} />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});