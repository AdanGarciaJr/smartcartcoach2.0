import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Result } from "@zxing/library";
import { fetchFoodByBarcode, FoodProduct } from "../api/foodApi";

interface BarcodeScannerProps {
  onProductLoaded?: (product: FoodProduct) => void;
}

type ScanEventType =
  | "scan_started"
  | "scan_stopped"
  | "scan_success"
  | "scan_failure"
  | "manual_lookup_used"
  | "product_lookup_success"
  | "product_lookup_failed";

interface ScanTelemetryEvent {
  eventType: ScanEventType;
  sessionId: string;
  timestamp: string;
  success?: boolean;
  barcode?: string;
  errorMessage?: string;
  timeToScanMs?: number;
  usedManualEntry?: boolean;
  userAgent?: string;
}

function makeSessionId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onProductLoaded }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const scanSessionIdRef = useRef<string>(makeSessionId());
  const scanStartedAtRef = useRef<number | null>(null);

  const [manualBarcode, setManualBarcode] = useState("");
  const [scanning, setScanning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [basis, setBasis] = useState<"serving" | "100g">("serving");

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();

    return () => {
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore
      }
      controlsRef.current = null;
      setScanning(false);
    };
  }, []);
//yo
  async function logScanEvent(event: Omit<ScanTelemetryEvent, "timestamp" | "userAgent">) {
    try {
      await fetch("https://smartcartcoach2-0.onrender.com/api/scan-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // telemetry should never break scanner UX
    }
  }

  async function handleBarcodeDetected(text: string, usedManualEntry = false) {
    const cleaned = String(text || "").trim();
    if (!cleaned) return;

    setError("");
    setLoading(true);

    try {
      const p = await fetchFoodByBarcode(cleaned);
      setProduct(p);
      onProductLoaded?.(p);

      await logScanEvent({
        eventType: "product_lookup_success",
        sessionId: scanSessionIdRef.current,
        success: true,
        barcode: cleaned,
        usedManualEntry,
        timeToScanMs:
          scanStartedAtRef.current != null ? Date.now() - scanStartedAtRef.current : undefined,
      });
    } catch (e: any) {
      setProduct(null);
      setError(e?.message || "Could not fetch product for that barcode");

      await logScanEvent({
        eventType: "product_lookup_failed",
        sessionId: scanSessionIdRef.current,
        success: false,
        barcode: cleaned,
        errorMessage: e?.message || "Could not fetch product for that barcode",
        usedManualEntry,
        timeToScanMs:
          scanStartedAtRef.current != null ? Date.now() - scanStartedAtRef.current : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function startScan() {
    setError("");
    setProduct(null);

    if (!readerRef.current) {
      setError("Scanner not ready.");
      await logScanEvent({
        eventType: "scan_failure",
        sessionId: scanSessionIdRef.current,
        success: false,
        errorMessage: "Scanner not ready.",
      });
      return;
    }

    if (!videoRef.current) {
      setError("Video element not available.");
      await logScanEvent({
        eventType: "scan_failure",
        sessionId: scanSessionIdRef.current,
        success: false,
        errorMessage: "Video element not available.",
      });
      return;
    }

    try {
      scanSessionIdRef.current = makeSessionId();
      scanStartedAtRef.current = Date.now();

      await logScanEvent({
        eventType: "scan_started",
        sessionId: scanSessionIdRef.current,
        success: true,
      });

      setScanning(true);

      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result: Result | undefined) => {
          if (!result) return;

          const text = result.getText();
          if (!text) return;

          try {
            controls.stop();
          } catch {
            // ignore
          }

          controlsRef.current = null;
          setScanning(false);

          await logScanEvent({
            eventType: "scan_success",
            sessionId: scanSessionIdRef.current,
            success: true,
            barcode: text,
            timeToScanMs:
              scanStartedAtRef.current != null ? Date.now() - scanStartedAtRef.current : undefined,
          });

          await handleBarcodeDetected(text, false);
        }
      );

      controlsRef.current = controls;
    } catch (err: any) {
      console.error(err);
      setScanning(false);
      setError("Could not start camera. Check browser permissions and try again.");

      await logScanEvent({
        eventType: "scan_failure",
        sessionId: scanSessionIdRef.current,
        success: false,
        errorMessage: err?.message || "Could not start camera",
      });
    }
  }

  async function stopScan() {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }

    controlsRef.current = null;
    setScanning(false);

    await logScanEvent({
      eventType: "scan_stopped",
      sessionId: scanSessionIdRef.current,
      success: true,
      timeToScanMs:
        scanStartedAtRef.current != null ? Date.now() - scanStartedAtRef.current : undefined,
    });
  }

  async function handleManualLookup() {
    const cleaned = manualBarcode.trim();
    if (!cleaned) return;

    scanSessionIdRef.current = makeSessionId();
    scanStartedAtRef.current = Date.now();

    await logScanEvent({
      eventType: "manual_lookup_used",
      sessionId: scanSessionIdRef.current,
      success: true,
      barcode: cleaned,
      usedManualEntry: true,
    });

    await handleBarcodeDetected(cleaned, true);
  }

  const servingAvailable =
    !!product &&
    Object.values(product.nutrimentsPerServing || {}).some((v) => v != null);

  const shown =
    basis === "serving" && servingAvailable && product
      ? product.nutrimentsPerServing
      : product?.nutriments;

  const nutritionLabel =
    basis === "serving" && servingAvailable
      ? `per serving${product?.servingSize ? ` (${product.servingSize})` : ""}`
      : "per 100g";

  return (
    <div className="card">
      <h3>Barcode Scanner</h3>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              maxWidth: 520,
              borderRadius: 8,
              background: "#111",
            }}
            muted
            playsInline
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!scanning ? (
              <button type="button" onClick={startScan}>
                Start camera scan
              </button>
            ) : (
              <button type="button" onClick={stopScan}>
                Stop scan
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Manual barcode</span>
            <input
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Type barcode (e.g., 737628064502)"
            />
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleManualLookup}
              disabled={loading || !manualBarcode.trim()}
            >
              Lookup barcode
            </button>

            <button
              type="button"
              onClick={() => {
                setManualBarcode("");
                setProduct(null);
                setError("");
              }}
              disabled={loading}
            >
              Clear
            </button>
          </div>

          {loading && <p>Loading product…</p>}
          {error && <p style={{ color: "crimson" }}>{error}</p>}
        </div>

        {product && (
          <div style={{ marginTop: 10 }}>
            <h4 style={{ marginBottom: 6 }}>Result</h4>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      background: "#222",
                      display: "grid",
                      placeItems: "center",
                      color: "#bbb",
                      fontSize: 12,
                    }}
                  >
                    No image
                  </div>
                )}

                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 700 }}>{product.name}</div>
                  {!!product.brand && <div>Brand: {product.brand}</div>}
                  {!!product.quantity && <div>Qty: {product.quantity}</div>}
                  <div>Barcode: {product.barcode}</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0 }}>Macros ({nutritionLabel})</h4>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setBasis("serving")}
                      disabled={!servingAvailable}
                      title={!servingAvailable ? "No serving data available for this product" : ""}
                    >
                      Per serving
                    </button>
                    <button type="button" onClick={() => setBasis("100g")}>
                      Per 100g
                    </button>
                  </div>
                </div>

                <ul style={{ paddingLeft: "1.2rem", marginTop: 0 }}>
                  {shown?.energyKcal != null && <li>Energy: {shown.energyKcal} kcal</li>}
                  {shown?.carbs != null && <li>Carbs: {shown.carbs} g</li>}
                  {shown?.sugars != null && <li>Sugars: {shown.sugars} g</li>}
                  {shown?.fat != null && <li>Fat: {shown.fat} g</li>}
                  {shown?.protein != null && <li>Protein: {shown.protein} g</li>}
                  {shown?.salt != null && <li>Salt: {shown.salt} g</li>}
                  {shown?.fiber != null && <li>Fiber: {shown.fiber} g</li>}
                </ul>

                {!servingAvailable && (
                  <p style={{ marginTop: 0, fontSize: 12, opacity: 0.8 }}>
                    Serving macros weren’t provided for this product, so we’re showing per-100g values.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};