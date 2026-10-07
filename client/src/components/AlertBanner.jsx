import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { levelColor } from "../utils/risk";

export default function AlertBanner({ alerts, onAcknowledge }) {
  const top = alerts
    .filter((a) => !a.acknowledged)
    .sort((a, b) => Number(b.level === "critical") - Number(a.level === "critical") || b.score - a.score)[0];

  const color = top ? levelColor(top.level) : "#fff";

  return (
    <AnimatePresence>
      {top && (
        <motion.div
          key={top.id}
          initial={{ opacity: 0, height: 0, y: -16 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div
            className="glass flex items-center gap-4 px-5 py-4"
            style={{ borderColor: `${color}66`, boxShadow: `0 0 40px -10px ${color}66` }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ color }}
            >
              <AlertTriangle className="h-6 w-6" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{top.message}</p>
              <Link to="/alerts" className="text-xs text-aegis-300 hover:underline">
                View all alerts
              </Link>
            </div>
            <button
              onClick={() => onAcknowledge(top.id)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Acknowledge alert"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}