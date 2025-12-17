import React, { useEffect, useMemo, useState } from "react";

export type HeightUnit = "in" | "cm";
export type WeightUnit = "lb" | "kg";

export interface UserProfileData {
  name: string;
  birthday: string; // YYYY-MM-DD
  height: {
    value: number | null;
    unit: HeightUnit;
  };
  weight: {
    value: number | null;
    unit: WeightUnit;
  };
  goalWeight: {
    value: number | null;
    unit: WeightUnit;
  };
  updatedAt: string; // ISO
}

const STORAGE_KEY = "smartcart_user_profile_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toNumberOrNull(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function heightToMeters(value: number, unit: HeightUnit): number {
  // inches -> meters, cm -> meters
  return unit === "in" ? value * 0.0254 : value / 100;
}

function weightToKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? value * 0.45359237 : value;
}

function calcBmi(weightKg: number, heightM: number): number | null {
  if (heightM <= 0) return null;
  const bmi = weightKg / (heightM * heightM);
  return Number.isFinite(bmi) ? round1(bmi) : null;
}

const defaultProfile: UserProfileData = {
  name: "",
  birthday: "",
  height: { value: null, unit: "in" },
  weight: { value: null, unit: "lb" },
  goalWeight: { value: null, unit: "lb" },
  updatedAt: new Date(0).toISOString(),
};

export const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileData>(defaultProfile);
  const [loaded, setLoaded] = useState(false);
  const [savedToast, setSavedToast] = useState("");

  // Load once
  useEffect(() => {
    const stored = safeJsonParse<UserProfileData>(localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored === "object") setProfile({ ...defaultProfile, ...stored });
    setLoaded(true);
  }, []);

  // Derived metrics (optional but useful)
  const bmi = useMemo(() => {
    if (profile.weight.value == null || profile.height.value == null) return null;
    const kg = weightToKg(profile.weight.value, profile.weight.unit);
    const m = heightToMeters(profile.height.value, profile.height.unit);
    return calcBmi(kg, m);
  }, [profile.weight.value, profile.weight.unit, profile.height.value, profile.height.unit]);

  const goalDelta = useMemo(() => {
    if (profile.weight.value == null || profile.goalWeight.value == null) return null;

    // Convert goal to same unit as current for a clean delta
    const currentKg = weightToKg(profile.weight.value, profile.weight.unit);
    const goalKg = weightToKg(profile.goalWeight.value, profile.goalWeight.unit);
    const deltaKg = goalKg - currentKg;

    if (!Number.isFinite(deltaKg)) return null;

    // Show delta in the user's current unit
    if (profile.weight.unit === "lb") {
      const deltaLb = deltaKg / 0.45359237;
      return { value: round1(deltaLb), unit: "lb" as const };
    }
    return { value: round1(deltaKg), unit: "kg" as const };
  }, [profile.weight.value, profile.weight.unit, profile.goalWeight.value, profile.goalWeight.unit]);

  function save() {
    const toSave: UserProfileData = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setProfile(toSave);

    setSavedToast("Saved!");
    window.setTimeout(() => setSavedToast(""), 1200);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(defaultProfile);
  }

  if (!loaded) return <div className="card">Loading profile…</div>;

  return (
    <div className="card">
      <h3>User Profile</h3>

      <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        {/* NAME */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Name</span>
          <input
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>

        {/* BIRTHDAY */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Birthday</span>
          <input
            type="date"
            value={profile.birthday}
            onChange={(e) => setProfile((p) => ({ ...p, birthday: e.target.value }))}
          />
        </label>

        {/* HEIGHT */}
        <div style={{ display: "grid", gap: 6 }}>
          <span>Height</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              inputMode="decimal"
              value={profile.height.value ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  height: { ...p.height, value: toNumberOrNull(e.target.value) },
                }))
              }
              placeholder={profile.height.unit === "in" ? "inches" : "cm"}
              style={{ flex: "1 1 160px" }}
            />

            <select
              value={profile.height.unit}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  height: { ...p.height, unit: e.target.value as HeightUnit },
                }))
              }
              style={{ flex: "0 0 120px" }}
            >
              <option value="in">in</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        {/* WEIGHT */}
        <div style={{ display: "grid", gap: 6 }}>
          <span>Current weight</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              inputMode="decimal"
              value={profile.weight.value ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  weight: { ...p.weight, value: toNumberOrNull(e.target.value) },
                }))
              }
              placeholder={profile.weight.unit === "lb" ? "lbs" : "kg"}
              style={{ flex: "1 1 160px" }}
            />

            <select
              value={profile.weight.unit}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  weight: { ...p.weight, unit: e.target.value as WeightUnit },
                }))
              }
              style={{ flex: "0 0 120px" }}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        {/* GOAL WEIGHT */}
        <div style={{ display: "grid", gap: 6 }}>
          <span>Goal weight</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              inputMode="decimal"
              value={profile.goalWeight.value ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  goalWeight: { ...p.goalWeight, value: toNumberOrNull(e.target.value) },
                }))
              }
              placeholder={profile.goalWeight.unit === "lb" ? "lbs" : "kg"}
              style={{ flex: "1 1 160px" }}
            />

            <select
              value={profile.goalWeight.unit}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  goalWeight: { ...p.goalWeight, unit: e.target.value as WeightUnit },
                }))
              }
              style={{ flex: "0 0 120px" }}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        {/* SUMMARY */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 700 }}>Quick summary</div>
          <div style={{ opacity: 0.9 }}>
            {profile.name ? profile.name : "Unnamed"}{" "}
            {profile.birthday ? `(b. ${profile.birthday})` : ""}
          </div>

          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Height: {profile.height.value ?? "-"} {profile.height.unit}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Weight: {profile.weight.value ?? "-"} {profile.weight.unit}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Goal: {profile.goalWeight.value ?? "-"} {profile.goalWeight.unit}
          </div>

          <div style={{ fontSize: 14, opacity: 0.9 }}>
            BMI: {bmi ?? "-"}
          </div>

          <div style={{ fontSize: 14, opacity: 0.9 }}>
            To goal:{" "}
            {goalDelta
              ? `${goalDelta.value > 0 ? "+" : ""}${goalDelta.value} ${goalDelta.unit}`
              : "-"}
          </div>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Stored locally in your browser (localStorage). Updated:{" "}
            {profile.updatedAt && profile.updatedAt !== new Date(0).toISOString()
              ? new Date(profile.updatedAt).toLocaleString()
              : "never"}
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={save}>
            Save profile
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
          {savedToast && (
            <span style={{ alignSelf: "center", fontWeight: 700, opacity: 0.9 }}>
              {savedToast}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};