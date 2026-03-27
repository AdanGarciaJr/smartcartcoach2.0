import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/scan-event
 * body: {
 *   eventType: string,
 *   sessionId: string,
 *   timestamp?: string,
 *   success?: boolean,
 *   barcode?: string,
 *   errorMessage?: string,
 *   timeToScanMs?: number,
 *   usedManualEntry?: boolean,
 *   userAgent?: string
 * }
 */
app.post("/api/scan-event", async (req, res) => {
  try {
    const {
      eventType,
      sessionId,
      timestamp,
      success,
      barcode,
      errorMessage,
      timeToScanMs,
      usedManualEntry,
      userAgent,
    } = req.body ?? {};

    if (!eventType || !sessionId) {
      return res.status(400).json({
        error: "Missing required fields: eventType or sessionId",
      });
    }

    const { error } = await supabase.from("scan_events").insert({
      session_id: sessionId,
      event_type: eventType,
      success: typeof success === "boolean" ? success : null,
      barcode: barcode ?? null,
      error_message: errorMessage ?? null,
      time_to_scan_ms:
        typeof timeToScanMs === "number" && Number.isFinite(timeToScanMs)
          ? timeToScanMs
          : null,
      used_manual_entry:
        typeof usedManualEntry === "boolean" ? usedManualEntry : false,
      user_agent: userAgent ?? null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to store scan event" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telemetry logging failed:", err);
    return res.status(500).json({ error: "Failed to log scan event" });
  }
});

/**
 * GET /api/scan-stats
 * Returns scanner success/failure counts + success rate.
 */
app.get("/api/scan-stats", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("scan_events")
      .select("event_type");

    if (error) {
      console.error("Supabase read error:", error);
      return res.status(500).json({ error: "Failed to read scan stats" });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const row of data) {
      if (row.event_type === "product_lookup_success") {
        successCount += 1;
      }

      if (
        row.event_type === "product_lookup_failed" ||
        row.event_type === "scan_failure"
      ) {
        failureCount += 1;
      }
    }

    const totalAttempts = successCount + failureCount;

    const successRatePercent =
      totalAttempts > 0
        ? Number(((successCount / totalAttempts) * 100).toFixed(2))
        : 0;

    return res.json({
      successCount,
      failureCount,
      totalAttempts,
      successRatePercent,
    });
  } catch (err) {
    console.error("Failed to read scan stats:", err);
    return res.status(500).json({ error: "Failed to read scan stats" });
  }
});

/**
 * POST /api/recommend-replacement
 */
app.post("/api/recommend-replacement", async (req, res) => {
  try {
    const { left, right, candidates, goals } = req.body;

    if (!left || !right || !Array.isArray(candidates)) {
      return res.status(400).json({ error: "Missing left/right/candidates" });
    }

    const filtered = candidates.filter(
      (c) => c?.barcode && c.barcode !== left.barcode && c.barcode !== right.barcode
    );

    if (filtered.length < 1) {
      return res.json({
        recommendation: null,
        reason: "No candidates available yet.",
      });
    }

    const topCandidates = filtered.slice(0, 25);

    const goalText =
      Array.isArray(goals) && goals.length
        ? goals.join(", ")
        : "lower calories, lower sodium, higher protein";

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
        candidates: topCandidates,
      }),
    });

    const text = response.output_text?.trim() ?? "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    return res.json(parsed);
  } catch (err) {
    console.error("AI recommendation failed:", err);
    return res.status(500).json({ error: "AI recommendation failed" });
  }
});

const PORT = process.env.PORT || 5174;

app.listen(PORT, () => {
  console.log(`AI server running on port ${PORT}`);
});