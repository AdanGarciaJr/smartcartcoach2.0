import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const telemetryDir = path.join(__dirname, "data");
const telemetryFile = path.join(telemetryDir, "scan-events.jsonl");

function ensureTelemetryStorage() {
  if (!fs.existsSync(telemetryDir)) {
    fs.mkdirSync(telemetryDir, { recursive: true });
  }

  if (!fs.existsSync(telemetryFile)) {
    fs.writeFileSync(telemetryFile, "", "utf8");
  }
}

function appendTelemetryEvent(event) {
  ensureTelemetryStorage();
  fs.appendFileSync(telemetryFile, JSON.stringify(event) + "\n", "utf8");
}

/**
 * POST /api/scan-event
 * body: {
 *   eventType: "scan_started" | "scan_stopped" | "scan_success" | "scan_failure" |
 *              "manual_lookup_used" | "product_lookup_success" | "product_lookup_failed",
 *   sessionId: string,
 *   timestamp: string,
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

    if (!eventType || !sessionId || !timestamp) {
      return res.status(400).json({
        error: "Missing required fields: eventType, sessionId, or timestamp",
      });
    }

    const event = {
      eventType,
      sessionId,
      timestamp,
      success: typeof success === "boolean" ? success : undefined,
      barcode: barcode ? String(barcode) : undefined,
      errorMessage: errorMessage ? String(errorMessage) : undefined,
      timeToScanMs:
        typeof timeToScanMs === "number" && Number.isFinite(timeToScanMs)
          ? timeToScanMs
          : undefined,
      usedManualEntry:
        typeof usedManualEntry === "boolean" ? usedManualEntry : undefined,
      userAgent: userAgent ? String(userAgent) : undefined,
      receivedAt: new Date().toISOString(),
    };

    appendTelemetryEvent(event);

    console.log("SCAN_EVENT:", event);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telemetry logging failed:", err);
    return res.status(500).json({ error: "Failed to log scan event" });
  }
});

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
      return res.json({
        recommendation: null,
        reason: "No candidates available yet.",
      });
    }

    // Keep the payload small: top N candidates only
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

/**
 * GET /api/scan-stats
 * Optional helper endpoint to quickly inspect telemetry volume.
 */
app.get("/api/scan-stats", async (_req, res) => {
  try {
    ensureTelemetryStorage();

    const raw = fs.readFileSync(telemetryFile, "utf8");
    const lines = raw.split("\n").filter(Boolean);

    let successCount = 0;
    let failureCount = 0;
    let manualLookupCount = 0;

    for (const line of lines) {
      try {
        const evt = JSON.parse(line);

        if (evt.eventType === "scan_success" || evt.eventType === "product_lookup_success") {
          successCount += 1;
        }

        if (evt.eventType === "scan_failure" || evt.eventType === "product_lookup_failed") {
          failureCount += 1;
        }

        if (evt.eventType === "manual_lookup_used") {
          manualLookupCount += 1;
        }
      } catch {
        // skip malformed lines
      }
    }

    return res.json({
      totalEvents: lines.length,
      successCount,
      failureCount,
      manualLookupCount,
      telemetryFile: "data/scan-events.jsonl",
    });
  } catch (err) {
    console.error("Failed to read scan stats:", err);
    return res.status(500).json({ error: "Failed to read scan stats" });
  }
});

console.log("Starting AI server...");

const PORT = process.env.PORT || 5174;

app.listen(PORT, () => {
  console.log(`AI server running on port ${PORT}`);
});