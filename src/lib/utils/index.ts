import { ethers } from "ethers";

/** Format ETH balance with 6 decimal places max */
export function formatEth(balance: bigint): string {
    const eth = ethers.formatEther(balance);
    return parseFloat(parseFloat(eth).toFixed(6)).toString();
}
