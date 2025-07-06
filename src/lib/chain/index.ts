interface ChainInfo {
    name: string;
    logo: string;
}

export const CHAIN: Record<number, ChainInfo> = {
    1: {
        name: 'Ethereum Mainnet',
        logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
    },
    8453: {
        name: 'Base',
        logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/8453/0x0000000000000000000000000000000000000000.png'
    },
    42162: {
        name: 'Arbitrum',
        logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/42161/0x0000000000000000000000000000000000000000.png',
    },
    59144: {
        name: 'Linea',
        logo:  'https://static.cx.metamask.io/api/v1/tokenIcons/59144/0x0000000000000000000000000000000000000000.png'
    }
    
}

export function getChainInfo(chainId: bigint | number | string | undefined): ChainInfo  {
    const id = Number(chainId);
    if (!chainId || !CHAIN.hasOwnProperty(id)) {
        return { 
            name: 'Unknown chain. You can add it with a pull request on GitHub.', 
            logo: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png'
        };
    }
    return CHAIN[id];
}