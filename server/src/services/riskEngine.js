import axios from "axios";
import { db, firebaseReady } from "../config/firebaseAdmin.js";
import { seedZones } from "../config/seedZones.js";
import { getWeather } from "./weatherService.js";

const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const round1 = (n) => Math.round(n * 10) / 10;

export const levelFor = (score) =>
  score >= 75 ? "critical" : score >= 55 ? "high" : score >= 30 ? "moderate" : "low";

export async function loadZones() {
  if (!firebaseReady) return seedZones;
  try {
    const snap = await db.collection("zones").get();
    if (snap.empty) return seedZones;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Firestore zones failed, using seed:", err.message);
    return seedZones;
  }
}

function floodFactors(zone, w) {
  return [
    { key: "rainfall", label: "Rainfall intensity", weight: 35, value: clamp(w.rain1h / 50) },
    { key: "humidity", label: "Soil saturation (humidity)", weight: 10, value: clamp((w.humidity - 60) / 40) },
    { key: "lowLying", label: "Low-lying terrain", weight: 15, value: zone.lowLying },
    { key: "drainage", label: "Poor drainage", weight: 15, value: 1 - zone.drainage },
    { key: "water", label: "Proximity to water body", weight: 15, value: zone.waterProximity },
    { key: "population", label: "Population exposure", weight: 10, value: clamp(zone.populationDensity / 20000) },
  ];
}

function heatFactors(zone, w) {
  return [
    { key: "temp", label: "Air temperature", weight: 70, value: clamp((w.temp - 32) / 12) },
    { key: "population", label: "Population exposure", weight: 15, value: clamp(zone.populationDensity / 20000) },
    { key: "humidity", label: "Humidity (heat index)", weight: 15, value: clamp((w.humidity - 50) / 50) },
  ];
}

const score = (factors) => factors.reduce((s, f) => s + f.value * f.weight, 0);
const withContribution = (factors) =>
  factors
    .map((f) => ({ ...f, value: round1(f.value), contribution: round1(f.value * f.weight) }))
    .sort((a, b) => b.contribution - a.contribution);

let mlDownUntil = 0;
async function mlScore(zone, w) {
  const url = process.env.ML_SERVICE_URL;
  if (!url || Date.now() < mlDownUntil) return null;
  try {
    const { data } = await axios.post(
      `${url}/predict`,
      {
        rain1h: w.rain1h, humidity: w.humidity, temp: w.temp, windSpeed: w.windSpeed,
        lowLying: zone.lowLying, drainage: zone.drainage,
        waterProximity: zone.waterProximity, populationDensity: zone.populationDensity,
      },
      { timeout: 1500 }
    );
    return typeof data.score === "number" ? clamp(data.score, 0, 100) : null;
  } catch {
    mlDownUntil = Date.now() + 60 * 1000; // skip ML for a minute after a failure
    return null;
  }
}

export async function assessZone(zone, overrides = {}) {
  const base = await getWeather(zone.lat, zone.lng, zone.id);
  const weather = { ...base, ...overrides };

  const flood = floodFactors(zone, weather);
  const heat = heatFactors(zone, weather);
  const floodScore = score(flood);
  const heatScore = score(heat);
  const hazard = heatScore > floodScore ? "heat" : "flood";
  let finalScore = Math.max(floodScore, heatScore);
  let source = "heuristic";

  const ml = await mlScore(zone, weather);
  if (ml !== null) {
    finalScore = ml;
    source = "ml";
  }

  finalScore = Math.round(finalScore);
  return {
    zoneId: zone.id,
    name: zone.name,
    lat: zone.lat,
    lng: zone.lng,
    hazard,
    score: finalScore,
    level: levelFor(finalScore),
    factors: withContribution(hazard === "heat" ? heat : flood),
    weather,
    source,
    simulated: Object.keys(overrides).length > 0,
    computedAt: new Date().toISOString(),
  };
}

export async function getZonesWithRisk() {
  const zones = await loadZones();
  return Promise.all(zones.map((z) => assessZone(z)));
}

export async function getZoneWithRisk(id, overrides = {}) {
  const zones = await loadZones();
  const zone = zones.find((z) => z.id === id);
  return zone ? assessZone(zone, overrides) : null;
}