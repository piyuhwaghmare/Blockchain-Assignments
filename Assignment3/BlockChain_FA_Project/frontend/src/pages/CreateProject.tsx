import { Contract, parseEther, parseUnits, ZeroAddress } from "ethers";
import { motion } from "framer-motion";
import { Coins, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { SetupBanner } from "../components/SetupBanner";
import { useWallet } from "../context/WalletContext";
import { getContractAddress, getSignerContract } from "../hooks/usePublicWorkContract";
import { fetchTokenDecimals } from "../lib/contractReads";

type Row = { description: string; amount: string };

export function CreateProject() {
  const { provider, address } = useWallet();
  const navigate = useNavigate();
  const configured = Boolean(getContractAddress());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blueprintCid, setBlueprintCid] = useState("");
  const [contractor, setContractor] = useState("");
  const [paymentMode, setPaymentMode] = useState<"eth" | "erc20">("eth");
  const [tokenAddress, setTokenAddress] = useState("");
  const [oracleQuorum, setOracleQuorum] = useState("1");
  const [rows, setRows] = useState<Row[]>([
    { description: "Site survey & soil tests", amount: "0.1" },
    { description: "Foundation pour & curing", amount: "0.15" },
  ]);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || paymentMode !== "erc20" || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const d = await fetchTokenDecimals(provider, tokenAddress);
      if (!cancelled) setTokenDecimals(d);
    })();
    return () => {
      cancelled = true;
    };
  }, [provider, paymentMode, tokenAddress]);

  const addRow = () => setRows((r) => [...r, { description: "", amount: "0.05" }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));

  const approveToken = async () => {
    setMsg(null);
    if (!provider || !address) {
      setMsg("Connect wallet.");
      return;
    }
    const audit = getContractAddress();
    if (!audit || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setMsg("Valid token address required.");
      return;
    }
    const descs = rows.map((r) => r.description.trim()).filter(Boolean);
    if (descs.length !== rows.length) {
      setMsg("Each milestone needs a description.");
      return;
    }
    let totalWei = 0n;
    try {
      for (const r of rows) {
        const w =
          paymentMode === "eth"
            ? parseEther(r.amount || "0")
            : parseUnits(r.amount || "0", tokenDecimals);
        if (w <= 0n) throw new Error("positive");
        totalWei += w;
      }
    } catch {
      setMsg("Invalid amounts.");
      return;
    }
    setBusy(true);
    try {
      const signer = await provider.getSigner();
      const token = new Contract(tokenAddress, ["function approve(address,uint256) returns (bool)"], signer);
      const tx = await token.getFunction("approve")(audit, totalWei);
      setMsg(`Approve tx: ${tx.hash}`);
      await tx.wait();
      setMsg("Approve confirmed. You can create the project.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setMsg(null);
    if (!provider || !address) {
      setMsg("Connect your wallet (government account).");
      return;
    }
    if (!title.trim() || !contractor.match(/^0x[a-fA-F0-9]{40}$/)) {
      setMsg("Title and valid contractor address are required.");
      return;
    }
    const q = Number(oracleQuorum);
    if (!Number.isFinite(q) || q < 1) {
      setMsg("Oracle quorum must be at least 1.");
      return;
    }
    const descs = rows.map((r) => r.description.trim()).filter(Boolean);
    if (descs.length !== rows.length) {
      setMsg("Each milestone needs a description.");
      return;
    }
    const payTok = paymentMode === "eth" ? ZeroAddress : tokenAddress;
    if (paymentMode === "erc20" && !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setMsg("Valid ERC-20 contract address required.");
      return;
    }

    let totalWei = 0n;
    const amounts: bigint[] = [];
    try {
      for (const r of rows) {
        const w =
          paymentMode === "eth"
            ? parseEther(r.amount || "0")
            : parseUnits(r.amount || "0", tokenDecimals);
        if (w <= 0n) throw new Error("positive");
        amounts.push(w);
        totalWei += w;
      }
    } catch {
      setMsg(paymentMode === "eth" ? "Invalid ETH amounts." : "Invalid token amounts.");
      return;
    }

    setBusy(true);
    try {
      const c = await getSignerContract(provider);
      const tx = await c.getFunction("createProject")(
        title.trim(),
        description.trim(),
        blueprintCid.trim() || "QmPlaceholderBlueprint",
        contractor,
        payTok,
        BigInt(q),
        descs,
        amounts,
        paymentMode === "eth" ? { value: totalWei } : {}
      );
      setMsg(`Submitted: ${tx.hash}`);
      await tx.wait();
      navigate("/explorer");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Create funded project</h1>
        <p className="mt-2 text-slate-400">
          Lock the <strong className="text-cyan-200">full milestone sum</strong> in the audit contract — native ETH or an
          ERC-20 stablecoin. Set how many <strong className="text-cyan-200">distinct oracles</strong> must attest before
          the public audit window opens.
        </p>
      </motion.div>

      <div className="mt-10 space-y-6">
        <div className="glass rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Settlement asset</label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode("eth")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                paymentMode === "eth"
                  ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              Native ETH
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("erc20")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                paymentMode === "erc20"
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Coins className="h-4 w-4" />
              ERC-20 / stablecoin
            </button>
          </div>
          {paymentMode === "erc20" && (
            <div className="mt-4">
              <label className="text-xs text-slate-500">Token contract (0x…)</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-500/50"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x…"
              />
              <p className="mt-2 text-xs text-slate-500">
                Decimals detected: <span className="font-mono text-slate-300">{tokenDecimals}</span>. Approve the audit
                contract for the total budget before creating the project.
              </p>
              <Button variant="secondary" className="mt-3" disabled={busy} onClick={() => void approveToken()}>
                Approve token spending
              </Button>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Oracle quorum</label>
          <input
            type="number"
            min={1}
            className="mt-2 w-full max-w-xs rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-500/50"
            value={oracleQuorum}
            onChange={(e) => setOracleQuorum(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-500">
            Number of <strong className="text-slate-400">different</strong> allowlisted oracle wallets that must attest
            before citizens can vote.
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Title</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-medium text-white outline-none focus:border-cyan-500/50"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. District bridge — span B"
          />
        </div>
        <div className="glass rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Description</label>
          <textarea
            className="mt-2 min-h-[100px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope, location, reference IDs…"
          />
        </div>
        <div className="glass rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Blueprint IPFS CID
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-cyan-100 outline-none focus:border-cyan-500/50"
            value={blueprintCid}
            onChange={(e) => setBlueprintCid(e.target.value)}
            placeholder="Qm… or bafy…"
          />
        </div>
        <div className="glass rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Contractor address</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-500/50"
            value={contractor}
            onChange={(e) => setContractor(e.target.value)}
            placeholder="0x…"
          />
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-white">Milestones</h2>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-white/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add milestone
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {rows.map((row, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:flex-row sm:items-center"
              >
                <input
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
                  value={row.description}
                  onChange={(e) =>
                    setRows((r) => r.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                  }
                  placeholder="Milestone description"
                />
                <div className="flex items-center gap-2">
                  <input
                    className="w-32 rounded-lg border border-white/10 bg-transparent px-3 py-2 font-mono text-sm text-emerald-200 outline-none focus:border-emerald-500/40"
                    value={row.amount}
                    onChange={(e) =>
                      setRows((r) => r.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
                    }
                    placeholder={paymentMode === "eth" ? "ETH" : "Tokens"}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Remove milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs text-slate-300">{msg}</div>
        )}

        <Button className="w-full !py-4 text-base" disabled={busy} onClick={() => void submit()}>
          {busy ? "Confirm in wallet…" : "Deploy project & lock funds"}
        </Button>
      </div>
    </div>
  );
}
