import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Loader2, Radar, BellRing, Route as RouteIcon } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { firebaseEnabled } from "../services/firebase";

const features = [
  { icon: Radar, title: "Live risk prediction", text: "ML-powered flood and heat scores for every zone." },
  { icon: BellRing, title: "Instant alerts", text: "Know the moment a zone turns high or critical." },
  { icon: RouteIcon, title: "Safer routes", text: "Avoid risky zones with exposure-aware routing." },
];

const friendly = (err) => {
  const raw = err?.code ? err.code.replace("auth/", "").replace(/-/g, " ") : err?.message || "Sign in failed";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export default function Login() {
  const { user, loading, login, loginWithGoogle, bypass } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => login(email, password));
  };

  const disabled = busy || !firebaseEnabled || bypass;

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="aurora" aria-hidden>
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-aegis-400 to-violet-glow shadow-xl shadow-aegis-500/30"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>

          <h1 className="mt-8 font-display text-6xl font-bold leading-tight text-white">
            Predict. Alert. <span className="text-gradient">Protect.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-400">
            AegisAI turns weather and terrain data into clear, explainable risk intelligence for your city.
          </p>

          <div className="mt-10 space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className="flex items-start gap-4"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-aegis-300 ring-1 ring-white/10">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-slate-400">{f.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto w-full max-w-md p-8"
        >
          <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-400">Sign in to the monitoring console</p>

          {!firebaseEnabled && !bypass && (
            <p className="mt-4 rounded-lg bg-risk-moderate/10 p-3 text-xs text-risk-moderate">
              Firebase isn't configured. Fill the VITE_FIREBASE_* values in client/.env.
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-risk-critical/10 p-3 text-sm text-risk-critical"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={disabled} className="btn-primary w-full">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={() => run(loginWithGoogle)}
            disabled={disabled}
            className="btn-ghost w-full justify-center py-3 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}