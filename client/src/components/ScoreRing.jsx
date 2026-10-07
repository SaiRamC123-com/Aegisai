import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import { levelColor } from "../utils/risk";

export default function ScoreRing({ score, level, size = 84, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = levelColor(level);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100), stroke: color }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="font-display font-bold text-white"
          style={{ fontSize: size * 0.28 }}
        >
          <AnimatedNumber value={score} />
        </span>
      </div>
    </div>
  );
}