import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Gavel,
  Hammer,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Timer,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { SetupBanner } from "../components/SetupBanner";
import { useWallet } from "../context/WalletContext";
import { getContractAddress, getReadContract, getSignerContract } from "../hooks/usePublicWorkContract";
import { formatBudget } from "../lib/formatPayment";
import {
  fetchIsOracle,
  fetchMilestone,
  fetchMilestoneCount,
  fetchProject,
  fetchTokenDecimals,
  fetchTokenSymbol,
  fetchVetoThreshold,
} from "../lib/contractReads";
import {
  ipfsGateway,
  isNativeEth,
  MILESTONE_STATUS_LABEL,
  milestoneStatusColor,
  shortAddr,
  type MilestoneOnChain,
  type ProjectOnChain,
} from "../types";

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const { provider, address } = useWallet();
  const configured = Boolean(getContractAddress());

  const [project, setProject] = useState<ProjectOnChain | null>(null);
  const [milestones, setMilestones] = useState<MilestoneOnChain[]>([]);
  const [oracle, setOracle] = useState(false);
  const [vetoThreshold, setVetoThreshold] = useState<bigint>(3n);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState("ETH");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [txMsg, setTxMsg] = useState<string | null>(null);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    if (!configured || !provider || Number.isNaN(projectId)) return;
    setLoading(true);
    setErr(null);
    try {
      const c = await getReadContract(provider);
      const p = await fetchProject(c, BigInt(projectId));
      const n = await fetchMilestoneCount(c, BigInt(projectId));
      const ms: MilestoneOnChain[] = [];
      for (let i = 0; i < n; i++) {
        ms.push(await fetchMilestone(c, BigInt(projectId), BigInt(i)));
      }
      setProject(p);
      setMilestones(ms);
      const vt = await fetchVetoThreshold(c);
      setVetoThreshold(vt);
      if (isNativeEth(p.paymentToken)) {
        setTokenDecimals(18);
        setTokenSymbol("ETH");
      } else {
        setTokenDecimals(await fetchTokenDecimals(provider, p.paymentToken));
        setTokenSymbol(await fetchTokenSymbol(provider, p.paymentToken));
      }
      if (address) {
        setOracle(await fetchIsOracle(c, address));
      } else {
        setOracle(false);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [configured, provider, projectId, address]);

  useEffect(() => {
    void load();
  }, [load]);

  const runTx = async (label: string, fn: (p: NonNullable<typeof provider>) => Promise<unknown>) => {
    setTxMsg(null);
    if (!provider) {
      setTxMsg("Connect wallet.");
      return;
    }
    const p = provider;
    try {
      const out = await fn(p);
      if (out && typeof out === "object" && "hash" in out) {
        setTxMsg(`${label}: ${String((out as { hash: string }).hash)}`);
      } else {
        setTxMsg(`${label}: done`);
      }
      await load();
    } catch (e) {
      setTxMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  if (Number.isNaN(projectId)) {
    return <p className="p-8 text-center text-slate-500">Invalid project id.</p>;
  }

  const isGov = address && project && address.toLowerCase() === project.government.toLowerCase();
  const isContractor =
    address && project && address.toLowerCase() === project.contractor.toLowerCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link to="/explorer" className="text-sm text-cyan-400 hover:text-cyan-300">
        ← Back to explorer
      </Link>

      {loading ? (
        <p className="mt-10 text-slate-500">Loading project…</p>
      ) : err || !project ? (
        <p className="mt-10 text-rose-300">{err || "Not found"}</p>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 glass-strong rounded-3xl p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-cyan-500/80">Project #{projectId}</p>
                <h1 className="mt-2 text-3xl font-bold text-white">{project.title}</h1>
                <p className="mt-3 max-w-2xl text-slate-400">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-slate-200">
                    Settlement: {isNativeEth(project.paymentToken) ? "ETH" : tokenSymbol}{" "}
                    {!isNativeEth(project.paymentToken) && (
                      <span className="font-mono text-slate-500">({shortAddr(project.paymentToken)})</span>
                    )}
                  </span>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 font-medium text-cyan-200">
                    Oracle quorum: {project.oracleQuorum.toString()}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right text-sm">
                <p className="text-slate-500">Budget / paid</p>
                <p className="font-mono text-cyan-100">
                  {formatBudget(project.totalBudget, project.paymentToken, tokenDecimals)} /{" "}
                  {formatBudget(project.totalPaidOut, project.paymentToken, tokenDecimals)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                Government <code className="text-cyan-200/90">{shortAddr(project.government)}</code>
              </span>
              <span>·</span>
              <span>
                Contractor <code className="text-emerald-200/90">{shortAddr(project.contractor)}</code>
              </span>
            </div>
            {project.blueprintIpfsHash ? (
              <a
                href={ipfsGateway(project.blueprintIpfsHash)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
              >
                <ExternalLink className="h-4 w-4" />
                Blueprint on IPFS
              </a>
            ) : null}
          </motion.div>

          {txMsg && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs text-slate-300">
              {txMsg}
            </div>
          )}

          <div className="mt-12 space-y-8">
            <h2 className="text-xl font-semibold text-white">Milestones</h2>
            {milestones.map((m, idx) => {
              const now = Math.floor(Date.now() / 1000);
              const auditEnd = Number(m.publicAuditEndsAt);
              const inAuditWindow = m.status === 2 && auditEnd > 0 && now <= auditEnd;
              const auditEnded = m.status === 2 && auditEnd > 0 && now > auditEnd;
              const q = Number(project.oracleQuorum);
              const att = Number(m.oracleConfirmationCount);
              const quorumProgress = q > 0 ? Math.min(100, (att / q) * 100) : 0;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="glass rounded-2xl border border-white/10 p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-slate-500">Milestone {idx}</p>
                      <h3 className="text-lg font-semibold text-white">{m.description}</h3>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-emerald-200">
                        {formatBudget(m.amountWei, project.paymentToken, tokenDecimals)}
                      </p>
                      <p className={`text-sm font-medium ${milestoneStatusColor(m.status)}`}>
                        {MILESTONE_STATUS_LABEL[m.status] ?? "Unknown"}
                      </p>
                    </div>
                  </div>

                  {m.status === 1 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Oracle attestations</span>
                        <span className="font-mono text-cyan-200">
                          {att} / {q}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                          style={{ width: `${quorumProgress}%` }}
                        />
                      </div>
                      {m.lastOracleAttester && m.lastOracleAttester !== "0x0000000000000000000000000000000000000000" && (
                        <p className="mt-2 text-xs text-slate-500">
                          Last attester:{" "}
                          <code className="text-slate-400">{shortAddr(m.lastOracleAttester)}</code>
                        </p>
                      )}
                    </div>
                  )}

                  {m.evidenceIpfsHash ? (
                    <a
                      href={ipfsGateway(m.evidenceIpfsHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-400"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Evidence CID: {m.evidenceIpfsHash.slice(0, 18)}…
                    </a>
                  ) : null}

                  {m.status === 2 && (
                    <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-cyan-500/5 p-4 text-sm text-slate-300">
                      <span className="inline-flex items-center gap-1 text-cyan-200">
                        <ThumbsUp className="h-4 w-4" />
                        Approvals: {m.citizenApprovals.toString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-300">
                        <ThumbsDown className="h-4 w-4" />
                        Vetoes: {m.citizenVetoes.toString()} / {vetoThreshold.toString()} threshold
                      </span>
                      {auditEnd > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-200">
                          <Timer className="h-4 w-4" />
                          {inAuditWindow
                            ? `Window ends ${new Date(auditEnd * 1000).toLocaleString()}`
                            : "Window closed"}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-6">
                    {m.status === 0 && isContractor && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500">Evidence IPFS CID</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-500/40"
                            value={evidenceInputs[idx] ?? ""}
                            onChange={(e) =>
                              setEvidenceInputs((s) => ({ ...s, [idx]: e.target.value }))
                            }
                            placeholder="Qm…"
                          />
                        </div>
                        <Button
                          variant="primary"
                          className="shrink-0"
                          onClick={() =>
                            void runTx("Submit proof", async (prov) => {
                              const cid = (evidenceInputs[idx] ?? "").trim();
                              if (!cid) throw new Error("CID required");
                              const c = await getSignerContract(prov);
                              return c.getFunction("submitMilestoneProof")(projectId, idx, cid);
                            })
                          }
                        >
                          <Hammer className="h-4 w-4" />
                          Submit proof
                        </Button>
                      </div>
                    )}

                    {m.status === 1 && oracle && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void runTx("Oracle attest", async (prov) => {
                            const c = await getSignerContract(prov);
                            return c.getFunction("oracleVerifyMilestone")(projectId, idx);
                          })
                        }
                      >
                        <Shield className="h-4 w-4" />
                        Oracle attest ({att}/{q})
                      </Button>
                    )}

                    {m.status === 2 && inAuditWindow && address && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          onClick={() =>
                            void runTx("Approve", async (prov) => {
                              const c = await getSignerContract(prov);
                              return c.getFunction("citizenAuditVote")(projectId, idx, true);
                            })
                          }
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Validate work
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            void runTx("Veto", async (prov) => {
                              const c = await getSignerContract(prov);
                              return c.getFunction("citizenAuditVote")(projectId, idx, false);
                            })
                          }
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Veto / flag
                        </Button>
                      </div>
                    )}

                    {m.status === 2 && auditEnded && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void runTx("Finalize", async (prov) => {
                            const c = await getSignerContract(prov);
                            return c.getFunction("finalizeMilestone")(projectId, idx);
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Finalize milestone (pay or dispute)
                      </Button>
                    )}

                    {m.status === 1 && isGov && (
                      <Button
                        variant="ghost"
                        className="!justify-start text-amber-200"
                        onClick={() =>
                          void runTx("Reject submission", async (prov) => {
                            const c = await getSignerContract(prov);
                            return c.getFunction("rejectMilestone")(projectId, idx);
                          })
                        }
                      >
                        <AlertCircle className="h-4 w-4" />
                        Reject proof (back to pending)
                      </Button>
                    )}

                    {m.status === 4 && isGov && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          onClick={() =>
                            void runTx("Resolve pay", async (prov) => {
                              const c = await getSignerContract(prov);
                              return c.getFunction("resolveDispute")(projectId, idx, true);
                            })
                          }
                        >
                          <UserCheck className="h-4 w-4" />
                          Override: pay contractor
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            void runTx("Resolve rework", async (prov) => {
                              const c = await getSignerContract(prov);
                              return c.getFunction("resolveDispute")(projectId, idx, false);
                            })
                          }
                        >
                          <Gavel className="h-4 w-4" />
                          Send back to pending (rework)
                        </Button>
                      </div>
                    )}

                    {!address && (m.status === 0 || m.status === 2) && (
                      <p className="text-xs text-slate-500">Connect a wallet to interact with this milestone.</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
