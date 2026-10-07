import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, SlidersHorizontal, Bell, ShieldCheck, LogOut, Shield } from "lucide-react";
import useAuth from "./hooks/useAuth";
import useAlerts from "./hooks/useAlerts";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ZoneDetail from "./pages/ZoneDetail";
import Simulator from "./pages/Simulator";
import Alerts from "./pages/Alerts";
import Admin from "./pages/Admin";
import ChatWidget from "./components/ChatWidget";

function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />
    </div>
  );
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Aurora />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <Shield className="h-14 w-14 text-aegis-400" />
      </motion.div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-aegis-400 to-violet-glow shadow-lg shadow-aegis-500/30">
        <Shield className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold leading-none text-white">
          Aegis<span className="text-gradient">AI</span>
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">Risk Intelligence</p>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, badge = 0, end, pillId, compact }) {
  return (
    <NavLink to={to} end={end} className="relative block">
      {({ isActive }) => (
        <div
          className={`relative flex items-center rounded-xl text-sm font-medium transition-colors ${
            compact ? "flex-col gap-1 px-4 py-2 text-[11px]" : "gap-3 px-4 py-3"
          } ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}
        >
          {isActive && (
            <motion.span
              layoutId={pillId}
              className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/15"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative">
            <Icon className="h-5 w-5" />
            {compact && badge > 0 && (
              <span className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full bg-risk-critical" />
            )}
          </span>
          <span className="relative">{label}</span>
          {!compact && badge > 0 && (
            <span className="relative ml-auto rounded-full bg-risk-critical px-2 py-0.5 text-xs font-semibold text-white">
              {badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const location = useLocation();
  const { user, logout, bypass } = useAuth();
  const { unacknowledged } = useAlerts();
  const isAdmin = user?.role === "admin";

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/simulator", label: "Simulator", icon: SlidersHorizontal },
    { to: "/alerts", label: "Alerts", icon: Bell, badge: unacknowledged },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen">
      <Aurora />

      {/* Desktop sidebar */}
      <aside className="glass fixed bottom-4 left-4 top-4 z-30 hidden w-60 flex-col p-4 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((l) => (
            <NavItem key={l.to} {...l} pillId="side-pill" />
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="live-dot" /> Live monitoring
          </div>
          <p className="mt-3 truncate text-sm font-medium text-white">{user?.displayName}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          {bypass ? (
            <p className="mt-3 text-xs text-risk-moderate">Dev mode (auth bypassed)</p>
          ) : (
            <button
              onClick={logout}
              className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-3 z-30 mx-3 mt-3 flex items-center justify-between px-4 py-3 lg:hidden">
        <Brand />
        <span className="live-dot" />
      </header>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-3 bottom-3 z-30 flex justify-around p-1.5 lg:hidden">
        {links.map((l) => (
          <NavItem key={l.to} {...l} pillId="tab-pill" compact />
        ))}
      </nav>

      <main className="px-4 pb-28 pt-6 lg:pb-10 lg:pl-72 lg:pr-6">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Page><Dashboard /></Page>} />
              <Route path="/zones/:id" element={<Page><ZoneDetail /></Page>} />
              <Route path="/simulator" element={<Page><Simulator /></Page>} />
              <Route path="/alerts" element={<Page><Alerts /></Page>} />
              <Route
                path="/admin"
                element={
                  <Protected adminOnly>
                    <Page><Admin /></Page>
                  </Protected>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      />
    </Routes>
  );
}
