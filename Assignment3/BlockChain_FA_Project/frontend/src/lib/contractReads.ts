import { Contract, type ContractRunner } from "ethers";
import type { MilestoneOnChain, ProjectOnChain } from "../types";

const ERC20_META = ["function decimals() view returns (uint8)", "function symbol() view returns (string)"];

export async function fetchTokenDecimals(runner: ContractRunner, tokenAddress: string): Promise<number> {
  const t = new Contract(tokenAddress, ERC20_META, runner);
  try {
    return Number(await t.getFunction("decimals")());
  } catch {
    return 18;
  }
}

export async function fetchTokenSymbol(runner: ContractRunner, tokenAddress: string): Promise<string> {
  const t = new Contract(tokenAddress, ERC20_META, runner);
  try {
    return (await t.getFunction("symbol")()) as string;
  } catch {
    return "ERC20";
  }
}

export async function fetchProject(contract: Contract, projectId: bigint): Promise<ProjectOnChain> {
  const p = await contract.getFunction("projects")(projectId);
  return {
    title: p.title as string,
    description: p.description as string,
    blueprintIpfsHash: p.blueprintIpfsHash as string,
    government: p.government as string,
    contractor: p.contractor as string,
    paymentToken: p.paymentToken as string,
    oracleQuorum: p.oracleQuorum as bigint,
    createdAt: p.createdAt as bigint,
    totalBudget: p.totalBudget as bigint,
    totalPaidOut: p.totalPaidOut as bigint,
    active: p.active as boolean,
  };
}

export async function fetchMilestone(
  contract: Contract,
  projectId: bigint,
  index: bigint
): Promise<MilestoneOnChain> {
  const m = await contract.getFunction("getMilestone")(projectId, index);
  return {
    description: m.description as string,
    amountWei: m.amountWei as bigint,
    status: Number(m.status) as MilestoneOnChain["status"],
    evidenceIpfsHash: m.evidenceIpfsHash as string,
    submittedAt: m.submittedAt as bigint,
    oracleVerifiedAt: m.oracleVerifiedAt as bigint,
    publicAuditEndsAt: m.publicAuditEndsAt as bigint,
    citizenApprovals: m.citizenApprovals as bigint,
    citizenVetoes: m.citizenVetoes as bigint,
    oracleConfirmationCount: m.oracleConfirmationCount as bigint,
    oracleResetNonce: m.oracleResetNonce as bigint,
    lastOracleAttester: m.lastOracleAttester as string,
  };
}

export async function fetchMilestoneCount(contract: Contract, projectId: bigint): Promise<number> {
  const n = await contract.getFunction("milestoneCount")(projectId);
  return Number(n);
}

export async function fetchProjectCount(contract: Contract): Promise<number> {
  const n = await contract.getFunction("projectCount")();
  return Number(n);
}

export async function fetchContractBalance(contract: Contract): Promise<bigint> {
  return contract.getFunction("contractBalance")() as Promise<bigint>;
}

export async function fetchIsOracle(contract: Contract, addr: string): Promise<boolean> {
  return contract.getFunction("isOracle")(addr) as Promise<boolean>;
}

export async function fetchVetoThreshold(contract: Contract): Promise<bigint> {
  return contract.getFunction("vetoThreshold")() as Promise<bigint>;
}

export async function fetchAuditWindow(contract: Contract): Promise<bigint> {
  return contract.getFunction("publicAuditWindowSeconds")() as Promise<bigint>;
}
