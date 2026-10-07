import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { ZONE_COLORS } from "../utils/risk";

export default function TrendChart({ history, zones }) {
  const ready = history.length >= 2;

  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Live risk trend</h3>
          <p className="text-xs text-slate-400">Risk score per zone, updated as data arrives</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-slate-400">
          <span className="live-dot" /> Live
        </span>
      </div>

      {ready ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="t"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,15,28,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#e2e8f0",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} iconType="circle" />
              <ReferenceLine
                y={55}
                stroke="#fb923c"
                strokeDasharray="4 4"
                label={{ value: "High", fill: "#fb923c", fontSize: 11, position: "insideTopRight" }}
              />
              {zones.map((z, i) => (
                <Line
                  key={z.zoneId}
                  type="monotone"
                  dataKey={z.zoneId}
                  name={z.name}
                  stroke={ZONE_COLORS[i % ZONE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={600}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="skeleton grid h-72 place-items-center text-sm text-slate-400">
          Collecting live data… the chart appears after the next refresh
        </div>
      )}
    </div>
  );
}