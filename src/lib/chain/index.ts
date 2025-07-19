interface ChainInfo {
	name: string;
	logo: string;
}

const CHAIN: Record<number, ChainInfo> = {
	1: {
		name: 'Ethereum Mainnet',
		logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png'
	},
	8453: {
		name: 'Base',
		logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/8453/0x0000000000000000000000000000000000000000.png'
	},
	42162: {
		name: 'Arbitrum',
		logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/42161/0x0000000000000000000000000000000000000000.png'
	},
	59144: {
		name: 'Linea',
		logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/59144/0x0000000000000000000000000000000000000000.png'
	},
	11155111: {
		name: 'Sepolia',
		logo: 'https://moralis.com/wp-content/uploads/web3wiki/1147-sepolia/637aee14aa9d9f521437ec16_hYC2y965v3QD7fEoVvutzGbJzVGLSOk6RZPwEQWcA_E-300x300.jpeg'
	}
};

export function getChainInfo(chainId: bigint | number | string): ChainInfo {
	const id = Number(chainId);

	if (!chainId || !CHAIN.hasOwnProperty(id)) {
		return {
			name: `Unknown chain (${id}). You can add it with a pull request on GitHub.`,
			logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png'
		};
	}

	return CHAIN[id];
}
