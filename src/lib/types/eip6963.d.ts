import type { EIP1193Provider } from 'eip1193-types';

export interface EIP6963ProviderInfo {
	uuid: string; // RFC4122 v4
	name: string; // “MetaMask”, “Rabby” …
	icon: string; // data:uri o https
	rdns: string; // es. "io.metamask"
}

export interface EIP6963ProviderDetail {
	info: EIP6963ProviderInfo;
	provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
	type: 'eip6963:announceProvider';
	detail: EIP6963ProviderDetail;
}

export interface EIP6963RequestProviderEvent extends Event {
	type: 'eip6963:requestProvider';
}
