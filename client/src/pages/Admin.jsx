import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Server, Cpu, CloudSun, Radar, Loader2 } from "lucide-react";
import useZones from "../hooks/useZones";
import useAlerts from "../hooks/useAlerts";
import LevelBadge from "../components/LevelBadge";
import { getHealth } from "../services/api";

const STATUS_COLOR = { ok: "#34d399", warn: "#fbbf24", down: "#f43f5e" };

function StatusCard({ icon: Icon, label, status, value, detail }) {
  const c = STATUS_COLOR[status];
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-slate-400" />
        <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: c }}>
          <span className="h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
          {value}
        </span>
      </div>
      <p className="mt-3 font-display text-lg font-semibold text-white">{label}</p>
      <p className="text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function Admin() {
  const { zones } = useZones(30000);
  const { alerts, scan } = useAlerts(30000);
  const [health, setHealth] = useState({ state: "checking", ms: 0 });
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    const check = async () => {
      const t0 = performance.now();
      try {
        await getHealth();
        setHealth({ state: "ok", ms: Math.round(performance.now() - t0) });
      } catch {
        setHealth({ state: "down", ms: 0 });
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, []);

  const mlOnline = zones.some((z) => z.source === "ml");
  const liveWeather = zones.some((z) => z.weather?.source === "openweather");
  const active = alerts.filter((a) => !a.acknowledged).length;

  const runScan = async () => {
    setScanning(true);
    setResult("");
    try {
      const r = await scan();
      setResult(`Scanned ${r.scanned} zones, created ${r.created.length} new alert(s).`);
    } catch (err) {
      setResult(err.userMessage || err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
          <ShieldCheck className="h-8 w-8 text-risk-low" />
          Admin <span className="text-gradient">Console</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">System health and manual controls</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={Server}
          label="API server"
          status={health.state === "ok" ? "ok" : health.state === "down" ? "down" : "warn"}
          value={health.state === "ok" ? "Online" : health.state === "down" ? "Offline" : "Checking"}
          detail={health.state === "ok" ? `${health.ms} ms response` : "No response from /api/health"}
        />
        <StatusCard
          icon={Cpu}
          label="ML service"
          status={mlOnline ? "ok" : "warn"}
          value={mlOnline ? "Model active" : "Fallback"}
          detail={mlOnline ? "Scores come from the trained model" : "Using the rule-based engine"}
        />
        <StatusCard
          icon={CloudSun}
          label="Weather feed"
          status={liveWeather ? "ok" : "warn"}
          value={liveWeather ? "OpenWeather" : "Simulated"}
          detail={liveWeather ? "Live conditions" : "Add OPENWEATHER_API_KEY for live data"}
        />
        <StatusCard
          icon={Radar}
          label="Alert engine"
          status="ok"
          value={`${active} active`}
          detail={`${alerts.length} alerts stored`}
        />
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Manual alert scan</h3>
          <p className="text-sm text-slate-400">
            Re-evaluate every zone now. Duplicate alerts within 30 minutes are skipped.
          </p>
          {result && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-aegis-300">
              {result}
            </motion.p>
          )}
        </div>
        <button onClick={runScan} disabled={scanning} className="btn-primary">
          {scanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Radar className="h-5 w-5" />}
          Run scan
        </button>
      </div>

      <div className="glass overflow-x-auto p-5">
        <h3 className="mb-4 font-display text-lg font-semibold text-white">Zone engine output</h3>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="pb-3">Zone</th>
              <th className="pb-3">Hazard</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">Level</th>
              <th className="pb-3">Engine</th>
              <th className="pb-3">Weather</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {zones.map((z) => (
              <tr key={z.zoneId} className="text-slate-300">
                <td className="py-3 font-medium text-white">{z.name}</td>
                <td className="py-3 capitalize">{z.hazard}</td>
                <td className="py-3">{z.score}</td>
                <td className="py-3"><LevelBadge level={z.level} /></td>
                <td className="py-3">{z.source === "ml" ? "ML model" : "Rules"}</td>
                <td className="py-3">{z.weather.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}