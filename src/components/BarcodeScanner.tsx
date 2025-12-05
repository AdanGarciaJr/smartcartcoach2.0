import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Result } from "@zxing/library";
import { fetchFoodByBarcode, FoodProduct } from "../api/foodApi";

interface BarcodeScannerProps {
  onProductLoaded?: (product: FoodProduct) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onProductLoaded,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [scanning, setScanning] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string>("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState<string>("");
  const [product, setProduct] = useState<FoodProduct | null>(null);

  // Initialize reader and clean up on unmount
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, []);

  const startScanning = async () => {
    setError("");
    setProduct(null);
    setLastBarcode("");
    setScanning(true);

    try {
      const reader = readerRef.current;
      const video = videoRef.current;

      if (!reader || !video) {
        throw new Error("Camera not ready");
      }

      const controls = await reader.decodeFromVideoDevice(
        undefined, // let browser pick the camera
        video,
        async (
          result: Result | undefined,
          _err: unknown,
          innerControls: IScannerControls
        ) => {
          if (result) {
            const text = result.getText();

            // stop scanning after first successful result
            innerControls.stop();
            controlsRef.current = null;
            setScanning(false);

            await handleBarcodeDetected(text);
          }
        }
      );

      controlsRef.current = controls;
    } catch (err) {
      console.error(err);
      setError("Could not start camera. Check browser permissions.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setScanning(false);
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setLastBarcode(barcode);
    setError("");
    setLoadingProduct(true);
    setProduct(null);

    try {
      const food = await fetchFoodByBarcode(barcode);
      setProduct(food);
      if (onProductLoaded) {
        onProductLoaded(food);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not load product info");
    } finally {
      setLoadingProduct(false);
    }
  };

  return (
    <div className="barcode-scanner">
      <h2>Scan a product</h2>

      <div style={{ marginBottom: "0.75rem" }}>
        {!scanning ? (
          <button type="button" onClick={startScanning}>
            Start camera
          </button>
        ) : (
          <button type="button" onClick={stopScanning}>
            Stop camera
          </button>
        )}
      </div>

      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          background: "#000",
        }}
        muted
        autoPlay
        playsInline
      />

      {lastBarcode && (
        <p style={{ marginTop: "0.5rem" }}>
          <strong>Last barcode:</strong> {lastBarcode}
        </p>
      )}

      {loadingProduct && <p>Looking up product details…</p>}

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
      )}

      {product && (
        <div
          style={{
          marginTop: "1rem",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
          backgroundColor: "#f9f9f9",
        }}
        >
          <h3 style={{ marginTop: 0 }}>{product.name}</h3>
          {product.brand && <p>Brand: {product.brand}</p>}
          {product.quantity && <p>Quantity: {product.quantity}</p>}
          <p>Barcode: {product.barcode}</p>

          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{
                maxWidth: "160px",
                borderRadius: "6px",
                marginTop: "0.5rem",
              }}
            />
          )}

          <div style={{ marginTop: "0.75rem" }}>
            <h4>Nutrition (per 100g)</h4>
            <ul style={{ paddingLeft: "1.2rem", marginTop: "0.25rem" }}>
              {product.nutriments.energyKcal != null && (
                <li>Energy: {product.nutriments.energyKcal} kcal</li>
              )}
              {product.nutriments.carbs != null && (
                <li>Carbs: {product.nutriments.carbs} g</li>
              )}
              {product.nutriments.sugars != null && (
                <li>Sugars: {product.nutriments.sugars} g</li>
              )}
              {product.nutriments.fat != null && (
                <li>Fat: {product.nutriments.fat} g</li>
              )}
              {product.nutriments.protein != null && (
                <li>Protein: {product.nutriments.protein} g</li>
              )}
              {product.nutriments.salt != null && (
                <li>Salt: {product.nutriments.salt} g</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};