import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/recommend-replacement
 * body: {
 *   left: { name, nutrimentsPerServing, nutriments, servingSize, brand, barcode },
 *   right: { ...same... },
 *   candidates: [ ...products... ],
 *   goals: ["lower calories", "lower sodium", "higher protein"] // optional
 * }
 */
app.post("/api/recommend-replacement", async (req, res) => {
  try {
    const { left, right, candidates, goals } = req.body;

    if (!left || !right || !Array.isArray(candidates)) {
      return res.status(400).json({ error: "Missing left/right/candidates" });
    }

    // Remove left/right items from candidate pool
    const filtered = candidates.filter(
      (c) => c?.barcode && c.barcode !== left.barcode && c.barcode !== right.barcode
    );

    if (filtered.length < 1) {
      return res.json({ recommendation: null, reason: "No candidates available yet." });
    }

    // Keep the payload small: top N candidates only
    const topCandidates = filtered.slice(0, 25);

    const goalText =
      Array.isArray(goals) && goals.length ? goals.join(", ") : "lower calories, lower sodium, higher protein";

    // Responses API is recommended for new projects :contentReference[oaicite:1]{index=1}
    const response = await client.responses.create({
      model: "gpt-5",
      instructions:
        "You are a nutrition-focused product recommender for a grocery app. " +
        "You MUST pick a recommendation from the provided candidate list only. " +
        "Do NOT invent new products. " +
        "Prefer candidates that best satisfy the user's goals using nutrition facts. " +
        "Return valid JSON only.",
      input: JSON.stringify({
        goals: goalText,
        left,
        right,
        candidates: topCandidates
      }),
      // Ask for strict JSON output (no extra text)
      // If your SDK/version supports response_format, use it. If not, the "JSON only" instruction still works.
    });

    // The OpenAI SDK exposes output_text for Responses API :contentReference[oaicite:2]{index=2}
    const text = response.output_text?.trim() ?? "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback: if the model returns plain text, wrap it
      parsed = { raw: text };
    }

    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI recommendation failed" });
  }
});

console.log("Starting AI server...");

const PORT = process.env.PORT || 5174;

app.listen(PORT, () => {
  console.log(`AI server running on port ${PORT}`);
});

