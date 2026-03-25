import React, { useImperativeHandle, forwardRef, useState } from "react";
import { GroceryItem } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface NewItemFormState {
  name: string;
  calories: string;
}

export type GroceryListHandle = {
  addExternalItem: (item: { name: string; calories: number;}) => void;
};

export const GroceryList = forwardRef<GroceryListHandle>(function GroceryList(_, ref) {
  const [items, setItems] = useLocalStorage<GroceryItem[]>("smartcart:groceryList", []);

  const [form, setForm] = useState<NewItemFormState>({
    name: "",
    calories: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addItem(name: string, calories: number) {
    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      calories,
    };
    setItems((prev) => [...prev, newItem]);
  }

  useImperativeHandle(ref, () => ({
    addExternalItem: (item) => {
      addItem(item.name, item.calories);
    },
  }));

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();

    const calories = parseFloat(form.calories);

    if (!form.name.trim() || isNaN(calories)) {
      alert("Please enter a name, and calories.");
      return;
    }

    addItem(form.name, calories);
    setForm({ name: "", calories: "" });
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="card">
      <h2 className="card-title">Grocery List</h2>
      <p className="card-subtitle">
        Keep a running list while you compare products side by side.
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
        <p className="empty-state">No items yet. Add a few products to track as you browse.</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Calories</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.calories.toFixed(0)}</td>
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