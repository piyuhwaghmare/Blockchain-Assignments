import { formatEther, formatUnits } from "ethers";
import { isNativeEth } from "../types";

export function formatBudget(
  amountWei: bigint,
  paymentToken: string,
  tokenDecimals: number
): string {
  if (isNativeEth(paymentToken)) {
    return `${formatEther(amountWei)} ETH`;
  }
  return `${formatUnits(amountWei, tokenDecimals)} tokens`;
}
