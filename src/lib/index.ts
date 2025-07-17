export {
	availableWallets,
	wallet,
	connectWallet,
	disconnectWallet,
	listenToProviderEvents,
	isConnecting,
	isSearching,
	signMessage,
	signTypedData,
	sendTransaction
} from './states/wallet.svelte';

export type { WalletState } from './states/wallet.svelte';

export type {
	EIP6963ProviderInfo,
	EIP6963ProviderDetail,
	EIP6963AnnounceProviderEvent,
	EIP6963RequestProviderEvent
} from './types/eip6963.js';

export { getChainInfo } from './chain/index.js';

export { shorten, formatBalance } from './utils/index.js';

export type {
	EIP712TypedData,
	EIP712Domain,
	EIP712TypeField,
	EIP712Types
} from './types/eip712.js';
