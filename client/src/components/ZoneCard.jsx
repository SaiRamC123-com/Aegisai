import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Waves, Flame, CloudRain, Thermometer, Droplets, ArrowUpRight } from "lucide-react";
import ScoreRing from "./ScoreRing";
import LevelBadge from "./LevelBadge";
import { levelColor } from "../utils/risk";

export default function ZoneCard({ zone, index = 0 }) {
  const color = levelColor(zone.level);
  const HazardIcon = zone.hazard === "heat" ? Flame : Waves;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link
        to={`/zones/${zone.zoneId}`}
        className={`glass glass-hover group block p-5 ${
          zone.level === "critical" ? "pulse-critical" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: `${color}22`, color }}
            >
              <HazardIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold leading-tight text-white">
                {zone.name}
              </h3>
              <p className="text-xs capitalize text-slate-400">{zone.hazard} risk</p>
            </div>
          </div>
          <LevelBadge level={zone.level} />
        </div>

        <div className="mt-5 flex items-center gap-5">
          <ScoreRing score={zone.score} level={zone.level} />
          <div className="grid flex-1 gap-2 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-aegis-400" />
              {zone.weather.rain1h} mm/h
            </span>
            <span className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-risk-high" />
              {zone.weather.temp}°C
            </span>
            <span className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-violet-glow" />
              {zone.weather.humidity}%
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span className="truncate">Top driver: {zone.factors[0]?.label}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}