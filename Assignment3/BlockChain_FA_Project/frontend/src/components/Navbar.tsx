import { motion } from "framer-motion";
import { Blocks, LayoutDashboard, PlusCircle, Wallet } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { getContractAddress } from "../hooks/usePublicWorkContract";
import { Button } from "./Button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/explorer", label: "Explorer" },
  { to: "/create", label: "New project" },
  { to: "/analytics", label: "Analytics" },
  { to: "/regulator", label: "Regulator" },
  { to: "/architecture", label: "Architecture" },
];

export function Navbar() {
  const { address, connect, connecting, disconnect } = useWallet();
  const configured = Boolean(getContractAddress());

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/5 bg-ledger-950/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500 shadow-glow">
            <Blocks className="h-5 w-5 text-ledger-950" />
          </span>
          <div className="leading-tight">
            <span className="block font-semibold tracking-tight text-white">LedgerWorks</span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-cyan-400/80">
              Public audit chain
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-cyan-200" : "text-slate-400 hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!configured && (
            <span className="hidden text-xs text-amber-400/90 sm:inline">Configure .env</span>
          )}
          {address ? (
            <>
              <Link
                to="/explorer"
                className="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-cyan-300 sm:block"
                title="Dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => disconnect()}
                className="hidden max-w-[140px] truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-cyan-200 hover:border-cyan-500/30 sm:block"
              >
                {address.slice(0, 6)}…{address.slice(-4)}
              </button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => void connect()}
              disabled={connecting}
              className="!py-2 !pl-3 !pr-4"
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting…" : "Connect"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex border-t border-white/5 px-4 py-2 md:hidden">
        <div className="flex w-full justify-between gap-1 overflow-x-auto">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-2 py-1.5 text-xs ${
                  isActive ? "bg-white/10 text-cyan-200" : "text-slate-400"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/create"
            className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs text-emerald-400"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Create
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
