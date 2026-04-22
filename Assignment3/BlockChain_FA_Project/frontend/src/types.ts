export type MilestoneStatusNum = 0 | 1 | 2 | 3 | 4 | 5;

export interface MilestoneOnChain {
  description: string;
  amountWei: bigint;
  status: MilestoneStatusNum;
  evidenceIpfsHash: string;
  submittedAt: bigint;
  oracleVerifiedAt: bigint;
  publicAuditEndsAt: bigint;
  citizenApprovals: bigint;
  citizenVetoes: bigint;
  oracleConfirmationCount: bigint;
  oracleResetNonce: bigint;
  lastOracleAttester: string;
}

export interface ProjectOnChain {
  title: string;
  description: string;
  blueprintIpfsHash: string;
  government: string;
  contractor: string;
  paymentToken: string;
  oracleQuorum: bigint;
  createdAt: bigint;
  totalBudget: bigint;
  totalPaidOut: bigint;
  active: boolean;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isNativeEth(token: string): boolean {
  return !token || token.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

export const MILESTONE_STATUS_LABEL: Record<number, string> = {
  0: "Pending",
  1: "Submitted",
  2: "Public audit",
  3: "Paid",
  4: "Disputed",
  5: "Rejected",
};

export function milestoneStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "text-slate-400";
    case 1:
      return "text-ledger-amber";
    case 2:
      return "text-cyan-400";
    case 3:
      return "text-emerald-400";
    case 4:
      return "text-ledger-rose";
    case 5:
      return "text-orange-400";
    default:
      return "text-slate-400";
  }
}

export function ipfsGateway(cid: string): string {
  const c = cid.trim();
  if (!c) return "";
  if (c.startsWith("http")) return c;
  return `https://ipfs.io/ipfs/${c}`;
}

export function shortAddr(a: string, n = 6): string {
  if (!a || a.length < 10) return a;
  return `${a.slice(0, n)}…${a.slice(-4)}`;
}
