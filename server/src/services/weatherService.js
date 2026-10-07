import axios from "axios";

const cache = new Map();
const TTL = 5 * 60 * 1000;

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const rand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Changes every 10 minutes so the dashboard feels alive without an API key
const mockWeather = (zoneId) => {
  const seed = hash(zoneId) + Math.floor(Date.now() / (10 * 60 * 1000));
  return {
    temp: Math.round((24 + rand(seed + 1) * 14) * 10) / 10,
    humidity: Math.round(55 + rand(seed + 2) * 40),
    windSpeed: Math.round(rand(seed + 3) * 12 * 10) / 10,
    rain1h: Math.round(rand(seed + 4) * 45 * 10) / 10,
    description: "simulated conditions",
    source: "mock",
  };
};

export async function getWeather(lat, lng, zoneId) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key || key === "your_openweather_key") return mockWeather(zoneId);

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  try {
    const { data } = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { lat, lon: lng, appid: key, units: "metric" },
      timeout: 4000,
    });
    const weather = {
      temp: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed ?? 0,
      rain1h: data.rain?.["1h"] ?? 0,
      description: data.weather?.[0]?.description ?? "n/a",
      source: "openweather",
    };
    cache.set(cacheKey, { at: Date.now(), data: weather });
    return weather;
  } catch (err) {
    console.warn("Weather API failed, using mock:", err.message);
    return mockWeather(zoneId);
  }
}