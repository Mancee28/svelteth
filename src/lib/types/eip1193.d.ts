export interface EIP1193Provider {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	on?(event: string, listener: (...args: any[]) => void): void;
	removeListener?(event: string, listener: (...args: any[]) => void): void;
}