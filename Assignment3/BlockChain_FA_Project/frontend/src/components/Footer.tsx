import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ledger-950/50 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
        <p>Hybrid ledger model: consortium milestones + public transparency mirror.</p>
        <a
          href="https://github.com"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400"
        >
          <Github className="h-4 w-4" />
          Open audit trail
        </a>
      </div>
    </footer>
  );
}
