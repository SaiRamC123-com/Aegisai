import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, MapPinned, ShieldAlert, Gauge, BellRing } from "lucide-react";
import useZones from "../hooks/useZones";
import useAlerts from "../hooks/useAlerts";
import AnimatedNumber from "../components/AnimatedNumber";
import AlertBanner from "../components/AlertBanner";
import RiskMap from "../components/RiskMap";
import TrendChart from "../components/TrendChart";
import ZoneCard from "../components/ZoneCard";
import LevelBadge from "../components/LevelBadge";
import { levelColor } from "../utils/risk";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function StatCard({ icon: Icon, label, value, decimals = 0, suffix = "", color }) {
  return (
    <motion.div variants={item} className="glass glass-hover p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div
          className="grid h-9 w-9 place-items-center rounded-lg"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 font-display text-4xl font-bold text-white">
        <AnimatedNumber value={value} decimals={decimals} />
        {suffix && <span className="ml-1 text-lg text-slate-400">{suffix}</span>}
      </p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { zones, history, loading, error, lastUpdated, refresh } = useZones(15000);
  const { alerts, acknowledge } = useAlerts();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    setSpinning(true);
    await refresh();
    setSpinning(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
        <div className="skeleton h-[440px]" />
      </div>
    );
  }

  if (error && !zones.length) {
    return (
      <div className="glass mx-auto mt-16 max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-risk-critical" />
        <h2 className="mt-4 font-display text-xl font-semibold text-white">Can't load risk data</h2>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <button onClick={handleRefresh} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    );
  }

  const ranked = [...zones].sort((a, b) => b.score - a.score);
  const elevated = zones.filter((z) => z.level === "high" || z.level === "critical").length;
  const avg = zones.length ? zones.reduce((s, z) => s + z.score, 0) / zones.length : 0;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Risk <span className="text-gradient">Overview</span>
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <span className="live-dot" />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Connecting…"}
          </p>
        </div>
        <button onClick={handleRefresh} className="btn-ghost">
          <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <AlertBanner alerts={alerts} onAcknowledge={acknowledge} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard icon={MapPinned} label="Zones monitored" value={zones.length} color="#38bdf8" />
        <StatCard icon={ShieldAlert} label="High / critical zones" value={elevated} color="#f43f5e" />
        <StatCard icon={Gauge} label="Average risk" value={avg} decimals={1} suffix="/100" color="#a78bfa" />
        <StatCard icon={BellRing} label="Active alerts" value={activeAlerts} color="#fb923c" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskMap zones={zones} />
        </div>

        <div className="glass p-5">
          <h3 className="font-display text-lg font-semibold text-white">Priority zones</h3>
          <p className="text-xs text-slate-400">Ranked by current risk</p>
          <div className="mt-4 space-y-4">
            {ranked.slice(0, 5).map((z, i) => (
              <Link key={z.zoneId} to={`/zones/${z.zoneId}`} className="block">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <span className="text-slate-500">{i + 1}</span>
                    {z.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <LevelBadge level={z.level} />
                    <span className="w-7 text-right text-slate-300">{z.score}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: levelColor(z.level) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${z.score}%` }}
                    transition={{ duration: 0.9, delay: i * 0.08 }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <TrendChart history={history} zones={zones} />

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">All zones</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ranked.map((z, i) => (
            <ZoneCard key={z.zoneId} zone={z} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}