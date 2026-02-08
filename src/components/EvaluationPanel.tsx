import { useEffect, useMemo, useState } from "react";
import SusSurvey, { SusResult } from "./SusSurvey";
import NasaTlxSurvey, { NasaTlxResult } from "./NasaTlxSurvey";

type EvalRecord = SusResult | NasaTlxResult;

const STORAGE_KEY = "smartcart_evaluation_records_v1";

function loadRecords(): EvalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvalRecord[]) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: EvalRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EvaluationPanel(props: { onClose: () => void }) {
  const [tab, setTab] = useState<"sus" | "tlx" | "records">("sus");
  const [records, setRecords] = useState<EvalRecord[]>([]);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  function addRecord(r: EvalRecord) {
    const next = [r, ...records];
    setRecords(next);
    saveRecords(next);
    setTab("records");
  }

  const summary = useMemo(() => {
    const sus = records.filter((r) => r.type === "SUS") as SusResult[];
    const tlx = records.filter((r) => r.type === "NASA_TLX") as NasaTlxResult[];

    const avgSus = sus.length ? Math.round(sus.reduce((a, b) => a + b.susScore, 0) / sus.length) : null;
    const avgTlx = tlx.length ? Math.round(tlx.reduce((a, b) => a + b.tlxAverage, 0) / tlx.length) : null;

    return { susCount: sus.length, tlxCount: tlx.length, avgSus, avgTlx };
  }, [records]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 12,
      }}
    >
      <div style={{ width: "min(980px, 100%)", background: "#fff", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid #eee" }}>
          <strong style={{ flex: 1 }}>Evaluation</strong>

          <button onClick={() => setTab("sus")} style={{ padding: "8px 10px" }}>
            SUS
          </button>
          <button onClick={() => setTab("tlx")} style={{ padding: "8px 10px" }}>
            NASA-TLX
          </button>
          <button onClick={() => setTab("records")} style={{ padding: "8px 10px" }}>
            Records ({records.length})
          </button>

          <button onClick={props.onClose} style={{ padding: "8px 10px" }}>
            Close
          </button>
        </div>

        <div style={{ padding: 12, borderBottom: "1px solid #eee", fontSize: 14 }}>
          <span style={{ marginRight: 14 }}>SUS: <strong>{summary.susCount}</strong></span>
          <span style={{ marginRight: 14 }}>NASA-TLX: <strong>{summary.tlxCount}</strong></span>
          <span style={{ marginRight: 14 }}>Avg SUS: <strong>{summary.avgSus ?? "-"}</strong></span>
          <span>Avg TLX: <strong>{summary.avgTlx ?? "-"}</strong></span>
        </div>

        {tab === "sus" && <SusSurvey onSave={addRecord} />}
        {tab === "tlx" && <NasaTlxSurvey onSave={addRecord} />}

        {tab === "records" && (
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <button
                onClick={() => downloadJson(`smartcart-eval-${new Date().toISOString().slice(0, 10)}.json`, records)}
                style={{ padding: "10px 12px" }}
                disabled={!records.length}
              >
                Download JSON
              </button>

              <button
                onClick={() => {
                  if (!confirm("Clear all saved evaluation records?")) return;
                  setRecords([]);
                  saveRecords([]);
                }}
                style={{ padding: "10px 12px" }}
                disabled={!records.length}
              >
                Clear Records
              </button>
            </div>

            {!records.length ? (
              <p>No records yet. Fill out SUS or NASA-TLX and save.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {records.map((r, i) => (
                  <div key={r.timestamp + i} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{r.type}</strong>
                      <span style={{ opacity: 0.7 }}>{new Date(r.timestamp).toLocaleString()}</span>
                      {r.participantId && <span>Participant: <strong>{r.participantId}</strong></span>}
                      {"susScore" in r && <span>SUS: <strong>{r.susScore}</strong></span>}
                      {"tlxAverage" in r && <span>TLX Avg: <strong>{r.tlxAverage}</strong></span>}
                    </div>
                    {r.notes && <div style={{ marginTop: 8 }}><strong>Notes:</strong> {r.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}