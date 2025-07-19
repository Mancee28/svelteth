export type Hex = `0x${string}`;

export function shorten(addr: string) {
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatEth(wei: bigint, fixed = 4): string {
	if (wei === BigInt(0)) return '0';
	const ethValue = Number(wei) / 1e18;
	return `${ethValue.toFixed(fixed)}`;
}

export function formatGwei(wei: bigint, fixed = 2): string {
	if (wei === BigInt(0)) return '0';
	const gwei = Number(wei) / 1e9;
	return `${gwei.toFixed(fixed)}`;
}

/**
 * Converts a number or bigint to a hex string with 0x prefix.
 */
export function toHex(value: number | bigint): Hex {
	return `0x${value.toString(16)}` as Hex;
}

/**
 * Checks whether a string is a valid 0x-prefixed hex string.
 */
export function isHex(value: string): value is Hex {
	return /^0x[0-9a-fA-F]*$/.test(value);
}