import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;
  if (user) config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const raw = err.response?.data?.error;
    err.userMessage =
      (typeof raw === "string" ? raw : raw?.message) ||
      (err.code === "ECONNABORTED" ? "Request timed out" : "Cannot reach the server");
    return Promise.reject(err);
  }
);


const unwrap = (promise) => promise.then((res) => res.data);

export const getZones = () => unwrap(api.get("/zones"));
export const getZone = (id) => unwrap(api.get(`/zones/${id}`));
export const predict = (zoneId, overrides) => unwrap(api.post("/predict", { zoneId, overrides }));

export const getAlerts = (params) => unwrap(api.get("/alerts", { params }));
export const scanAlerts = () => unwrap(api.post("/alerts/scan"));
export const ackAlert = (id) => unwrap(api.patch(`/alerts/${id}/ack`));

export const findRoute = (from, to) => unwrap(api.post("/route", { from, to }));
export const simulate = (body) => unwrap(api.post("/simulate", body));

export const chat = (messages) => unwrap(api.post("/chat", { messages }));
export const explain = (zoneId) => unwrap(api.post("/chat/explain", { zoneId }));
export const getHealth = () => unwrap(api.get("/health"));

export default api;