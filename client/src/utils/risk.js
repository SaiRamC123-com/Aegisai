export const LEVEL_COLOR = {
  low: "#34d399",
  moderate: "#fbbf24",
  high: "#fb923c",
  critical: "#f43f5e",
};

export const levelColor = (level) => LEVEL_COLOR[level] || "#94a3b8";

export const levelLabel = (level) =>
  level ? level.charAt(0).toUpperCase() + level.slice(1) : "";

export const ZONE_COLORS = [
  "#38bdf8", "#a78bfa", "#34d399", "#fbbf24",
  "#fb7185", "#f472b6", "#22d3ee", "#a3e635",
];