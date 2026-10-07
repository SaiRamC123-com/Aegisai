import { randomUUID } from "crypto";
import { db, firebaseReady } from "../config/firebaseAdmin.js";

const alerts = []; // in-memory store, mirrored to Firestore when configured
const DEDUPE_MS = 30 * 60 * 1000;
const persist = (alert) => {
  if (!firebaseReady) return;
  try {
    db.collection("alerts")
      .doc(alert.id)
      .set(alert)
      .catch((e) => console.warn("Alert persist failed:", e.message));
  } catch (e) {
    console.warn("Alert persist failed:", e.message);
  }
};
export function scanAndCreateAlerts(results) {
  const created = [];
  for (const r of results) {
    if (!["high", "critical"].includes(r.level)) continue;
    const duplicate = alerts.find(
      (a) => a.zoneId === r.zoneId && a.level === r.level && !a.acknowledged && Date.now() - a.createdAtMs < DEDUPE_MS
    );
    if (duplicate) continue;

    const alert = {
      id: randomUUID(),
      zoneId: r.zoneId,
      zoneName: r.name,
      hazard: r.hazard,
      level: r.level,
      score: r.score,
      message: `${r.level.toUpperCase()} ${r.hazard} risk in ${r.name} (score ${r.score}). Top driver: ${r.factors[0]?.label}.`,
      acknowledged: false,
      createdAt: new Date().toISOString(),
      createdAtMs: Date.now(),
    };
    alerts.unshift(alert);
    if (alerts.length > 200) alerts.pop();
    persist(alert);
    created.push(alert);
  }
  return created;
}

export function listAlerts({ level, limit = 50 } = {}) {
  const filtered = level ? alerts.filter((a) => a.level === level) : alerts;
  return filtered.slice(0, limit);
}

export function acknowledgeAlert(id, uid) {
  const alert = alerts.find((a) => a.id === id);
  if (!alert) return null;
  alert.acknowledged = true;
  alert.acknowledgedBy = uid;
  persist(alert);
  return alert;
}