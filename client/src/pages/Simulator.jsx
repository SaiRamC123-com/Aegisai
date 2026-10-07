import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import useZones from "../hooks/useZones";
import WhatIfSimulator from "../components/WhatIfSimulator";

export default function Simulator() {
  const { zones, loading, error } = useZones(60000);
  const [params] = useSearchParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
          <SlidersHorizontal className="h-8 w-8 text-aegis-400" />
          What-if <span className="text-gradient">Simulator</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Change rainfall, temperature, and humidity to see how risk responds before it happens.
        </p>
      </div>

      {loading && <div className="skeleton h-96" />}
      {error && !zones.length && <p className="glass p-6 text-risk-critical">{error}</p>}
      {zones.length > 0 && (
        <WhatIfSimulator zones={zones} initialZoneId={params.get("zone") || zones[0].zoneId} />
      )}
    </div>
  );
}