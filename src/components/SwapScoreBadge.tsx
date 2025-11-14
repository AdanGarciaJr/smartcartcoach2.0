import React from "react";

interface Props {
  score: number;
}

function getSwapScoreLabel(score: number): string {
  if (score >= 75) return "Great";
  if (score >= 50) return "OK";
  return "Poor";
}

function getSwapScoreColor(score: number): string {
  if (score >= 75) return "#16a34a"; // green
  if (score >= 50) return "#eab308"; // yellow
  return "#dc2626"; // red
}

export const SwapScoreBadge: React.FC<Props> = ({ score }) => {
  const label = getSwapScoreLabel(score);
  const color = getSwapScoreColor(score);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.15rem 0.5rem",
        borderRadius: "9999px",
        backgroundColor: "#0f172a",
        color: "#e5e7eb",
        fontSize: "0.8rem"
      }}
    >
      <span
        style={{
          width: "0.6rem",
          height: "0.6rem",
          borderRadius: "9999px",
          backgroundColor: color
        }}
      />
      <span>{label}</span>
      <span style={{ opacity: 0.85 }}>({score.toFixed(0)})</span>
    </span>
  );
};