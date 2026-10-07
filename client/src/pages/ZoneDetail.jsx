import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CloudRain, Thermometer, Droplets, Wind, SlidersHorizontal, Cpu, Waves, Flame, ShieldAlert,
} from "lucide-react";
import { getZone } from "../services/api";
import ScoreRing from "../components/ScoreRing";
import LevelBadge from "../components/LevelBadge";
import ExplainPanel from "../components/ExplainPanel";

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <Icon className="h-5 w-5" style={{ color }} />
      <p className="mt-3 font-display text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default function ZoneDetail() {
  const { id } = useParams();
  const [zone, setZone] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const load = async () => {
      try {
        const data = await getZone(id);
        if (alive) {
          setZone(data);
          setError("");
        }
      } catch (err) {
        if (alive) setError(err.userMessage || err.message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-56" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (error && !zone) {
    return (
      <div className="glass mx-auto mt-16 max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-risk-critical" />
        <h2 className="mt-4 font-display text-xl font-semibold text-white">{error}</h2>
        <Link to="/" className="btn-primary mt-6">Back to dashboard</Link>
      </div>
    );
  }

  const HazardIcon = zone.hazard === "heat" ? Flame : Waves;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass flex flex-col gap-8 p-6 sm:flex-row sm:items-center"
      >
        <ScoreRing score={zone.score} level={zone.level} size={150} stroke={11} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{zone.name}</h1>
            <LevelBadge level={zone.level} />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            <span className="flex items-center gap-1.5 capitalize">
              <HazardIcon className="h-4 w-4" /> {zone.hazard} risk
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4" /> {zone.source === "ml" ? "ML model" : "Rule-based engine"}
            </span>
            <span>Updated {new Date(zone.computedAt).toLocaleTimeString()}</span>
          </p>
          <Link to={`/simulator?zone=${zone.zoneId}`} className="btn-primary mt-5">
            <SlidersHorizontal className="h-4 w-4" /> Run what-if scenario
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={CloudRain} label="Rainfall (mm/h)" value={zone.weather.rain1h} color="#38bdf8" />
        <Metric icon={Thermometer} label="Temperature (°C)" value={zone.weather.temp} color="#fb923c" />
        <Metric icon={Droplets} label="Humidity (%)" value={zone.weather.humidity} color="#a78bfa" />
        <Metric icon={Wind} label="Wind (m/s)" value={zone.weather.windSpeed} color="#34d399" />
      </div>

      <ExplainPanel zone={zone} />
    </div>
  );
}