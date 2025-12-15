import { useMemo, useState } from "react";

type Rating = number;

const DIMENSIONS = [
  { key: "mental", label: "Mental Demand", desc: "How mentally demanding was the task?" },
  { key: "physical", label: "Physical Demand", desc: "How physically demanding was the task?" },
  { key: "temporal", label: "Temporal Demand", desc: "How hurried or rushed was the pace?" },
  { key: "performance", label: "Performance", desc: "How successful were you in accomplishing what you were asked to do?" },
  { key: "effort", label: "Effort", desc: "How hard did you have to work to accomplish your level of performance?" },
  { key: "frustration", label: "Frustration", desc: "How stressed, irritated, or annoyed were you?" },
] as const;

export type NasaTlxResult = {
  type: "NASA_TLX";
  participantId?: string;
  timestamp: string;
  answers: Record<string, number>;
  tlxAverage: number;
  notes?: string;
};

export default function NasaTlxSurvey(props: { onSave: (result: NasaTlxResult) => void }) {
  const [participantId, setParticipantId] = useState("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, Rating | undefined>>({});

  const allAnswered = useMemo(() => {
    return DIMENSIONS.every((d) => typeof answers[d.key] === "number");
  }, [answers]);

  const tlxAverage = useMemo(() => {
    if (!allAnswered) return null;
    const vals = DIMENSIONS.map((d) => answers[d.key] as number);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(avg);
  }, [allAnswered, answers]);

  function save() {
    if (!allAnswered || tlxAverage === null) return;

    const numeric: Record<string, number> = {};
    for (const d of DIMENSIONS) numeric[d.key] = answers[d.key] as number;

    props.onSave({
      type: "NASA_TLX",
      participantId: participantId.trim() || undefined,
      timestamp: new Date().toISOString(),
      answers: numeric,
      tlxAverage,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>NASA-TLX (Quick)</h2>
      <p>Rate each dimension from 0 to 100. (Higher usually means more workload; performance is “better”.)</p>

      <label style={{ display: "block", marginBottom: 12 }}>
        Participant ID (optional)
        <input
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          placeholder="P01"
        />
      </label>

      <div style={{ display: "grid", gap: 12 }}>
        {DIMENSIONS.map((d) => (
          <div key={d.key} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 800 }}>{d.label}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{d.desc}</div>

            <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={answers[d.key] ?? 0}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [d.key]: Number(e.target.value) }))}
                style={{ width: 320 }}
              />
              <strong>{answers[d.key] ?? 0}</strong>
            </div>
          </div>
        ))}
      </div>

      <label style={{ display: "block", marginTop: 12 }}>
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ display: "block", width: "100%", padding: 10, marginTop: 6, minHeight: 90 }}
          placeholder="Where did it feel heavy? What would you change?"
        />
      </label>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
        <button
          onClick={save}
          disabled={!allAnswered}
          style={{ padding: "10px 14px", cursor: allAnswered ? "pointer" : "not-allowed" }}
        >
          Save NASA-TLX
        </button>

        {tlxAverage !== null && (
          <div>
            <strong>Avg Workload:</strong> {tlxAverage}/100
          </div>
        )}
      </div>
    </div>
  );
}