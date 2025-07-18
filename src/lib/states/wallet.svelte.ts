import { browser } from '$app/environment';
import type { EIP1193Provider } from '$types/eip1193.js';
import type { GasEstimates } from '$types/eip1559.js';
import type { EthereumTransaction } from '$types/eip2718.js';
import type { EIP6963ProviderDetail, EIP6963ProviderInfo } from '$types/eip6963.js';

/**
 *  Interface for wallet error details
 */
export interface WalletError {
	message: string;
	code?: number | string;
}

/**
 * Interface for wallet state
 */
export interface WalletState {
	info: EIP6963ProviderInfo; // Wallet metadata
	provider: EIP1193Provider | null; // Wallet provider instance
	addresses: string[]; // List of wallet addresses
	chainId: bigint; // Current chain ID
	balance: bigint; // Current balance in wei
	gas: GasEstimates; // Gas estimates (base fee and priority fees)
	isConnected: boolean; // Connection status
	error: WalletError | null; // Error details, if any
}

/**
 * Reactive wallet state
 */
export let wallet = $state<WalletState>({
	info: { uuid: '', name: '', icon: '', rdns: '' },
	provider: null,
	addresses: [],
	chainId: 0n,
	balance: 0n,
	isConnected: false,
	gas: {
		baseFee: 0n,
		priority: {
			safe: 0n,
			average: 0n,
			fast: 0n
		}
	},
	error: null
});

// Reactive flags for connection/search status
let connecting = $state(false);
let searching = $state(false);

/**
 * List of available wallets detected
 */
export let availableWallets = $state<{ list: EIP6963ProviderDetail[] }>({ list: [] });

/**
 * Listen for wallet provider events in the browser.
 * Adds event listeners and requests provider announcement.
 * Returns a cleanup function to remove listeners.
 */
export function listenToProviderEvents() {
	if (!browser) throw new Error('listenToProviderEvents can only be called in the browser.');
	searching = true;
	window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);

	const timeout = setTimeout(() => {
		searching = false;
	}, 3000);

	window.dispatchEvent(new Event('eip6963:requestProvider'));

	return () => {
		window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
		clearTimeout(timeout);
	};
}

/**
 * Handles provider announcement events.
 * Adds new providers to the available list and auto-connects if RDNS matches.
 */
function handleAnnounceProvider(e: CustomEvent<EIP6963ProviderDetail>) {
	if (!availableWallets.list.some((p) => p.info.uuid === e.detail.info.uuid)) {
		availableWallets.list = [...availableWallets.list, e.detail];
	}

	const rdns = localStorage.getItem('walletRDNS');
	if (rdns && e.detail.info.rdns === rdns) {
		connectWallet(e.detail);
	}
}

/**
 * Returns whether the wallet search is in progress.
 */
export function isSearching() {
	return searching;
}

/**
 * Connects to a wallet provider.
 * Requests accounts and chain ID, sets state, and attaches listeners.
 */
export async function connectWallet(w: EIP6963ProviderDetail) {
	if (connecting) return;
	connecting = true;

	wallet.info = w.info;
	wallet.provider = w.provider;

	try {
		// 1. Request accounts from provider
		const accounts = (await wallet.provider.request({ method: 'eth_requestAccounts' })) as string[];

		if (accounts.length === 0) throw new Error('No accounts found in the selected wallet.');

		// 2. Save all accounts
		wallet.addresses = accounts;

		// 3. Request current chain ID
		const chainHex = (await wallet.provider.request({ method: 'eth_chainId' })) as string;
		wallet.chainId = BigInt(chainHex); // e.g. '0x1' → 1n

		// 4. Set balance for the first account
		await setBalance();
		
		// 5. Set gas fees
		startGasPolling();

		// 6. Mark as connected
		wallet.isConnected = true;
		localStorage.setItem('walletRDNS', w.info.rdns);

		// 6. Attach listeners for account/chain changes
		attachProviderListeners(wallet.provider);
	} catch (err: any) {
		wallet.error = { message: err?.message ?? 'Unable to connect to wallet.', code: err?.code };
	} finally {
		connecting = false;
	}
}

/**
 * Attaches listeners to the provider for account and chain changes.
 */
function attachProviderListeners(provider: EIP1193Provider) {
	// Listen for account changes
	provider.on!('accountsChanged', async (accounts: string[]) => {
		wallet.addresses = accounts;
		if (accounts.length === 0) {
			disconnectWallet();
			return;
		}
		await setBalance();
	});

	// Listen for chain changes
	provider.on!('chainChanged', async (chainId: string) => {
		wallet.chainId = BigInt(chainId);
		await setBalance();
		await setGasFees();
	});

	provider.on!('block' , async () => {
		await setGasFees();
	});
}

/**	
 * Sets the balance for the first account.
 */
async function setBalance() {
	if (!wallet.provider || wallet.addresses.length === 0) return;
	const hexWei = (await wallet.provider.request({
		method: 'eth_getBalance',
		params: [wallet.addresses[0], 'latest']
	})) as string;
	wallet.balance = BigInt(hexWei);
}

function startGasPolling() {
	setGasFees(); // Initial fetch
	setInterval(setGasFees, 5000);
}

/**
 * Sets the gas fee.
 */
export async function setGasFees() {
	if (!wallet.provider) return;

	try {
		const res = await wallet.provider.request({
			method: 'eth_feeHistory',
			params: [1, 'latest', [0, 50, 75]] // safe = 0, avg = 50, fast = 90 percentile
		}) as {
			baseFeePerGas: string[];
			reward: string[][];
		};

		const baseFee = BigInt(res.baseFeePerGas[0]);
		const rewards = res.reward[0]; // [safe, avg, fast]

		wallet.gas = {
			baseFee,
			priority: {
				safe: BigInt(rewards[0] || '0x0'),
				average: BigInt(rewards[1] || '0x0'),
				fast: BigInt(rewards[2] || '0x0')
			}
		};

		console.log('EIP-1559 gas data fetched:', wallet.gas);

	} catch (err) {
		console.error('Failed to fetch EIP-1559 gas data', err);
	}
}

/**
 * Returns whether a wallet connection is in progress.
 */
export function isConnecting() {
	return connecting;
}

/**
 * Signs a message (UTF-8 string) and returns the signature 0x…
 */
export async function signMessage(message: string): Promise<string> {
	ensureReady();
	const from = wallet.addresses[0];
	return (await wallet.provider!.request({
		method: 'personal_sign',
		params: [message, from]
	})) as string;
}

/**
 * Signs and sends a transaction.
 * `tx` follows the JSON-RPC syntax (gas, gasPrice, to, data, value, chainId…).
 * Returns the transaction hash.
 */
export async function sendTransaction(tx: EthereumTransaction): Promise<string> {
	ensureReady();
	const from = wallet.addresses[0];
	return (await wallet.provider!.request({
		method: 'eth_sendTransaction',
		params: [{ from, ...tx }]
	})) as string;
}

/**
 * Utility: throws if wallet is not connected or no account available.
 */
function ensureReady() {
	if (!wallet.isConnected || !wallet.provider || wallet.addresses.length === 0) {
		throw new Error('Wallet not connected or no account available.');
	}
}

/**
 * Disconnects the wallet and resets state.
 */
export function disconnectWallet() {
	wallet.info = { uuid: '', name: '', icon: '', rdns: '' };
	wallet.provider = null;
	wallet.addresses = [];
	wallet.chainId = 0n;
	wallet.balance = 0n;
	wallet.isConnected = false;
	wallet.gas = {
		baseFee: 0n,
		priority: {
			safe: 0n,
			average: 0n,
			fast: 0n
		}
	};
	wallet.error = null;
	localStorage.removeItem('walletRDNS');
}
