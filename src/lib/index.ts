export { default as Wallet } from './components/Wallet.svelte';

export {
	availableWallets,
	wallet,
	connectWallet,
	disconnectWallet,
	handleAnnounceProvider,
	isConnecting
} from './states/wallet.svelte';

export type { WalletState } from './states/wallet.svelte';

export type {
	EIP6963ProviderInfo,
	EIP6963ProviderDetail,
	EIP6963AnnounceProviderEvent,
	EIP6963RequestProviderEvent
} from './types/eip6963.js';

export { formatEth } from './utils/index.js';

export { getChainInfo } from './chain/index.js';
