import { Contract, type InterfaceAbi } from "ethers";
import { useWallet } from "../context/WalletContext";
import artifact from "../abi/PublicWorkAudit.json";

const ABI = artifact.abi as InterfaceAbi;

export function getContractAddress(): string | null {
  const a = import.meta.env.VITE_CONTRACT_ADDRESS?.trim();
  return a || null;
}

export async function getReadContract(provider: NonNullable<ReturnType<typeof useWallet>["provider"]>) {
  const contractAddress = getContractAddress();
  if (!contractAddress) throw new Error("Missing VITE_CONTRACT_ADDRESS in frontend/.env");
  return new Contract(contractAddress, ABI, provider);
}

export async function getSignerContract(
  provider: NonNullable<ReturnType<typeof useWallet>["provider"]>
) {
  const contractAddress = getContractAddress();
  if (!contractAddress) throw new Error("Missing VITE_CONTRACT_ADDRESS in frontend/.env");
  const signer = await provider.getSigner();
  return new Contract(contractAddress, ABI, signer);
}
