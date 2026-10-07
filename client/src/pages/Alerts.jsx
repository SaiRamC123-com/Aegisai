import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, CheckCheck, Waves, Flame, RefreshCw } from "lucide-react";
import useAlerts from "../hooks/useAlerts";
import LevelBadge from "../components/LevelBadge";
import { levelColor } from "../utils/risk";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "acknowledged", label: "Acknowledged" },
];

const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function Alerts() {
  const { alerts, unacknowledged, loading, error, refresh, acknowledge } = useAlerts(10000);
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    switch (filter) {
      case "active": return alerts.filter((a) => !a.acknowledged);
      case "acknowledged": return alerts.filter((a) => a.acknowledged);
      case "critical":
      case "high": return alerts.filter((a) => a.level === filter);
      default: return alerts;
    }
  }, [alerts, filter]);

  const ackAll = () => alerts.filter((a) => !a.acknowledged).forEach((a) => acknowledge(a.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
            <Bell className="h-8 w-8 text-risk-high" />
            Alert <span className="text-gradient">Center</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {unacknowledged} active · {alerts.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-ghost">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={ackAll} disabled={!unacknowledged} className="btn-ghost disabled:opacity-40">
            <CheckCheck className="h-4 w-4" /> Acknowledge all
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? "text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {filter === f.key && (
              <motion.span
                layoutId="alert-filter"
                className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/20"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      )}
      {error && !alerts.length && <p className="glass p-6 text-risk-critical">{error}</p>}

      {!loading && !visible.length && !error && (
        <div className="glass grid place-items-center gap-3 p-14 text-center">
          <CheckCheck className="h-10 w-10 text-risk-low" />
          <p className="font-display text-lg font-semibold text-white">All clear</p>
          <p className="text-sm text-slate-400">No alerts match this filter right now.</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {visible.map((a) => {
            const color = levelColor(a.level);
            const HazardIcon = a.hazard === "heat" ? Flame : Waves;
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: a.acknowledged ? 0.55 : 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.3 }}
                className="glass flex items-center gap-4 p-4"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${color}22`, color }}
                >
                  <HazardIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/zones/${a.zoneId}`} className="font-display font-semibold text-white hover:underline">
                      {a.zoneName}
                    </Link>
                    <LevelBadge level={a.level} />
                    <span className="text-xs text-slate-500">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{a.message}</p>
                </div>
                {a.acknowledged ? (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Check className="h-4 w-4" /> Done
                  </span>
                ) : (
                  <button onClick={() => acknowledge(a.id)} className="btn-ghost shrink-0 !px-3">
                    <Check className="h-4 w-4" /> Ack
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}