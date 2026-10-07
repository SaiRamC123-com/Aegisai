import axios from "axios";
import { getZonesWithRisk } from "./riskEngine.js";

const RADIUS_KM = 1.5;
const toRad = (d) => (d * Math.PI) / 180;
const round1 = (n) => Math.round(n * 10) / 10;

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Average risk score a path passes through (0 = safe)
function exposure(points, zones) {
  const risky = zones.filter((z) => z.score >= 30);
  if (!risky.length) return { score: 0, zones: [] };

  const step = Math.max(1, Math.floor(points.length / 150));
  const hit = new Set();
  let total = 0;
  let count = 0;

  for (let i = 0; i < points.length; i += step) {
    count++;
    for (const z of risky) {
      if (haversineKm(points[i], z) <= RADIUS_KM) {
        total += z.score;
        hit.add(z.name);
      }
    }
  }
  return { score: Math.round(total / count), zones: [...hit] };
}

function straightLine(from, to) {
  const points = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    points.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }
  const km = haversineKm(from, to);
  return [{ points, distanceKm: km, durationMin: (km / 30) * 60 }];
}

async function fetchOsrm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`;
  const { data } = await axios.get(url, {
    params: { overview: "full", geometries: "geojson", alternatives: "true" },
    timeout: 7000,
  });
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route");
  return data.routes.map((r) => ({
    points: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: r.distance / 1000,
    durationMin: r.duration / 60,
  }));
}

const downsample = (points, max = 300) => {
  const step = Math.max(1, Math.ceil(points.length / max));
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
};

export async function findSafeRoutes(from, to) {
  const zones = await getZonesWithRisk();

  let raw;
  let source = "osrm";
  try {
    raw = await fetchOsrm(from, to);
  } catch (err) {
    console.warn("OSRM failed, using straight line:", err.message);
    raw = straightLine(from, to);
    source = "fallback";
  }

  const routes = raw.map((r, i) => {
    const exp = exposure(r.points, zones);
    return {
      id: `route-${i + 1}`,
      distanceKm: round1(r.distanceKm),
      durationMin: Math.round(r.durationMin),
      exposure: exp.score,
      riskZones: exp.zones,
      labels: [],
      path: downsample(r.points).map((p) => [p.lat, p.lng]),
    };
  });

  const fastest = [...routes].sort((a, b) => a.durationMin - b.durationMin)[0];
  const safest = [...routes].sort(
    (a, b) => a.exposure - b.exposure || a.durationMin - b.durationMin
  )[0];
  fastest.labels.push("fastest");
  safest.labels.push("safest");

  const rationale =
    safest.id === fastest.id
      ? "The fastest route is also the safest option right now."
      : `Safest route avoids ${Math.max(0, fastest.riskZones.length - safest.riskZones.length)} risky zone(s) and adds ${Math.max(0, safest.durationMin - fastest.durationMin)} min.`;

  return { source, recommended: safest.id, rationale, routes };
}