import type { EIP6963ProviderDetail, EIP6963ProviderInfo } from '$types/eip6963.js';
import type { EIP1193Provider } from 'eip1193-types';
import type { JsonRpcSigner } from 'ethers';
import type { BrowserProvider } from 'ethers';
import { ethers } from 'ethers';

export interface WalletError {
	message: string;
	code?: number | string;
}

export interface WalletState {
	info: EIP6963ProviderInfo;
	provider: BrowserProvider | null;
	signer: JsonRpcSigner | null;
	address: string;
	balance: bigint;
	chainId: bigint;
	isConnected: boolean;
	error: WalletError | null;
}

export let availableWallets = $state<{ list: EIP6963ProviderDetail[] }>({ list: [] });

export let wallet = $state<WalletState>({
	info: { uuid: '', name: '', icon: '', rdns: '' },
	provider: null,
	signer: null,
	address: '',
	balance: 0n,
	chainId: 0n,
	isConnected: false,
	error: null
});


let connecting = $state(false);

export function handleAnnounceProvider(e: CustomEvent<EIP6963ProviderDetail>) {
	if (!availableWallets.list.some((p) => p.info.uuid === e.detail.info.uuid)) {
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

	const eth = w.provider as EIP1193Provider;

	try {
		const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];

		if (accounts.length === 0) {
			throw new Error('No accounts found. Please ensure you have an account in your wallet.');
		}
	} catch (err: any) {
		connecting = false;
		wallet.error = { message: err?.message || 'Failed to connect wallet', code: err?.code };
		return;
	}

	const bp = new ethers.BrowserProvider(eth);
	const signer = await bp.getSigner();
	const address = await signer.getAddress();
	const chain = await bp.getNetwork();

	wallet.info = w.info;
	wallet.provider = bp;
	wallet.signer = signer;
	wallet.address = address;
	wallet.balance = await bp.getBalance(address);
	wallet.chainId = chain.chainId;
	wallet.isConnected = true;

	eth.on('accountsChanged', async (accounts: string[]) => {
		if (accounts.length === 0) {
			disconnectWallet();
			return;
		}
		wallet.address = accounts[0];
		wallet.provider = new ethers.BrowserProvider(eth);
		wallet.signer = await wallet.provider.getSigner();
		wallet.balance = await wallet.provider.getBalance(wallet.address);
	});

	eth.on('chainChanged', async (chainId: string) => {
		wallet.chainId = BigInt(chainId);
		wallet.provider = new ethers.BrowserProvider(eth);
		wallet.signer = await wallet.provider.getSigner();
		wallet.balance = await wallet.provider.getBalance(wallet.address);
	});

	localStorage.setItem('walletRDNS', w.info.rdns);

	connecting = false;
}

export function isConnecting() {
	return connecting;
}

export async function disconnectWallet() {

	wallet.info = { uuid: '', name: '', icon: '', rdns: '' };
	wallet.provider = null;
	wallet.signer = null;
	wallet.address = '';
	wallet.balance = 0n;
	wallet.chainId = 0n;
	wallet.isConnected = false;
	wallet.error = null;

	localStorage.removeItem('walletRDNS');
}
