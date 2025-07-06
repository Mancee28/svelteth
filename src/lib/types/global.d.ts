import type { EIP6963ProviderDetail } from './eip6963';
declare global {
	interface WindowEventMap {
		'eip6963:announceProvider': CustomEvent<EIP6963ProviderDetail>;
	}
}
export {};
