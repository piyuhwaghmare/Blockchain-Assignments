import { motion } from "framer-motion";
import { ArrowRight, Box, Clock, Coins, Layers, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SetupBanner } from "../components/SetupBanner";
import { useWallet } from "../context/WalletContext";
import { getContractAddress, getReadContract } from "../hooks/usePublicWorkContract";
import { formatBudget } from "../lib/formatPayment";
import {
  fetchContractBalance,
  fetchProject,
  fetchProjectCount,
  fetchAuditWindow,
  fetchVetoThreshold,
  fetchTokenDecimals,
  fetchTokenSymbol,
} from "../lib/contractReads";
import { isNativeEth, type ProjectOnChain } from "../types";

type ProjectRow = { id: number; p: ProjectOnChain; decimals: number; symbol: string };

export function Explorer() {
  const { provider, address } = useWallet();
  const configured = Boolean(getContractAddress());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [balance, setBalance] = useState<string>("—");
  const [veto, setVeto] = useState<string>("—");
  const [windowSec, setWindowSec] = useState<string>("—");

  useEffect(() => {
    if (!configured || !provider) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const c = await getReadContract(provider);
        const n = await fetchProjectCount(c);
        const rows: ProjectRow[] = [];
        for (let i = 0; i < n; i++) {
          const p = await fetchProject(c, BigInt(i));
          let decimals = 18;
          let symbol = "ETH";
          if (!isNativeEth(p.paymentToken)) {
            decimals = await fetchTokenDecimals(provider, p.paymentToken);
            symbol = await fetchTokenSymbol(provider, p.paymentToken);
          }
          rows.push({ id: i, p, decimals, symbol });
        }
        if (!cancelled) setProjects(rows);
        const bal = await fetchContractBalance(c);
        const vt = await fetchVetoThreshold(c);
        const w = await fetchAuditWindow(c);
        if (!cancelled) {
          setBalance(bal.toString());
          setVeto(vt.toString());
          setWindowSec(w.toString());
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, provider, address]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Project explorer</h1>
          <p className="mt-2 max-w-xl text-slate-400">
            ETH or ERC-20 escrows, multi-oracle quorum, then citizen audit. Open a project to run the full workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/regulator"
            className="inline-flex items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
          >
            Regulator feed
          </Link>
          <Link
            to="/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-ledger-950 shadow-glow"
          >
            Create project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Wallet, label: "Contract ETH balance (wei)", value: balance },
          { icon: Clock, label: "Audit window (seconds)", value: windowSec },
          { icon: Layers, label: "Veto threshold", value: veto },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <Icon className="h-5 w-5 text-cyan-400" />
            <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 font-mono text-lg text-white break-all">{loading ? "…" : value}</p>
          </div>
        ))}
      </div>

      {err && (
        <div className="mt-8 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{err}</div>
      )}

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white">All projects</h2>
        {loading ? (
          <p className="mt-6 text-slate-500">Loading chain data…</p>
        ) : projects.length === 0 ? (
          <p className="mt-6 text-slate-500">No projects yet. Create one as the government wallet.</p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {projects.map(({ id, p, decimals, symbol }, i) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/project/${id}`}
                  className="glass group flex flex-col rounded-2xl p-6 transition-all hover:border-cyan-500/30 hover:shadow-glow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono text-cyan-500/80">#{id}</p>
                      <h3 className="mt-1 text-xl font-semibold text-white group-hover:text-cyan-100">{p.title}</h3>
                    </div>
                    <Box className="h-10 w-10 shrink-0 text-cyan-500/40 transition-colors group-hover:text-cyan-400" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {isNativeEth(p.paymentToken) ? (
                        <>
                          <Wallet className="h-3 w-3" /> ETH
                        </>
                      ) : (
                        <>
                          <Coins className="h-3 w-3 text-amber-400" /> {symbol}
                        </>
                      )}
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                      Oracle quorum {p.oracleQuorum.toString()}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-400">{p.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Budget {formatBudget(p.totalBudget, p.paymentToken, decimals)}</span>
                    <span>·</span>
                    <span>Paid {formatBudget(p.totalPaidOut, p.paymentToken, decimals)}</span>
                    <span>·</span>
                    <span className={p.active ? "text-emerald-400" : "text-slate-600"}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
