import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SetupBanner } from "../components/SetupBanner";
import { useWallet } from "../context/WalletContext";
import { getContractAddress, getReadContract } from "../hooks/usePublicWorkContract";
import { formatEther } from "ethers";

type ProjectStats = {
  totalProjects: number;
  activeProjects: number;
  completedMilestones: number;
  totalBudget: bigint;
  totalPaidOut: bigint;
  averageCompletionTime: number;
  disputeRate: number;
};

type OracleStats = {
  address: string;
  reputationScore: number;
  totalAttestations: number;
  successRate: number;
};

export function Analytics() {
  const { provider } = useWallet();
  const configured = Boolean(getContractAddress());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedMilestones: 0,
    totalBudget: 0n,
    totalPaidOut: 0n,
    averageCompletionTime: 0,
    disputeRate: 0,
  });
  const [topOracles, setTopOracles] = useState<OracleStats[]>([]);

  useEffect(() => {
    if (!configured || !provider) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const c = await getReadContract(provider);
        const projectCount = await c.projectCount();
        
        let activeCount = 0;
        let totalBudget = 0n;
        let totalPaidOut = 0n;
        let completedMilestones = 0;
        let totalCompletionTime = 0;
        let disputedCount = 0;

        for (let i = 0; i < Number(projectCount); i++) {
          const project = await c.projects(BigInt(i));
          if (project.active) activeCount++;
          totalBudget += project.totalBudget;
          totalPaidOut += project.totalPaidOut;

          const projectStats = await c.getProjectStats(BigInt(i));
          completedMilestones += Number(projectStats.completedMilestones);
          disputedCount += Number(projectStats.disputedMilestones);
          if (projectStats.averageCompletionTime > 0n) {
            totalCompletionTime += Number(projectStats.averageCompletionTime);
          }
        }

        const avgTime = projectCount > 0 ? totalCompletionTime / Number(projectCount) : 0;
        const disputeRate = completedMilestones > 0 ? (disputedCount / completedMilestones) * 100 : 0;

        if (!cancelled) {
          setStats({
            totalProjects: Number(projectCount),
            activeProjects: activeCount,
            completedMilestones,
            totalBudget,
            totalPaidOut,
            averageCompletionTime: avgTime,
            disputeRate,
          });
        }
      } catch (e) {
        console.error("Failed to load analytics:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, provider]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  const utilizationRate = stats.totalBudget > 0n 
    ? Number((stats.totalPaidOut * 10000n) / stats.totalBudget) / 100 
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10">
            <BarChart3 className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="mt-1 text-slate-400">Real-time insights and performance metrics</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="mt-10 text-center text-slate-500">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Activity,
                label: "Total Projects",
                value: stats.totalProjects.toString(),
                subtext: `${stats.activeProjects} active`,
                color: "cyan",
              },
              {
                icon: DollarSign,
                label: "Total Budget",
                value: `${formatEther(stats.totalBudget)} ETH`,
                subtext: `${formatEther(stats.totalPaidOut)} paid out`,
                color: "emerald",
              },
              {
                icon: Award,
                label: "Completed Milestones",
                value: stats.completedMilestones.toString(),
                subtext: `${utilizationRate.toFixed(1)}% utilization`,
                color: "amber",
              },
              {
                icon: Clock,
                label: "Avg Completion Time",
                value: `${Math.floor(stats.averageCompletionTime / 86400)}d`,
                subtext: `${stats.disputeRate.toFixed(1)}% dispute rate`,
                color: "violet",
              },
            ].map(({ icon: Icon, label, value, subtext, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl bg-${color}-500/10 p-3`}>
                    <Icon className={`h-6 w-6 text-${color}-400`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{subtext}</p>
              </motion.div>
            ))}
          </div>

          {/* Budget Utilization Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white">Budget Utilization</h2>
            <div className="mt-6">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Allocated</span>
                <span>{formatEther(stats.totalBudget)} ETH</span>
              </div>
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-emerald-400">Paid: {formatEther(stats.totalPaidOut)} ETH</span>
                <span className="text-slate-400">
                  Remaining: {formatEther(stats.totalBudget - stats.totalPaidOut)} ETH
                </span>
              </div>
            </div>
          </motion.div>

          {/* Performance Indicators */}
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">System Health</h2>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Project Success Rate</span>
                    <span className="font-medium text-emerald-400">
                      {(100 - stats.disputeRate).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${100 - stats.disputeRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Active Projects</span>
                    <span className="font-medium text-cyan-400">
                      {stats.totalProjects > 0
                        ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${
                          stats.totalProjects > 0
                            ? (stats.activeProjects / stats.totalProjects) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Risk Indicators</h2>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Dispute Rate</p>
                    <p className="mt-1 text-xs text-slate-400">Percentage of disputed milestones</p>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      stats.disputeRate < 5
                        ? "text-emerald-400"
                        : stats.disputeRate < 15
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {stats.disputeRate.toFixed(1)}%
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Budget Efficiency</p>
                    <p className="mt-1 text-xs text-slate-400">Funds deployed vs allocated</p>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">{utilizationRate.toFixed(1)}%</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-10 glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white">Key Insights</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "High Transparency",
                  desc: "All transactions are publicly auditable on-chain",
                  icon: "🔍",
                },
                {
                  title: "Citizen Engagement",
                  desc: "Democratic oversight through public voting mechanism",
                  icon: "🗳️",
                },
                {
                  title: "Oracle Verification",
                  desc: "Multi-party attestation ensures work quality",
                  icon: "✅",
                },
              ].map((insight, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4"
                >
                  <div className="text-2xl">{insight.icon}</div>
                  <h3 className="mt-3 font-semibold text-white">{insight.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{insight.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
