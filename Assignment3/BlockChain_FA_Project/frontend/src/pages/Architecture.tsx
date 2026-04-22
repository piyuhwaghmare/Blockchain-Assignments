import { motion } from "framer-motion";
import { Database, Globe, Lock, Share2 } from "lucide-react";

const layers = [
  {
    title: "Presentation & wallet",
    items: ["React + Vite SPA", "MetaMask / EIP-1193", "IPFS gateway links for evidence"],
  },
  {
    title: "Execution layer",
    items: ["Solidity escrow + milestones", "Oracle-gated state transitions", "Citizen vote counters on-chain"],
  },
  {
    title: "Hybrid ledger (conceptual)",
    items: [
      "Consortium / private chain: PII, bid metadata, supplier KYC mirrors",
      "Public chain (or public mirror): project IDs, hashes, payment events",
    ],
  },
  {
    title: "Evidence plane",
    items: ["IPFS / content-addressed storage for blueprints & media", "Only CIDs stored on-chain"],
  },
];

export function Architecture() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-white">Hybrid architecture</h1>
        <p className="mt-4 text-slate-400">
          Sensitive government workflow data can live on a permissioned ledger while citizens verify fund flows and
          evidence commitments on a public-facing layer — matching your problem statement without exposing raw PII.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-strong relative overflow-hidden rounded-3xl p-8"
        >
          <div className="absolute right-0 top-0 p-6 opacity-20">
            <Globe className="h-32 w-32 text-cyan-400" />
          </div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Share2 className="h-5 w-5 text-cyan-400" />
            Data flow (high level)
          </h2>
          <ol className="mt-6 space-y-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                1
              </span>
              <span>
                <strong className="text-white">Government</strong> creates a project, locks the full budget in the
                contract, and registers milestone tranches.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                2
              </span>
              <span>
                <strong className="text-white">Contractor</strong> submits IPFS hashes for proof-of-work (photos,
                reports, IoT feeds referenced off-chain).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                3
              </span>
              <span>
                <strong className="text-white">Oracle</strong> attests the milestone, opening a timed citizen audit
                window.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                4
              </span>
              <span>
                <strong className="text-white">Public</strong> validates or vetoes; crossing the veto threshold marks
                the milestone disputed.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                5
              </span>
              <span>
                After the window, anyone finalizes: if clean, the contract pays the contractor automatically; if
                disputed, <strong className="text-white">government</strong> resolves.
              </span>
            </li>
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          {layers.map((layer, i) => (
            <div
              key={layer.title}
              className="glass rounded-2xl border border-white/10 p-5 transition-colors hover:border-cyan-500/25"
            >
              <div className="flex items-center gap-2">
                {i === 2 ? (
                  <Lock className="h-4 w-4 text-amber-400" />
                ) : (
                  <Database className="h-4 w-4 text-cyan-400" />
                )}
                <h3 className="font-semibold text-white">{layer.title}</h3>
              </div>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
                {layer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mt-16 rounded-3xl border border-white/10 bg-ledger-900/60 p-8">
        <h2 className="text-lg font-semibold text-white">Reality check (from your brief)</h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-3">
          <li className="rounded-xl bg-white/5 p-4">
            <strong className="text-amber-200">Oracle risk</strong>
            <p className="mt-2">Mitigate with multi-party oracles, IoT, and spot audits — the chain records claims, not
            absolute truth.</p>
          </li>
          <li className="rounded-xl bg-white/5 p-4">
            <strong className="text-cyan-200">Scalability</strong>
            <p className="mt-2">Batch milestones, L2 rollups, or stablecoin rails reduce friction vs. high gas public
            mainnet.</p>
          </li>
          <li className="rounded-xl bg-white/5 p-4">
            <strong className="text-rose-200">Adoption</strong>
            <p className="mt-2">Process change & transparency threaten incumbents — governance and law matter as much as
            code.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
