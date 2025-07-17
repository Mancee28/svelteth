export function shorten(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatBalance(balance: bigint, fixed = 4): string {
    if (balance === BigInt(0)) return '0 ETH';
    const ethValue = Number(balance) / 1e18;
    return `${ethValue.toFixed(fixed)}`;
}