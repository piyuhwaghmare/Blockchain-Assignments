import { EventLog } from "ethers";
import { motion } from "framer-motion";
import { Activity, ExternalLink, Filter, RefreshCw, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SetupBanner } from "../components/SetupBanner";
import { Button } from "../components/Button";
import { useWallet } from "../context/WalletContext";
import { getContractAddress, getReadContract } from "../hooks/usePublicWorkContract";
import { shortAddr } from "../types";

const EVENT_NAMES = [
  "ProjectCreated",
  "MilestoneProofSubmitted",
  "MilestoneOracleAttested",
  "MilestonePublicAuditOpened",
  "CitizenVote",
  "MilestonePaid",
  "MilestoneDisputed",
  "MilestoneRejected",
  "DisputeResolved",
  "OracleUpdated",
] as const;

type Row = {
  name: string;
  block: number;
  tx: string;
  summary: string;
};

function formatArg(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "string") return v.length > 64 ? `${v.slice(0, 32)}…` : v;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object" && v !== null && "toString" in v) return String(v);
  return JSON.stringify(v);
}

function summarizeEvent(name: string, args: ReadonlyArray<unknown>): string {
  const a = args;
  switch (name) {
    case "ProjectCreated":
      return `gov ${shortAddr(String(a[1]))} · contractor ${shortAddr(String(a[2]))} · token ${shortAddr(String(a[3]))} · quorum ${a[4]} · budget ${a[6]}`;
    case "MilestoneProofSubmitted":
      return `project #${a[0]} · milestone ${a[1]} · ${String(a[2]).slice(0, 20)}…`;
    case "MilestoneOracleAttested":
      return `#${a[0]} / m${a[1]} · oracle ${shortAddr(String(a[2]))} · ${a[3]}/${a[4]} confirmations`;
    case "MilestonePublicAuditOpened":
      return `#${a[0]} / m${a[1]} · audit ends block-time set`;
    case "CitizenVote":
      return `#${a[0]} / m${a[1]} · ${shortAddr(String(a[2]))} · ${a[3] ? "approve" : "veto"}`;
    case "MilestonePaid":
      return `#${a[0]} / m${a[1]} · paid ${a[4]} to ${shortAddr(String(a[2]))} · token ${shortAddr(String(a[3]))}`;
    case "MilestoneDisputed":
      return `#${a[0]} / m${a[1]} · ${String(a[2]).slice(0, 48)}`;
    case "MilestoneRejected":
      return `#${a[0]} / m${a[1]}`;
    case "DisputeResolved":
      return `#${a[0]} / m${a[1]} · pay=${a[2]}`;
    case "OracleUpdated":
      return `${shortAddr(String(a[0]))} · ${a[1] ? "active" : "removed"}`;
    default:
      return a.map(formatArg).join(" · ");
  }
}

export function Regulator() {
  const { provider } = useWallet();
  const configured = Boolean(getContractAddress());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!configured || !provider) return;
    setLoading(true);
    setErr(null);
    try {
      const c = await getReadContract(provider);
      const collected: Row[] = [];
      for (const name of EVENT_NAMES) {
        const logs = await c.queryFilter(name, 0, "latest");
        for (const log of logs) {
          if (!(log instanceof EventLog) || !log.args) continue;
          const args = log.args as ReadonlyArray<unknown>;
          collected.push({
            name,
            block: log.blockNumber,
            tx: log.transactionHash,
            summary: summarizeEvent(name, args),
          });
        }
      }
      collected.sort((x, y) => (x.block === y.block ? x.tx.localeCompare(y.tx) : x.block - y.block));
      setRows(collected.reverse());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [configured, provider]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.name === filter);
  }, [rows, filter]);

  const explorerBase = useMemo(() => {
    try {
      const net = (provider as unknown as { _network?: { chainId?: bigint } })?._network;
      const id = net?.chainId;
      if (id === 31337n) return null;
      if (id === 11155111n) return "https://sepolia.etherscan.io";
      if (id === 1n) return "https://etherscan.io";
    } catch {
      /* ignore */
    }
    return null;
  }, [provider]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-violet-200"
          >
            <Shield className="h-3.5 w-3.5" />
            Read-only oversight
          </motion.div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Regulator event stream</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Live, immutable trail of funding, oracle attestations, citizen votes, payouts, and disputes — pulled directly
            from chain logs. No write permissions; connect any wallet (or none) to browse localhost.
          </p>
        </div>
        <Button variant="secondary" className="shrink-0 gap-2 self-start" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="h-4 w-4 text-cyan-500/80" />
          <span>Filter</span>
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All events ({rows.length})</option>
            {EVENT_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-4 w-4 text-emerald-400" />
          Showing {filtered.length} row{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{err}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-ledger-900/40">
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-white/10 bg-ledger-950/95 backdrop-blur">
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Block</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Summary</th>
                <th className="px-4 py-3 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    Scanning blocks for audit events…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No matching events yet. Create a project and walk a milestone to populate the ledger.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <motion.tr
                    key={`${r.tx}-${r.block}-${r.name}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">{r.block}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-200">
                        {r.name}
                      </span>
                    </td>
                    <td className="max-w-xl px-4 py-3 text-slate-300">{r.summary}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {explorerBase ? (
                        <a
                          href={`${explorerBase}/tx/${r.tx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          {shortAddr(r.tx, 8)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-slate-500">{shortAddr(r.tx, 8)}</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
