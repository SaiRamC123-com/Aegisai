import { levelColor, levelLabel } from "../utils/risk";

export default function LevelBadge({ level }) {
  const c = levelColor(level);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color: c, background: `${c}1f`, border: `1px solid ${c}55` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {levelLabel(level)}
    </span>
  );
}