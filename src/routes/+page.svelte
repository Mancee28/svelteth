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
		sendTransaction
	} from '$states/wallet.svelte.js';
	import { formatEth, shorten, toHex } from '$utils/index.js';
	import type { EthereumTransaction } from '$types/eip2718.js';

	import { onMount } from 'svelte';

	let chainInfo = $derived(getChainInfo(wallet.chainId));
	let isTestingMessage = $state(false);
	let isTestingTransaction = $state(false);

	onMount(() => {
		listenToProviderEvents();
	});

	// Demo per firmare un messaggio
	async function testSignMessage() {
		if (isTestingMessage) return;
		isTestingMessage = true;

		try {
			const message = `Hello from Svelteth!\nTimestamp: ${new Date().toISOString()}`;
			const signature = await signMessage(message);
			alert(`Message signed successfully!\n\nMessage: ${message}\n\nSignature: ${signature}`);
		} catch (error: any) {
			console.error('Message signing failed:', error);
			alert(`Failed to sign message!\nError: ${error.message}`);
		} finally {
			isTestingMessage = false;
		}
	}

	// Demo transazione per Sepolia testnet
	async function testTransaction() {
		if (isTestingTransaction) return;
		if (wallet.chainId !== BigInt(11155111)) {
			alert('This test transaction is only available on the Sepolia testnet.');
			return;
		}

		isTestingTransaction = true;

		try {
			// Send ETH to the connected address (self-transfer) just as a test.
			const to = wallet.addresses[0];
			// Convert 0.001 ETH to wei (1 ETH = 10^18 wei)
			const valueInWei = BigInt(Math.floor(0.001 * 10**18)); // 0.001 ETH in wei
			const value = toHex(valueInWei); // Convert wei to hex
			const tx = {
				to,
				value,
				maxFeePerGas: toHex(wallet.gas.baseFee + wallet.gas.priority.fast),
				maxPriorityFeePerGas: toHex(wallet.gas.priority.fast),
				chainId: Number(wallet.chainId)
			} satisfies EthereumTransaction;

			const txHash = await sendTransaction(tx);
			console.log('Transaction sent:', txHash);
			alert(`Transaction sent successfully!\n\nHash: ${txHash}\n\nAmount: 0.001 ETH (self-transfer)`);
		} catch (error: any) {
			console.error('Transaction failed:', error);
			alert(`Transaction failed!\nError: ${error.message}`);
		} finally {
			isTestingTransaction = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
	<div class="max-w-4xl mx-auto">
		{#if wallet.error}
			<div class="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
				<div class="flex items-start gap-3">
					<svg class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
					</svg>
					<div>
						<p class="text-red-200 font-medium">Error: {wallet.error.message}</p>
						{#if wallet.error.code}
							<p class="text-red-300/80 text-sm mt-1">Code: {wallet.error.code}</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if wallet.isConnected}
			<div class="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
				<div class="flex flex-col lg:flex-row">
					<!-- Sidebar -->
					<aside class="bg-gradient-to-b from-blue-600/20 to-purple-600/20 p-6 lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10">
						<div class="flex items-center gap-4 mb-6">
							<div class="relative">
								<img src={wallet.info.icon} alt={wallet.info.name} class="w-12 h-12 rounded-full ring-2 ring-white/20" />
								<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800"></div>
							</div>
							<div>
								<span class="text-white font-semibold text-lg block">{wallet.info.name}</span>
								<span class="text-white/60 text-sm">Connected</span>
							</div>
						</div>

						<!-- Demo Actions -->
						<div class="space-y-3 mb-6">
							<h3 class="text-white/80 font-semibold text-sm uppercase tracking-wide">Demo Actions</h3>

							<!-- Sign Message Demo -->
							<button
								onclick={testSignMessage}
								disabled={isTestingMessage}
								class="w-full flex items-center gap-3 px-4 py-3 text-blue-200 hover:text-blue-100 hover:bg-blue-500/20 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
								</svg>
								<div class="flex-1 text-left">
									<span class="font-medium block">
										{#if isTestingMessage}
											Signing...
										{:else}
											Sign Message
										{/if}
									</span>
									<span class="text-xs text-blue-300/70">Test message signing</span>
								</div>
								{#if isTestingMessage}
									<div class="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
								{/if}
							</button>

							<!-- Test Transaction Demo (only for Sepolia) -->
							{#if wallet.chainId === BigInt(11155111)}
								<button
									onclick={testTransaction}
									disabled={isTestingTransaction}
									class="w-full flex items-center gap-3 px-4 py-3 text-purple-200 hover:text-purple-100 hover:bg-purple-500/20 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
									</svg>
									<div class="flex-1 text-left">
										<span class="font-medium block">
											{#if isTestingTransaction}
												Sending...
											{:else}
												Test Transaction
											{/if}
										</span>
										<span class="text-xs text-purple-300/70">0.001 ETH self-transfer</span>
									</div>
									{#if isTestingTransaction}
										<div class="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"></div>
									{/if}
								</button>
							{:else}
								<div class="w-full flex items-center gap-3 px-4 py-3 text-gray-400 bg-gray-500/10 rounded-xl">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
									</svg>
									<div class="flex-1 text-left">
										<span class="font-medium block">Test Transaction</span>
										<span class="text-xs text-gray-500">Only available on Sepolia</span>
									</div>
								</div>
							{/if}
						</div>

						<!-- Disconnect Button -->
						<button
							onclick={disconnectWallet}
							class="w-full flex items-center gap-3 px-4 py-3 text-red-200 hover:text-red-100 hover:bg-red-500/20 rounded-xl transition-all duration-200 group"
							aria-label="Disconnect Wallet"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
								/>
							</svg>
							<span class="font-medium">Disconnect</span>
						</button>
					</aside>

					<!-- Main Content -->
					<main class="flex-1 p-6">
						<div class="space-y-6">
							<h1 class="text-2xl font-bold text-white mb-6">Wallet Information</h1>

							<!-- Chain Info -->
							<div class="bg-white/5 rounded-xl p-6 border border-white/10">
								<div class="flex items-center gap-4">
									<div class="flex items-center gap-3">
										<img src={chainInfo.logo} alt={chainInfo.name} class="w-8 h-8 rounded-full" />
										<div>
											<span class="text-white/60 text-sm block">Network</span>
											<span class="text-white font-semibold text-lg">{chainInfo.name}</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Address -->
							<div class="bg-white/5 rounded-xl p-6 border border-white/10">
								<div class="flex items-center justify-between">
									<div>
										<span class="text-white/60 text-sm block mb-1">Address</span>
										<span class="text-white font-mono text-lg">{shorten(wallet.addresses[0])}</span>
									</div>
									<button
										onclick={() => navigator.clipboard.writeText(wallet.addresses[0])}
										class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
										title="Copy address"
										aria-label="Copy address to clipboard"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
										</svg>
									</button>
								</div>
							</div>

							<!-- Balance -->
							<div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10">
								<div class="flex items-center justify-between">
									<div>
										<span class="text-white/60 text-sm block mb-1">Balance</span>
										<span class="text-white font-bold text-2xl">{formatEth(wallet.balance)} ETH</span>
									</div>
									<div class="text-4xl">💎</div>
								</div>
							</div>
						</div>
					</main>
				</div>
			</div>
		{:else}
			<div class="text-center">
				<div class="max-w-md mx-auto">
					<h2 class="text-3xl font-bold text-white mb-2">Connect Your Wallet</h2>
					<p class="text-white/60 mb-8">Choose your preferred wallet to get started</p>

					{#if availableWallets.list.length === 0}
						<div class="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
							{#if isSearching()}
								<div class="flex flex-col items-center gap-4">
									<div class="relative">
										<div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
									</div>
									<p class="text-white/80">Detecting wallets...</p>
								</div>
							{:else}
								<div class="flex flex-col items-center gap-4">
									<div class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="w-8 h-8 text-yellow-400"
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
									</div>
									<div class="text-center">
										<p class="text-white font-semibold mb-2">No wallets found</p>
										<p class="text-white/60 text-sm">Please install a wallet extension to continue</p>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<div class="space-y-3">
							{#each availableWallets.list as aWallet}
								<div class="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-200">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-4">
											<img src={aWallet.info.icon} alt={aWallet.info.name} class="w-10 h-10 rounded-full" />
											<span class="text-white font-semibold text-lg">{aWallet.info.name}</span>
										</div>
										<button
											onclick={() => connectWallet(aWallet)}
											disabled={isConnecting()}
											class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
										>
											{#if isConnecting()}
												<div class="flex items-center gap-2">
													<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
													<span>Connecting...</span>
												</div>
											{:else}
												<span>Connect</span>
											{/if}
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>