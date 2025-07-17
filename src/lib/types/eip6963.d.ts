import type { EIP1193Provider } from 'eip1193-types';

/** Basic information about an EIP-6963 provider */
export interface EIP6963ProviderInfo {
	uuid: string; // Unique RFC4122 v4 identifier
	name: string; // Provider name, e.g. “MetaMask”, “Rabby”
	icon: string; // Icon as data:uri or https URL
	rdns: string; // Reverse DNS, e.g. "io.metamask"
}

/** Full details of an EIP-6963 provider */
export interface EIP6963ProviderDetail {
	info: EIP6963ProviderInfo; // Provider information
	provider: EIP1193Provider; // EIP-1193 provider object
}

/** Provider announce event (EIP-6963) */
export interface EIP6963AnnounceProviderEvent extends CustomEvent {
	type: 'eip6963:announceProvider'; // Event type
	detail: EIP6963ProviderDetail; // Announced provider details
}

/** Provider request event (EIP-6963) */
export interface EIP6963RequestProviderEvent extends Event {
	type: 'eip6963:requestProvider'; // Event type
}
