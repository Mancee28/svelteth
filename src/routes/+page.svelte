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
		sendTransaction,
	} from '$states/wallet.svelte.js';
	import type { EthereumTransaction } from '$types/eip2718.js';
	import { formatEth, formatGwei, shorten, toHex } from '$utils/index.js';

	import { onMount } from 'svelte';

	let theme: 'dark' | 'light' = $state('dark');

	let chainInfo = $derived(getChainInfo(wallet.chainId));

	let activeTab: 'info' | 'tsx' = $state('info');

	onMount(() => {
		listenToProviderEvents();
	});

	async function testTransaction() {
		if ( wallet.chainId !== BigInt(11155111) ) {
			alert('This test transaction is only available on the Sepolia testnet.');
			return;
		}
		try {
			const to = wallet.addresses[0]; // ti mandi ETH a te stesso
			const value = toHex(0.001); // Convert to hex

			const tx = {
				to,
				value,
				maxFeePerGas: toHex(wallet.gas.baseFee + wallet.gas.priority.fast),
				maxPriorityFeePerGas: toHex(wallet.gas.priority.fast),
				chainId: Number(wallet.chainId)
			} satisfies EthereumTransaction;

			const txHash = await sendTransaction(tx);
			console.log('Transaction sent:', txHash);
			alert(`TX inviata!\nHash: ${txHash}`);

		} catch (error: any) {
			console.error('Transaction failed:', error);
			alert(`TX fallita!\nErrore: ${error.message}`);
		}
	}
</script>

<div class="wallet-component {theme}">
	{#if wallet.error}
		<div class="error-container">
			<p class="error-message">Error: {wallet.error.message}</p>
			{#if wallet.error.code}
				<p class="error-code">Code: {wallet.error.code}</p>
			{/if}
		</div>
	{/if}
	{#if wallet.isConnected}
		<div class="wallet-layout">
			<aside class="wallet-sidebar">
				<div class="sidebar-header">
					<img src={wallet.info.icon} alt={wallet.info.name} class="sidebar-wallet-icon" />
					<span class="sidebar-wallet-name">{wallet.info.name}</span>
				</div>
				<button class="sidebar-button" onclick={() => (activeTab = 'info')} aria-label="Wallet Info">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
					</svg>
				</button>
				<button class="sidebar-button" onclick={() => (activeTab = 'tsx')} aria-label="Wallet TSX">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
					</svg>	
				</button>
				<button class="disconnect-button" onclick={disconnectWallet} aria-label="Disconnect Wallet">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
					</svg>
				</button>
			</aside>
			<main class="wallet-main">
				{#if activeTab === 'info'}
					<div class="wallet-info">
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
										<span class="detail-value address">{formatEth(wallet.balance)}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				{#if activeTab === 'tsx'}
					<div class="wallet-tsx">
						<span class="tsx-header">{formatGwei(wallet.gas.baseFee)} GWEI</span>
						<button onclick={testTransaction} class="test-transaction-button">Test Transaction</button>
					</div>
				{/if}
			</main>
		</div>
	{:else}
		<h2 class="connect-header">Connect Wallet</h2>
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
	{/if}
</div>

<style>
	
</style>