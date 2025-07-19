import type { Hex } from "$utils/index.ts";

export interface EthereumTransaction {
	to?: string;
	from?: string;
	value?: Hex;
	gas?: Hex;
	gasPrice?: Hex;
	maxFeePerGas?: Hex;
	maxPriorityFeePerGas?: Hex;
	data?: Hex;
	nonce?: number;
	chainId?: number;
}