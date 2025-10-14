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
 * Wallet store containing all connected wallets
 */
class WalletStore {
	wallets = $state<Record<string, WalletState>>({});
	activeWalletId = $state<string | null>(null);
}

const store = new WalletStore();

/**
 * Map of all connected wallets, keyed by wallet ID (rdns)
 */
export const wallets = store.wallets;

/**
 * Currently active wallet ID
 */
export const activeWalletId = {
	get value() {
		return store.activeWalletId;
	},
	set value(id: string | null) {
		store.activeWalletId = id;
	}
};

const emptyWallet: WalletState = {
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
};

/**
 * Get the currently active wallet
 */
export function wallet(): WalletState {
	const id = store.activeWalletId;
	return id && store.wallets[id] ? store.wallets[id] : emptyWallet;
}

// Reactive flags for connection/search status
let connecting = $state(false);
let searching = $state(false);

// Store gas polling intervals per wallet
const gasPollingIntervals = new Map<string, NodeJS.Timeout>();

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
	if (!window) throw new Error('listenToProviderEvents can only be called in the browser.');
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

	// Auto-reconnect previously connected wallets
	const storedWallets = getStoredWalletRdns();
	if (storedWallets.includes(e.detail.info.rdns)) {
		connectWallet(e.detail);
	}
}

/**
 * Get list of all connected wallet IDs
 */
export function getConnectedWalletIds(): string[] {
	return Object.keys(store.wallets);
}

/**
 * Get a specific wallet by ID
 */
export function getWallet(walletId: string): WalletState | null {
	return store.wallets[walletId] || null;
}

/**
 * Switch the active wallet
 */
export function switchWallet(walletId: string): boolean {
	if (store.wallets[walletId]) {
		store.activeWalletId = walletId;
		return true;
	}
	return false;
}

/**
 * Get all connected wallets as an array
 */
export function getAllWallets(): WalletState[] {
	return Object.values(store.wallets);
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

	const walletId = w.info.rdns;

	// If already connected, just switch to it
	if (store.wallets[walletId]) {
		store.activeWalletId = walletId;
		return;
	}

	connecting = true;

	// Initialize new wallet state
	const newWallet: WalletState = {
		info: w.info,
		provider: w.provider,
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
	};

	try {
		// 1. Request accounts from provider
		const accounts = (await w.provider.request({ method: 'eth_requestAccounts' })) as string[];

		if (accounts.length === 0) throw new Error('No accounts found in the selected wallet.');

		// 2. Save all accounts
		newWallet.addresses = accounts;

		// 3. Request current chain ID
		const chainHex = (await w.provider.request({ method: 'eth_chainId' })) as string;
		newWallet.chainId = BigInt(chainHex);

		// 4. Set balance for the first account
		await setBalance(walletId, newWallet);

		// 5. Set gas fees
		startGasPolling(walletId, newWallet);

		// 6. Mark as connected
		newWallet.isConnected = true;

		// 7. Add to wallets map
		store.wallets[walletId] = newWallet;

		// 8. Set as active wallet
		store.activeWalletId = walletId;

		// 9. Save to localStorage
		saveWalletToStorage(walletId);

		// 10. Attach listeners for account/chain changes
		attachProviderListeners(walletId, newWallet.provider!);
	} catch (err: any) {
		newWallet.error = { message: err?.message ?? 'Unable to connect to wallet.', code: err?.code };
		// Still add it to show the error
		store.wallets[walletId] = newWallet;
		store.activeWalletId = walletId;
	} finally {
		connecting = false;
	}
}

/**
 * Attaches listeners to the provider for account and chain changes.
 */
function attachProviderListeners(walletId: string, provider: EIP1193Provider) {
	// Listen for account changes
	provider.on!('accountsChanged', async (accounts: string[]) => {
		const w = store.wallets[walletId];
		if (!w) return;

		w.addresses = accounts;
		if (accounts.length === 0) {
			disconnectWallet(walletId);
			return;
		}
		await setBalance(walletId, w);
	});

	// Listen for chain changes
	provider.on!('chainChanged', async (chainId: string) => {
		const w = store.wallets[walletId];
		if (!w) return;

		w.chainId = BigInt(chainId);
		await setBalance(walletId, w);
		await setGasFees(walletId, w);
	});

	provider.on!('block', async () => {
		const w = store.wallets[walletId];
		if (!w) return;
		await setGasFees(walletId, w);
	});
}

/**
 * Sets the balance for the first account.
 */
async function setBalance(walletId: string, w: WalletState) {
	if (!w.provider || w.addresses.length === 0) return;
	const hexWei = (await w.provider.request({
		method: 'eth_getBalance',
		params: [w.addresses[0], 'latest']
	})) as string;
	w.balance = BigInt(hexWei);
}

function startGasPolling(walletId: string, w: WalletState) {
	setGasFees(walletId, w); // Initial fetch
	const interval = setInterval(() => {
		const currentWallet = store.wallets[walletId];
		if (currentWallet) {
			setGasFees(walletId, currentWallet);
		}
	}, 5000);
	gasPollingIntervals.set(walletId, interval);
}

/**
 * Sets the gas fee for a specific wallet.
 */
export async function setGasFees(walletId?: string, w?: WalletState) {
	// If called without params, use active wallet
	const targetWallet = w || wallet();
	const targetId = walletId || store.activeWalletId;

	if (!targetWallet.provider || !targetId) return;

	try {
		const res = (await targetWallet.provider.request({
			method: 'eth_feeHistory',
			params: [1, 'latest', [0, 50, 75]] // safe = 0, avg = 50, fast = 90 percentile
		})) as {
			baseFeePerGas: string[];
			reward: string[][];
		};

		const baseFee = BigInt(res.baseFeePerGas[0]);
		const rewards = res.reward[0]; // [safe, avg, fast]

		targetWallet.gas = {
			baseFee,
			priority: {
				safe: BigInt(rewards[0] || '0x0'),
				average: BigInt(rewards[1] || '0x0'),
				fast: BigInt(rewards[2] || '0x0')
			}
		};

		console.log(`EIP-1559 gas data fetched for ${targetId}:`, $state.snapshot(targetWallet.gas));
	} catch (err) {
		console.error(`Failed to fetch EIP-1559 gas data for ${targetId}`, err);
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
	const w = wallet();
	const from = w.addresses[0];
	return (await w.provider!.request({
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
	const w = wallet();
	const from = w.addresses[0];
	return (await w.provider!.request({
		method: 'eth_sendTransaction',
		params: [{ from, ...tx }]
	})) as string;
}

/**
 * Utility: throws if wallet is not connected or no account available.
 */
function ensureReady() {
	const w = wallet();
	if (!w.isConnected || !w.provider || w.addresses.length === 0) {
		throw new Error('Wallet not connected or no account available.');
	}
}

/**
 * Disconnects a wallet. If no walletId provided, disconnects the active wallet.
 * Pass 'all' to disconnect all wallets.
 */
export function disconnectWallet(walletId?: string) {
	if (walletId === 'all') {
		// Disconnect all wallets
		const allIds = Object.keys(store.wallets);
		allIds.forEach((id) => {
			const interval = gasPollingIntervals.get(id);
			if (interval) {
				clearInterval(interval);
				gasPollingIntervals.delete(id);
			}
			delete store.wallets[id];
		});
		store.activeWalletId = null;
		localStorage.removeItem('connectedWallets');
		return;
	}

	const targetId = walletId || store.activeWalletId;
	if (!targetId || !store.wallets[targetId]) return;

	// Clear gas polling interval
	const interval = gasPollingIntervals.get(targetId);
	if (interval) {
		clearInterval(interval);
		gasPollingIntervals.delete(targetId);
	}

	// Remove wallet
	delete store.wallets[targetId];

	// Update active wallet
	if (store.activeWalletId === targetId) {
		const remainingIds = Object.keys(store.wallets);
		store.activeWalletId = remainingIds.length > 0 ? remainingIds[0] : null;
	}

	// Update localStorage
	removeWalletFromStorage(targetId);
}

// ============================================================================
// localStorage helpers
// ============================================================================

/**
 * Get list of stored wallet RDNs from localStorage
 */
function getStoredWalletRdns(): string[] {
	if (typeof window === 'undefined') return [];
	const stored = localStorage.getItem('connectedWallets');
	if (!stored) return [];
	try {
		return JSON.parse(stored);
	} catch {
		return [];
	}
}

/**
 * Save a wallet RDNS to localStorage
 */
function saveWalletToStorage(walletId: string) {
	if (typeof window === 'undefined') return;
	const stored = getStoredWalletRdns();
	if (!stored.includes(walletId)) {
		stored.push(walletId);
		localStorage.setItem('connectedWallets', JSON.stringify(stored));
	}
}

/**
 * Remove a wallet RDNS from localStorage
 */
function removeWalletFromStorage(walletId: string) {
	if (typeof window === 'undefined') return;
	const stored = getStoredWalletRdns();
	const updated = stored.filter((id) => id !== walletId);
	if (updated.length > 0) {
		localStorage.setItem('connectedWallets', JSON.stringify(updated));
	} else {
		localStorage.removeItem('connectedWallets');
	}
}
