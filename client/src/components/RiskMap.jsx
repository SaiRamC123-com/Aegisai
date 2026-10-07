import { Fragment, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { LEVEL_COLOR, levelColor, levelLabel } from "../utils/risk";

const CENTER = [12.98, 77.62];
function LocateMe() {
  const map = useMap();
  const [pos, setPos] = useState(null);
  const [msg, setMsg] = useState("");

  const locate = () => {
    if (!navigator.geolocation) return setMsg("Location not supported");
    setMsg("Locating…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude];
        setPos(p);
        setMsg("");
        map.flyTo(p, 13);
      },
      () => setMsg("Location blocked. Allow it in browser settings."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      {pos && (
        <>
          <Circle center={pos} radius={300} pathOptions={{ color: "#38bdf8", fillOpacity: 0.15 }} />
          <CircleMarker
            center={pos}
            radius={7}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#38bdf8", fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top">You</Tooltip>
          </CircleMarker>
        </>
      )}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
        <button onClick={locate} className="btn-ghost glass !px-3 !py-2 text-xs">
          📍 My location
        </button>
        {msg && <span className="glass px-3 py-1.5 text-xs text-slate-300">{msg}</span>}
      </div>
    </>
  );
}


export default function RiskMap({ zones, height = 440 }) {
  const navigate = useNavigate();

  return (
    <div className="glass relative overflow-hidden" style={{ height }}>
      <MapContainer
        center={CENTER}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
  attribution="&copy; OpenStreetMap contributors"
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  className="dark-tiles"
/>
<LocateMe />
        {zones.map((z) => {
          const color = levelColor(z.level);
          const hot = z.level === "high" || z.level === "critical";
          return (
            <Fragment key={z.zoneId}>
              <Circle
                center={[z.lat, z.lng]}
                radius={1500}
                pathOptions={{ color, weight: 1, fillColor: color, fillOpacity: 0.08 }}
              />
              <CircleMarker
                center={[z.lat, z.lng]}
                radius={8 + z.score / 6}
                pathOptions={{
                  color: "#ffffff",
                  weight: 1.5,
                  fillColor: color,
                  fillOpacity: 0.75,
                  className: hot ? "risk-pulse" : "",
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {z.name} · {z.score}
                </Tooltip>
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="font-display text-base font-semibold">{z.name}</p>
                    <p className="mt-1 text-sm" style={{ color }}>
                      {levelLabel(z.level)} {z.hazard} risk · {z.score}/100
                    </p>
                    <button
                      onClick={() => navigate(`/zones/${z.zoneId}`)}
                      className="mt-3 w-full rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>

      <div className="glass absolute bottom-3 left-3 z-[1000] flex gap-3 px-3 py-2 text-xs text-slate-300">
        {Object.entries(LEVEL_COLOR).map(([level, color]) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {levelLabel(level)}
          </span>
        ))}
      </div>
    </div>
  );
}