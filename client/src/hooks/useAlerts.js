import { useCallback, useEffect, useState } from "react";
import { ackAlert, getAlerts, scanAlerts } from "../services/api";

export default function useAlerts(intervalMs = 20000) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAlerts();
      setAlerts(data.alerts);
      setError(null);
    } catch (err) {
      setError(err.userMessage || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  const acknowledge = useCallback(
    async (id) => {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
      try {
        await ackAlert(id);
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  const scan = useCallback(async () => {
    const result = await scanAlerts();
    await refresh();
    return result;
  }, [refresh]);

  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  return { alerts, unacknowledged, loading, error, refresh, acknowledge, scan };
}