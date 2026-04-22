import { AlertTriangle } from "lucide-react";

export function SetupBanner() {
  return (
    <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-amber-200">Contract address not configured</p>
          <p className="mt-1 text-amber-100/90">
            From the project root, run <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npx hardhat node</code> in one terminal, then{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npm run deploy:local</code>. Copy the deployed address into{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">frontend/.env</code> as{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">VITE_CONTRACT_ADDRESS=0x...</code> and restart{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npm run dev</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
