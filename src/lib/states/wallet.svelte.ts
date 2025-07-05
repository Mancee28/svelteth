import type { EIP6963ProviderDetail } from '$types/eip6963.js';
import type { EIP1193Provider } from 'eip1193-types';
import type { BrowserProvider } from 'ethers';
import { ethers } from 'ethers';

export interface WalletState extends EIP6963ProviderDetail {
	ethersProvider: BrowserProvider;
	address?: string;
	balance: string;
	chainId?: bigint;
}

export let availableWallets = $state<{ list: EIP6963ProviderDetail[] }>({ list: [] });

export let wallet = $state<WalletState>({
	info: { uuid: '', name: '', icon: '', rdns: '' },
	provider: {} as EIP1193Provider,
	ethersProvider: {} as ethers.BrowserProvider,
	address: undefined,
	balance: '',
	chainId: undefined
});

export let walletError = $state<{message: string, code?: string}>({message: ''});

let connecting = $state(false);

export function handleAnnounceProvider(e: CustomEvent<EIP6963ProviderDetail>) {
	if (!availableWallets.list.some(p => p.info.uuid === e.detail.info.uuid)) {
		availableWallets.list = [...availableWallets.list, e.detail];
	}

	const rdns = localStorage.getItem('walletRDNS');
	if (rdns && e.detail.info.rdns === rdns) {
		connectWallet(e.detail);
	}

}

export async function connectWallet(w: EIP6963ProviderDetail) {
	if (connecting) return;          
	connecting = true;

	walletError.message = '';
    walletError.code = undefined;

		const eth      = w.provider as EIP1193Provider;

		let accounts: string[] = [];
		try {
			accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];

			if (accounts.length === 0) {
				throw new Error('No accounts found. Please ensure you have an account in your wallet.');
			}
		} catch (err: any) {
			connecting = false;
			walletError.message = err?.message || 'Failed to connect wallet';
			walletError.code = err?.code;
			return;
		}

		const bp 	   = new ethers.BrowserProvider(eth);
		const signer   = await bp.getSigner();
		const address  = await signer.getAddress();
		const chain    = await bp.getNetwork();

		wallet.info           = w.info;
		wallet.provider       = eth;
		wallet.ethersProvider = bp;
		wallet.address		  = address;
		wallet.balance        = (await bp.getBalance(address)).toString();
		wallet.chainId        = chain.chainId;


		eth.on('accountsChanged', async (accounts: string[]) => {
			if (accounts.length > 0) {
				wallet.address = accounts[0];
				wallet.ethersProvider = new ethers.BrowserProvider(wallet.provider);
				wallet.balance = (await wallet.ethersProvider.getBalance(wallet.address)).toString(); 
			} else {
				disconnectWallet();
			}
		});

		eth.on('chainChanged', async (chainId: string) => {
			wallet.chainId = BigInt(chainId);
			wallet.balance = 'Loading...'; 
			wallet.ethersProvider = new ethers.BrowserProvider(wallet.provider);
			if (wallet.address) {
				wallet.balance = (await wallet.ethersProvider.getBalance(wallet.address)).toString();
			} else {
				wallet.balance = 'Failed to Load';
			}
		});

		localStorage.setItem('walletRDNS', w.info.rdns);


}

export function isConnecting() {
	return connecting;
}

export async function disconnectWallet() {

	await wallet.ethersProvider.send('wallet_revokePermissions', [{
		eth_accounts: {}
	}]);

	wallet.info = { uuid: '', name: '', icon: '', rdns: '' };
	wallet.provider = {} as EIP1193Provider;
	wallet.ethersProvider = {} as ethers.BrowserProvider;
	wallet.address = undefined;
	wallet.balance = '';
	wallet.chainId = undefined;

	localStorage.removeItem('walletRDNS');
}