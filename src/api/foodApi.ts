export interface Nutriments {
  energyKcal: number | null;
  carbs: number | null;
  fat: number | null;
  protein: number | null;
  sugars: number | null;
  salt: number | null;
}

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  quantity: string;
  imageUrl: string;
  nutriments: Nutriments;
}

// Fetch product info from OpenFoodFacts by barcode
// https://world.openfoodfacts.org/api/v0/product/{barcode}.json
export async function fetchFoodByBarcode(barcode: string): Promise<FoodProduct> {
  if (!barcode) {
    throw new Error("No barcode provided");
  }

  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== 1 || !data.product) {
    throw new Error("Product not found in database");
  }

  const p = data.product;
  const nutriments = p.nutriments || {};

  return {
    barcode: data.code,
    name: p.product_name || "Unknown product",
    brand: p.brands || "",
    quantity: p.quantity || "",
    imageUrl: p.image_front_url || p.image_url || "",
    nutriments: {
      energyKcal:
        nutriments["energy-kcal_100g"] ??
        nutriments.energy_kcal_100g ??
        null,
      carbs: nutriments.carbohydrates_100g ?? null,
      fat: nutriments.fat_100g ?? null,
      protein: nutriments.proteins_100g ?? null,
      sugars: nutriments.sugars_100g ?? null,
      salt: nutriments.salt_100g ?? null,
    },
  };
}

export async function searchFoods(query: string, pageSize = 10): Promise<FoodProduct[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${pageSize}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search API error: ${res.status}`);

  const data = await res.json();
  const products = (data?.products ?? []) as any[];

  return products
    .filter((p) => p && (p.code || p.id))
    .map((p) => {
      const nutriments = p.nutriments || {};
      return {
        barcode: String(p.code ?? ""),
        name: p.product_name || p.generic_name || "Unknown product",
        brand: p.brands || "",
        quantity: p.quantity || "",
        imageUrl: p.image_front_url || p.image_url || "",
        nutriments: {
          energyKcal:
            nutriments["energy-kcal_100g"] ??
            nutriments.energy_kcal_100g ??
            null,
          carbs: nutriments.carbohydrates_100g ?? null,
          fat: nutriments.fat_100g ?? null,
          protein: nutriments.proteins_100g ?? null,
          sugars: nutriments.sugars_100g ?? null,
          salt: nutriments.salt_100g ?? null,
        },
      } as FoodProduct;
    });
}