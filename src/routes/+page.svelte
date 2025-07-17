<script lang="ts">
	import { getChainInfo } from '$lib/chain/index.js';
	import {
		availableWallets,
		connectWallet,
		disconnectWallet,
		listenToProviderEvents,
		isConnecting,
		wallet,
		isSearching,
		signMessage,
		signTypedData,
	} from '$states/wallet.svelte.js';
	import { formatBalance, shorten } from '$utils/index.js';

	import { onMount } from 'svelte';

	let theme: 'dark' | 'light' = $state('dark');

	let chainInfo = $derived(getChainInfo(wallet.chainId));

	onMount(() => {
		listenToProviderEvents();
	});

	let signResult: string = $state("");
	let signError: string = $state("");

	async function testSign() {
		signResult = "";
		signError = "";
		try {
			signResult = await signMessage('Test message');
		} catch (e: any) {
			signError = e?.message ?? 'Errore nella firma';
		}
	}

	let signTypedResult: string = $state("");
	let signTypedError: string = $state("");

	const testTypedData = {
		types: {
			EIP712Domain: [
				{ name: "name", type: "string" },
				{ name: "version", type: "string" },
				{ name: "chainId", type: "uint256" },
				{ name: "verifyingContract", type: "address" }
			],
			Person: [
				{ name: "wallet", type: "address" },
				{ name: "name", type: "string" }
			]
		},
		primaryType: "Person",
		domain: {
			name: "Test DApp",
			version: "1",
			chainId: Number(wallet.chainId),
			verifyingContract: "0x0000000000000000000000000000000000000000"
		},
		message: {
			wallet: wallet.addresses[0],
			name: "Andrea"
		}
	};

	async function testSignTyped() {
		signTypedResult = "";
		signTypedError = "";
		try {
			signTypedResult = await signTypedData(testTypedData);
		} catch (e: any) {
			signTypedError = e?.message ?? 'Errore nella firma typedData';
		}
	}
</script>

<div class="wallet-component {theme}">
	{#if wallet.isConnected}
		<div class="wallet-container">
			<div class="wallet-header">
				<h2>Connected Wallet</h2>
				<img src={wallet.info.icon} alt={wallet.info.name} class="wallet-icon" />
			</div>
			<div class="wallet-info">
				<div class="wallet-name">{wallet.info.name}</div>
				<div class="wallet-card">
					<div class="wallet-details">
						<div class="wallet-detail">
							<span class="detail-label">Chain:</span>
							<img src={chainInfo.logo} alt={chainInfo.name} class="chain-logo" />
							<span class="detail-value">{chainInfo.name}</span>
						</div>

						<div class="wallet-detail">
							<span class="detail-label">Address:</span>
							<span class="detail-value address">{shorten(wallet.addresses[0])}</span>
						</div>

						<div class="balance-container">
							<div class="wallet-detail">
								<span class="detail-label">ETH:</span>
								<span class="detail-value address">{formatBalance(wallet.balance)}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="wallet-actions">
				<button onclick={disconnectWallet} class="disconnect-button">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="button-icon"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
							clip-rule="evenodd"
						/>
					</svg>
					Disconnect
				</button>
				<!-- Bottone temporaneo per test firma -->
				<button onclick={testSign} class="sign-test-button" style="margin-top:0.5rem;">
					Test Firma Messaggio
				</button>
				{#if signResult}
					<div class="sign-result">
						<p>Firma: <span style="word-break:break-all;">{signResult}</span></p>
					</div>
				{:else if signError}
					<div class="sign-error">
						<p style="color:#ef4444;">Errore: {signError}</p>
					</div>
				{/if}

				<!-- Bottone per testare la firma typedData -->
				<button onclick={testSignTyped} class="sign-test-button" style="margin-top:0.5rem;">
					Test Firma TypedData
				</button>
				{#if signTypedResult}
					<div class="sign-result">
						<p>Firma TypedData: <span style="word-break:break-all;">{signTypedResult}</span></p>
					</div>
				{:else if signTypedError}
					<div class="sign-error">
						<p style="color:#ef4444;">Errore: {signTypedError}</p>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="wallet-container">
			<h2 class="connect-header">Connect Wallet</h2>
			{#if wallet.error}
				<div class="error-container">
					<p class="error-message">Error: {wallet.error.message}</p>
					{#if wallet.error.code}
						<p class="error-code">Code: {wallet.error.code}</p>
					{/if}
				</div>
			{/if}
			{#if availableWallets.list.length === 0}
				<div class="empty-state">
					{#if isSearching()}
						<div class="loading-spinner"></div>
						<p class="loading-text">Detecting wallets...</p>
					{:else}
						<div class="no-wallet-message">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="warning-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<p>No wallets found. Please install a wallet extension.</p>
						</div>
					{/if}
				</div>
			{:else}
				<div class="wallets-list">
					{#each availableWallets.list as aWallet}
						<div class="wallet-item">
							<div class="wallet-item-info">
								<img src={aWallet.info.icon} alt={aWallet.info.name} class="wallet-item-icon" />
								<span class="wallet-item-name">{aWallet.info.name}</span>
							</div>
							<button
								onclick={() => connectWallet(aWallet)}
								disabled={isConnecting()}
								class="connect-button"
							>
								{#if isConnecting()}
									<span class="loading-state">
										<svg
											class="loading-icon"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Loading...
									</span>
								{:else}
									Connect
								{/if}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Base Styles */
	.wallet-component {
		--bg-primary: white;
		--bg-secondary: #f9fafb;
		--bg-hover: #f3f4f6;
		--text-primary: #1f2937;
		--text-secondary: #6b7280;
		--border-color: #e5e7eb;
		--border-accent: #d1d5db;
		--error-bg: #fee2e2;
		--error-border: #fecaca;
		--error-text: #ef4444;

		width: 100%;
		max-width: 28rem;
		margin: 0 auto;
		border-radius: 0.75rem;
		overflow: hidden;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 1px solid var(--border-color);
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Dark Theme */
	.wallet-component.dark {
		--bg-primary: #1f2937;
		--bg-secondary: #374151;
		--bg-hover: #4b5563;
		--text-primary: #f9fafb;
		--text-secondary: #9ca3af;
		--border-color: #374151;
		--border-accent: #4b5563;
		--error-bg: #7f1d1d;
		--error-border: #991b1b;
		--error-text: #fecaca;
	}

	.wallet-container {
		padding: 1.25rem;
	}

	.wallet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.wallet-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.wallet-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
	}

	.wallet-info {
		margin-top: 1rem;
	}

	.wallet-name {
		font-size: 1.125rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	.wallet-card {
		background-color: var(--bg-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.wallet-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.wallet-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.detail-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.detail-value {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.address {
		font-family: monospace;
	}

	.chain-logo {
		width: 1.25rem;
		height: 1.25rem;
		margin-left: 0.25rem;
		border-radius: 33%;
	}

	.balance-container {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border-accent);
	}

	.wallet-actions {
		margin-top: 1.5rem;
	}

	.disconnect-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 1rem;
		background-color: #dc2626;
		color: white;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: background-color 0.2s;
	}

	.disconnect-button:hover {
		background-color: #b91c1c;
	}

	.button-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.connect-header {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.error-container {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: var(--error-bg);
		border: 1px solid var(--error-border);
		border-radius: 0.5rem;
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error-text);
	}

	.error-code {
		font-size: 0.75rem;
		color: var(--error-text);
		margin-top: 0.25rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 0;
	}

	.loading-spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 0.25rem solid #60a5fa;
		border-top-color: transparent;
		border-radius: 9999px;
		animation: spin 1s linear infinite;
		margin-bottom: 0.75rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		color: var(--text-secondary);
	}

	.no-wallet-message {
		text-align: center;
	}

	.warning-icon {
		height: 3rem;
		width: 3rem;
		color: var(--text-secondary);
		margin: 0 auto 0.75rem;
	}

	.wallets-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.wallet-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background-color: var(--bg-secondary);
		border-radius: 0.5rem;
		transition: background-color 0.2s;
	}

	.wallet-item:hover {
		background-color: var(--bg-hover);
	}

	.wallet-item-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.wallet-item-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
	}

	.wallet-item-name {
		font-weight: 500;
	}

	.connect-button {
		padding: 0.5rem 1rem;
		background-color: #2563eb;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: background-color 0.2s;
	}

	.connect-button:hover:not(:disabled) {
		background-color: #1d4ed8;
	}

	.connect-button:disabled {
		background-color: #93c5fd;
		cursor: not-allowed;
	}

	.loading-state {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.loading-icon {
		animation: spin 1s linear infinite;
		height: 1rem;
		width: 1rem;
	}

	.sign-test-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.5rem 1rem;
		background-color: #059669;
		color: white;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: background-color 0.2s;
	}

	.sign-test-button:hover {
		background-color: #047857;
	}

	.sign-result {
		margin-top: 0.5rem;
		font-size: 0.85rem;
		word-break: break-all;
	}

	.sign-error {
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: #ef4444;
	}
</style>
