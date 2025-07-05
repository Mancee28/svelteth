import type { EIP6963ProviderDetail, EIP6963ProviderInfo } from '$types/eip6963.js';
import type { EIP1193Provider } from 'eip1193-types';

export interface WalletState extends EIP6963ProviderDetail {
	accounts: string[];
	chainId: string;
}

export const availableWallets = $state<{list: EIP6963ProviderDetail[]}>({
    list: [],
});

export const wallet = $state<WalletState>({
	info: {
		uuid: '',
		name: '',
		icon: '',
		rdns: ''
	},
	provider: {} as EIP1193Provider,
	accounts: [],
	chainId: ''
});

let connecting = $state(false);

export function handleAnnounceProvider(
    e: CustomEvent<EIP6963ProviderDetail>
) {
    if (!availableWallets.list.some(p => p.info.uuid === e.detail.info.uuid)) {
        availableWallets.list = [                     
            ...availableWallets.list,
            e.detail
        ];
         
        const storedRdns = localStorage.getItem('walletRDNS');
        if (storedRdns && storedRdns === e.detail.info.rdns) {
            connectWallet(e.detail);
        }
    }
}

export function connectWallet(w: EIP6963ProviderDetail) {
	if (connecting) return;
	connecting = true;
    w.provider.request({ method: 'eth_requestAccounts' })
        .then(a => {
            wallet.info = w.info;             
			wallet.provider = w.provider; 
             wallet.accounts = a as string[];           
            localStorage.setItem('walletRDNS', wallet.info.rdns);
			// setupProviderEvents(wallet.provider);
        })
        .catch(err => console.error('Error connecting to wallet:', err));
}

export function isConnecting() {
	return connecting;
}

// function setupProviderEvents(p: EIP1193Provider) {
// 	p.on('accountsChanged', (accounts: string[]) => {
// 		if (accounts.length > 0) {
// 			wallet.accounts = accounts;
// 			localStorage.setItem('selectedAccount', accounts[0]);
// 			localStorage.setItem('selectedAccountIndex', '0');
// 		} else {
// 			disconnectWallet();
// 		}
// 	});

// 	p.on('chainChanged', (chainId: string) => {
// 		console.log('Chain changed:', chainId);
// 		window.location.reload();
// 	});

// 	p.on('disconnect', () => {
// 		console.log('Wallet disconnected');
// 		disconnectWallet();
// 	});
// }

export function disconnectWallet() {
	wallet.provider = {} as EIP1193Provider;
	wallet.info = {
			uuid: '',
			name: '',
			icon: '',
			rdns: ''
		};
	wallet.accounts = [];
	wallet.chainId = '';

	localStorage.removeItem('walletRDNS');
}