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

  // Per 100g (fallback / still useful)
  nutriments: Nutriments;

  // Serving info + per-serving macros (preferred when available)
  servingSize: string; // e.g., "30 g"
  servingSizeG: number | null;
  nutrimentsPerServing: Nutriments;
}

function numOrNull(x: any): number | null {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

function parseServingGrams(servingSize: string): number | null {
  if (!servingSize) return null;
  const m = servingSize.match(/(\d+(\.\d+)?)\s*g/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function mapNutriments100g(nutriments: any): Nutriments {
  return {
    energyKcal: numOrNull(nutriments?.["energy-kcal_100g"] ?? nutriments?.energy_kcal_100g),
    carbs: numOrNull(nutriments?.carbohydrates_100g),
    fat: numOrNull(nutriments?.fat_100g),
    protein: numOrNull(nutriments?.proteins_100g),
    sugars: numOrNull(nutriments?.sugars_100g),
    salt: numOrNull(nutriments?.salt_100g),
  };
}

function mapNutrimentsServing(nutriments: any): Nutriments {
  return {
    energyKcal: numOrNull(nutriments?.["energy-kcal_serving"] ?? nutriments?.energy_kcal_serving),
    carbs: numOrNull(nutriments?.carbohydrates_serving),
    fat: numOrNull(nutriments?.fat_serving),
    protein: numOrNull(nutriments?.proteins_serving),
    sugars: numOrNull(nutriments?.sugars_serving),
    salt: numOrNull(nutriments?.salt_serving),
  };
}

export async function fetchFoodByBarcode(barcode: string): Promise<FoodProduct> {
  if (!barcode) throw new Error("No barcode provided");

  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  if (data.status !== 1 || !data.product) throw new Error("Product not found in database");

  const p = data.product;
  const nutr = p.nutriments || {};

  const servingSize = String(p.serving_size || "");
  const servingSizeG = servingSize ? parseServingGrams(servingSize) : null;

  return {
    barcode: String(data.code ?? barcode),
    name: p.product_name || "Unknown product",
    brand: p.brands || "",
    quantity: p.quantity || "",
    imageUrl: p.image_front_url || p.image_url || "",

    nutriments: mapNutriments100g(nutr),
    servingSize,
    servingSizeG,
    nutrimentsPerServing: mapNutrimentsServing(nutr),
  };
}

// ✅ FIXED: Use classic search endpoint for better "what I typed" matching
export async function searchFoods(query: string): Promise<FoodProduct[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "12",
  });

  const url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  const products: any[] = Array.isArray(data?.products) ? data.products : [];

  return products.map((p) => {
    const nutr = p.nutriments || {};
    const servingSize = String(p.serving_size || "");
    const servingSizeG = servingSize ? parseServingGrams(servingSize) : null;

    return {
      barcode: String(p.code ?? ""),
      name: p.product_name || p.generic_name || "Unknown product",
      brand: p.brands || "",
      quantity: p.quantity || "",
      imageUrl: p.image_front_url || p.image_url || "",

      nutriments: mapNutriments100g(nutr),
      servingSize,
      servingSizeG,
      nutrimentsPerServing: mapNutrimentsServing(nutr),
    } as FoodProduct;
  });
}