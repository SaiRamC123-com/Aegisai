import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  CloudRain, Thermometer, Droplets, RotateCcw, TrendingUp, TrendingDown, Minus, Sun, Flame, AlertTriangle,
} from "lucide-react";
import { simulate } from "../services/api";
import ScoreRing from "./ScoreRing";
import LevelBadge from "./LevelBadge";
import { levelColor } from "../utils/risk";

const PRESETS = [
  { label: "Monsoon downpour", icon: CloudRain, v: { rain1h: 80, temp: 26, humidity: 96 } },
  { label: "Heatwave", icon: Flame, v: { rain1h: 0, temp: 43, humidity: 45 } },
  { label: "Clear day", icon: Sun, v: { rain1h: 0, temp: 28, humidity: 50 } },
];

function Slider({ icon: Icon, label, unit, value, min, max, color, onChange }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-300">
          <Icon className="h-4 w-4" style={{ color }} />
          {label}
        </span>
        <span className="font-display font-semibold text-white">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-aegis-400"
      />
    </div>
  );
}

const fromWeather = (w) => ({
  rain1h: Math.round(w.rain1h),
  temp: Math.round(w.temp),
  humidity: Math.round(w.humidity),
});

export default function WhatIfSimulator({ zones, initialZoneId }) {
  const [zoneId, setZoneId] = useState(initialZoneId || zones[0]?.zoneId);
  const [values, setValues] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  // Load baseline whenever the zone changes
  useEffect(() => {
    if (!zoneId) return;
    let cancelled = false;
    setValues(null);
    setData(null);
    simulate({ zoneId })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setValues(fromWeather(res.baseline.weather));
      })
      .catch((err) => !cancelled && setError(err.userMessage || err.message));
    return () => {
      cancelled = true;
    };
  }, [zoneId]);

  // Re-run the scenario (debounced) when sliders move
  useEffect(() => {
    if (!values || !zoneId) return;
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await simulate({ zoneId, ...values });
        if (id === reqId.current) {
          setData(res);
          setError("");
        }
      } catch (err) {
        if (id === reqId.current) setError(err.userMessage || err.message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [values, zoneId]);

  const set = (key) => (v) => setValues((prev) => ({ ...prev, [key]: v }));
  const delta = data?.scoreDelta ?? 0;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta > 0 ? "#f43f5e" : delta < 0 ? "#34d399" : "#94a3b8";

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Controls */}
      <div className="glass space-y-6 p-6 lg:col-span-2">
        <div>
          <label className="mb-2 block text-sm text-slate-400">Zone</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="input"
          >
            {zones.map((z) => (
              <option key={z.zoneId} value={z.zoneId} className="bg-ink-900">
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setValues(p.v)}
              disabled={!values}
              className="btn-ghost !px-3 !py-1.5 text-xs"
            >
              <p.icon className="h-3.5 w-3.5" /> {p.label}
            </button>
          ))}
        </div>

        {values ? (
          <div className="space-y-6">
            <Slider icon={CloudRain} label="Rainfall" unit=" mm/h" value={values.rain1h} min={0} max={100} color="#38bdf8" onChange={set("rain1h")} />
            <Slider icon={Thermometer} label="Temperature" unit="°C" value={values.temp} min={15} max={48} color="#fb923c" onChange={set("temp")} />
            <Slider icon={Droplets} label="Humidity" unit="%" value={values.humidity} min={30} max={100} color="#a78bfa" onChange={set("humidity")} />
            <button
              onClick={() => setValues(fromWeather(data.baseline.weather))}
              className="btn-ghost w-full justify-center"
            >
              <RotateCcw className="h-4 w-4" /> Reset to current conditions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        )}

        {error && <p className="rounded-lg bg-risk-critical/10 p-3 text-sm text-risk-critical">{error}</p>}
      </div>

      {/* Results */}
      <div className="space-y-6 lg:col-span-3">
        <div className="glass p-6">
          {data ? (
            <>
              <div className="flex items-center justify-around gap-4">
                <div className="text-center">
                  <p className="mb-3 text-xs uppercase tracking-wider text-slate-400">Current</p>
                  <ScoreRing score={data.baseline.score} level={data.baseline.level} size={110} stroke={9} />
                  <div className="mt-3"><LevelBadge level={data.baseline.level} /></div>
                </div>

                <motion.div
                  key={delta}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                  style={{ color: deltaColor }}
                >
                  <DeltaIcon className="mx-auto h-8 w-8" />
                  <p className="mt-1 font-display text-3xl font-bold">
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </p>
                </motion.div>

                <div className={`text-center transition-opacity ${loading ? "opacity-50" : ""}`}>
                  <p className="mb-3 text-xs uppercase tracking-wider text-slate-400">Scenario</p>
                  <ScoreRing score={data.scenario.score} level={data.scenario.level} size={110} stroke={9} />
                  <div className="mt-3"><LevelBadge level={data.scenario.level} /></div>
                </div>
              </div>

              {data.levelChanged && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center gap-3 rounded-xl p-4 text-sm"
                  style={{
                    color: levelColor(data.scenario.level),
                    background: `${levelColor(data.scenario.level)}15`,
                    border: `1px solid ${levelColor(data.scenario.level)}44`,
                  }}
                >
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  Risk level moves from <b className="capitalize">{data.baseline.level}</b> to{" "}
                  <b className="capitalize">{data.scenario.level}</b> ({data.scenario.hazard} hazard).
                </motion.div>
              )}
            </>
          ) : (
            <div className="skeleton h-48" />
          )}
        </div>

        <div className="glass p-6">
          <h3 className="font-display text-lg font-semibold text-white">Rainfall sensitivity</h3>
          <p className="text-xs text-slate-400">Risk score as rainfall increases, other sliders held constant</p>
          {data && values ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sweep} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sweepFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="rain1h"
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" mm"
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,15,28,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                    formatter={(v) => [v, "Risk score"]}
                    labelFormatter={(l) => `${l} mm/h`}
                  />
                  <ReferenceLine y={55} stroke="#fb923c" strokeDasharray="4 4" />
                  <ReferenceLine x={values.rain1h} stroke="#a78bfa" strokeWidth={2} />
                  <Area type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2.5} fill="url(#sweepFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="skeleton mt-4 h-64" />
          )}
        </div>
      </div>
    </div>
  );
}