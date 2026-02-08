import { useMemo, useState } from "react";

type Likert = 1 | 2 | 3 | 4 | 5;

const SUS_ITEMS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
] as const;

function computeSusScore(answers: Record<string, number>) {
  let sum = 0;
  for (let i = 1; i <= 10; i++) {
    const x = answers[`q${i}`];
    if (typeof x !== "number") continue;
    if (i % 2 === 1) sum += x - 1; // odd
    else sum += 5 - x; // even
  }
  return Math.round(sum * 2.5);
}

export type SusResult = {
  type: "SUS";
  participantId?: string;
  timestamp: string;
  answers: Record<string, number>;
  susScore: number;
  notes?: string;
};

export default function SusSurvey(props: { onSave: (result: SusResult) => void }) {
  const [participantId, setParticipantId] = useState("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, Likert | undefined>>({});

  const allAnswered = useMemo(() => {
    for (let i = 1; i <= 10; i++) if (!answers[`q${i}`]) return false;
    return true;
  }, [answers]);

  const susScore = useMemo(() => {
    if (!allAnswered) return null;
    const numeric: Record<string, number> = {};
    for (let i = 1; i <= 10; i++) numeric[`q${i}`] = answers[`q${i}`] as number;
    return computeSusScore(numeric);
  }, [allAnswered, answers]);

  function save() {
    if (!allAnswered || susScore === null) return;

    const numeric: Record<string, number> = {};
    for (let i = 1; i <= 10; i++) numeric[`q${i}`] = answers[`q${i}`] as number;

    props.onSave({
      type: "SUS",
      participantId: participantId.trim() || undefined,
      timestamp: new Date().toISOString(),
      answers: numeric,
      susScore,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>SUS Survey</h2>
      <p>Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).</p>

      <label style={{ display: "block", marginBottom: 12 }}>
        Participant ID (optional)
        <input
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          placeholder="P01"
        />
      </label>

      <ol style={{ paddingLeft: 18 }}>
        {SUS_ITEMS.map((text, idx) => {
          const q = `q${idx + 1}`;
          const value = answers[q];
          return (
            <li key={q} style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 8 }}>{text}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="radio"
                      name={q}
                      checked={value === n}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q]: n as Likert }))}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      <label style={{ display: "block", marginTop: 10 }}>
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ display: "block", width: "100%", padding: 10, marginTop: 6, minHeight: 90 }}
          placeholder="What felt smooth/confusing?"
        />
      </label>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
        <button
          onClick={save}
          disabled={!allAnswered}
          style={{ padding: "10px 14px", cursor: allAnswered ? "pointer" : "not-allowed" }}
        >
          Save SUS
        </button>

        {susScore !== null && (
          <div>
            <strong>SUS Score:</strong> {susScore}/100
          </div>
        )}
      </div>
    </div>
  );
}