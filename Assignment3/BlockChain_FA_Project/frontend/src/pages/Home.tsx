import { motion } from "framer-motion";
import {
  Camera,
  Cpu,
  Fingerprint,
  Landmark,
  ShieldCheck,
  Users,
  Vote,
  Waypoints,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { SetupBanner } from "../components/SetupBanner";
import { getContractAddress } from "../hooks/usePublicWorkContract";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const pillars = [
  {
    icon: Landmark,
    title: "Programmable funding",
    body: "Milestone escrow on-chain. Payouts execute only after oracle attestation and a citizen audit window.",
  },
  {
    icon: Camera,
    title: "Immutable evidence",
    body: "Blueprints and geo-tagged proof link to IPFS CIDs anchored in the contract — tamper-evident by design.",
  },
  {
    icon: Vote,
    title: "Public veto power",
    body: "Final tranches face a transparent voting window; enough vetoes freeze payment until government dispute resolution.",
  },
  {
    icon: ShieldCheck,
    title: "Full auditability",
    body: "Every rupee path maps to a block hash and milestone ID for regulators and citizens alike.",
  },
];

const stakeholders = [
  { icon: Landmark, label: "Government body", sub: "Budget & milestones" },
  { icon: Waypoints, label: "Contractors", sub: "Proof & delivery" },
  { icon: Cpu, label: "Oracles / IoT", sub: "Physical verification" },
  { icon: Users, label: "Public", sub: "Citizen audit" },
  { icon: Fingerprint, label: "Regulators", sub: "Live anomaly watch" },
];

export function Home() {
  const configured = Boolean(getContractAddress());

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[100px]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        {!configured && <SetupBanner />}

        <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <motion.p
              custom={0}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-cyan-300"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Decentralized public works
            </motion.p>
            <motion.h1
              custom={1}
              variants={fade}
              initial="hidden"
              animate="show"
              className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Track every rupee from{" "}
              <span className="text-gradient">treasury</span> to the pour.
            </motion.h1>
            <motion.p
              custom={2}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-6 max-w-xl text-lg text-slate-400"
            >
              A hybrid-ledger inspired stack: smart-contract escrow, oracle-verified milestones, IPFS evidence, and
              citizen veto before funds move — closing the black box on fiscal leakage.
            </motion.p>
            <motion.div
              custom={3}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link to="/explorer">
                <Button className="!px-6 !py-3">Open explorer</Button>
              </Link>
              <Link to="/architecture">
                <Button variant="secondary" className="!px-6 !py-3">
                  View architecture
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-card">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/80">Live ledger preview</p>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Project", value: "Coastal Highway — Phase II", tone: "text-white" },
                  { label: "Milestone", value: "Pier reinforcement + pour", tone: "text-slate-200" },
                  { label: "Evidence CID", value: "QmYwAPJ…f88C", tone: "font-mono text-cyan-200" },
                  { label: "Oracle", value: "Verified — IoT strain + visual", tone: "text-emerald-300" },
                  { label: "Citizen window", value: "Open — 47 approvals / 1 veto", tone: "text-amber-200" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-xs text-slate-500">{row.label}</span>
                    <span className={`max-w-[60%] text-right text-sm ${row.tone}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100/90">
                Funds remain in contract escrow until the public audit window closes without crossing the veto threshold.
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-cyan-500/30 bg-ledger-900/90 p-4 shadow-glow sm:block"
            >
              <p className="text-xs text-slate-500">Block anchor</p>
              <p className="mt-1 font-mono text-sm text-cyan-200">0x7f3a…e21c</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-ledger-900/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
            Stakeholders
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stakeholders.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="glass rounded-2xl p-5 text-center transition-colors hover:border-cyan-500/25"
              >
                <Icon className="mx-auto h-8 w-8 text-cyan-400" />
                <p className="mt-3 font-semibold text-white">{label}</p>
                <p className="mt-1 text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Why this cannot be a plain database</h2>
          <p className="mt-4 text-slate-400">
            Central ledgers are editable. Here, milestones and evidence hashes are commitments; payouts are enforced by
            bytecode, not a back office.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="group glass rounded-2xl p-6 transition-all hover:border-cyan-500/30 hover:shadow-glow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 text-cyan-300">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
