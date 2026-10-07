import { useCallback, useEffect, useState } from "react";
import { getZones } from "../services/api";

export default function useZones(intervalMs = 30000) {
  const [zones, setZones] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getZones();
      setZones(data.zones);
      setHistory((prev) => {
        const point = {
          t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        data.zones.forEach((z) => {
          point[z.zoneId] = z.score;
        });
        return [...prev, point].slice(-30);
      });
      setLastUpdated(new Date());
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

  return { zones, history, loading, error, lastUpdated, refresh };
}