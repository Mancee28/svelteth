<script lang="ts">
	import { getChainInfo } from '$lib/chain/index.js';
	import {
		availableWallets,
		connectWallet,
		disconnectWallet,
		listenToProviderEvents,
		isConnecting,
		wallet,
		wallets,
		getAllWallets,
		switchWallet,
		isSearching,
		signMessage,
		sendTransaction
	} from '$states/wallet.svelte.js';
	import { formatEth, shorten, toHex } from '$utils/index.js';
	import type { EthereumTransaction } from '$types/eip2718.js';

	import { onMount } from 'svelte';

	// Derived state for all connected wallets
	let connectedWallets = $derived(getAllWallets());
	let activeWallet = $derived(wallet());
	let chainInfo = $derived(getChainInfo(activeWallet.chainId));
	let isTestingMessage = $state(false);
	let isTestingTransaction = $state(false);
	let showMultiWalletDemo = $state(false);

	// Multi-wallet transfer state
	let transferAmount = $state('0.001');
	let selectedRecipient = $state('');
	let isTransferring = $state(false);

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
		const w = wallet();
		if (w.chainId !== BigInt(11155111)) {
			alert('This test transaction is only available on the Sepolia testnet.');
			return;
		}

		isTestingTransaction = true;

		try {
			// Send ETH to the connected address (self-transfer) just as a test.
			const to = w.addresses[0];
			// Convert 0.001 ETH to wei (1 ETH = 10^18 wei)
			const valueInWei = BigInt(Math.floor(0.001 * 10**18)); // 0.001 ETH in wei
			const value = toHex(valueInWei); // Convert wei to hex
			const tx = {
				to,
				value,
				maxFeePerGas: toHex(w.gas.baseFee + w.gas.priority.fast),
				maxPriorityFeePerGas: toHex(w.gas.priority.fast),
				chainId: Number(w.chainId)
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

	// Multi-wallet transfer
	async function transferBetweenWallets() {
		if (isTransferring || !selectedRecipient) return;

		const sender = wallet();
		const recipient = wallets[selectedRecipient];

		if (!recipient) {
			alert('Please select a recipient wallet');
			return;
		}

		isTransferring = true;

		try {
			const valueInWei = BigInt(Math.floor(parseFloat(transferAmount) * 10**18));
			const value = toHex(valueInWei);

			const tx = {
				to: recipient.addresses[0],
				value,
				maxFeePerGas: toHex(sender.gas.baseFee + sender.gas.priority.fast),
				maxPriorityFeePerGas: toHex(sender.gas.priority.fast),
				chainId: Number(sender.chainId)
			} satisfies EthereumTransaction;

			const txHash = await sendTransaction(tx);

			alert(`Transfer successful!\n\nFrom: ${sender.info.name}\nTo: ${recipient.info.name}\nAmount: ${transferAmount} ETH\n\nTx: ${txHash}`);
		} catch (error: any) {
			console.error('Transfer failed:', error);
			alert(`Transfer failed!\nError: ${error.message}`);
		} finally {
			isTransferring = false;
		}
	}

	// Calculate total balance across all wallets
	let totalBalance = $derived(
		connectedWallets.reduce((sum, w) => sum + w.balance, 0n)
	);
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
	<div class="max-w-4xl mx-auto">
		{#if activeWallet.error}
			<div class="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
				<div class="flex items-start gap-3">
					<svg class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
					</svg>
					<div>
						<p class="text-red-200 font-medium">Error: {activeWallet.error.message}</p>
						{#if activeWallet.error.code}
							<p class="text-red-300/80 text-sm mt-1">Code: {activeWallet.error.code}</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if connectedWallets.length > 0}
			<div class="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
				<div class="flex flex-col lg:flex-row">
					<!-- Sidebar -->
					<aside class="bg-gradient-to-b from-blue-600/20 to-purple-600/20 p-6 lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10">
						<div class="mb-6">
							<h3 class="text-white/80 font-semibold text-sm uppercase tracking-wide mb-3">
								Connected Wallets ({connectedWallets.length})
							</h3>
							<div class="space-y-2">
								{#each connectedWallets as w}
									{@const walletId = w.info.rdns}
									{@const isActive = activeWallet.info.rdns === walletId}
									<div
										class="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 {isActive
											? 'bg-white/20 ring-2 ring-white/30'
											: 'bg-white/5 hover:bg-white/10'}"
									>
										<div class="relative">
											<img src={w.info.icon} alt={w.info.name} class="w-10 h-10 rounded-full" />
											{#if isActive}
												<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800"></div>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<div class="text-white font-medium text-sm truncate">{w.info.name}</div>
											<div class="text-white/60 text-xs font-mono">{shorten(w.addresses[0])}</div>
										</div>
										<div class="flex gap-1">
											{#if !isActive}
												<button
													onclick={() => switchWallet(walletId)}
													class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
													title="Switch to this wallet"
													aria-label="Switch to this wallet"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
													</svg>
												</button>
											{/if}
											<button
												onclick={() => disconnectWallet(walletId)}
												class="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
												title="Disconnect wallet"
												aria-label="Disconnect wallet"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
												</svg>
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Add Another Wallet Button -->
						<div class="mb-6">
							<button
								onclick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
								class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
								</svg>
								Connect Another Wallet
							</button>
						</div>

						<!-- Multi-Wallet Summary -->
						{#if connectedWallets.length > 1}
							<div class="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-white/20">
								<h3 class="text-white/80 font-semibold text-sm uppercase tracking-wide mb-2">Total Portfolio</h3>
								<div class="text-2xl font-bold text-white">{formatEth(totalBalance)} ETH</div>
								<div class="text-xs text-white/60 mt-1">Across {connectedWallets.length} wallets</div>
							</div>
						{/if}

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
							{#if activeWallet.chainId === BigInt(11155111)}
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

							<!-- Multi-Wallet Transfer (only if 2+ wallets) -->
							{#if connectedWallets.length >= 2}
								<button
									onclick={() => showMultiWalletDemo = !showMultiWalletDemo}
									class="w-full flex items-center gap-3 px-4 py-3 text-green-200 hover:text-green-100 hover:bg-green-500/20 rounded-xl transition-all duration-200 group"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
									</svg>
									<div class="flex-1 text-left">
										<span class="font-medium block">Transfer Between Wallets</span>
										<span class="text-xs text-green-300/70">Multi-wallet demo</span>
									</div>
									<svg class="w-4 h-4 transition-transform {showMultiWalletDemo ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
									</svg>
								</button>

								{#if showMultiWalletDemo}
									<div class="p-4 bg-white/5 rounded-xl space-y-3">
										<div>
											<label class="text-xs text-white/60 block mb-1">From (Active Wallet)</label>
											<div class="text-sm text-white font-medium">{activeWallet.info.name}</div>
										</div>

										<div>
											<label class="text-xs text-white/60 block mb-1">To</label>
											<select
												bind:value={selectedRecipient}
												class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
											>
												<option value="">Select recipient wallet</option>
												{#each connectedWallets as w}
													{#if w.info.rdns !== activeWallet.info.rdns}
														<option value={w.info.rdns}>{w.info.name} ({shorten(w.addresses[0])})</option>
													{/if}
												{/each}
											</select>
										</div>

										<div>
											<label class="text-xs text-white/60 block mb-1">Amount (ETH)</label>
											<input
												type="number"
												bind:value={transferAmount}
												step="0.001"
												min="0"
												class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
											/>
										</div>

										<button
											onclick={transferBetweenWallets}
											disabled={isTransferring || !selectedRecipient}
											class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
										>
											{#if isTransferring}
												<span class="flex items-center justify-center gap-2">
													<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
													Sending...
												</span>
											{:else}
												Send Transfer
											{/if}
										</button>
									</div>
								{/if}
							{/if}
						</div>

						<!-- Disconnect All Button -->
						<button
							onclick={() => disconnectWallet('all')}
							class="w-full flex items-center gap-3 px-4 py-3 text-red-200 hover:text-red-100 hover:bg-red-500/20 rounded-xl transition-all duration-200 group"
							aria-label="Disconnect All Wallets"
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
							<span class="font-medium">Disconnect All</span>
						</button>
					</aside>

					<!-- Main Content -->
					<main class="flex-1 p-6">
						<div class="space-y-6">
							<div class="flex items-center justify-between mb-6">
								<h1 class="text-2xl font-bold text-white">Active Wallet</h1>
								{#if activeWallet.isConnected}
									<div class="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm">
										<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
										Connected
									</div>
								{/if}
							</div>

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
										<span class="text-white font-mono text-lg">{shorten(activeWallet.addresses[0])}</span>
									</div>
									<button
										onclick={() => navigator.clipboard.writeText(activeWallet.addresses[0])}
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
										<span class="text-white font-bold text-2xl">{formatEth(activeWallet.balance)} ETH</span>
									</div>
									<div class="text-4xl">💎</div>
								</div>
							</div>

							<!-- Multi-Wallet Comparison -->
							{#if connectedWallets.length > 1}
								<div class="bg-white/5 rounded-xl p-6 border border-white/10">
									<h3 class="text-white font-semibold mb-4 flex items-center gap-2">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
										</svg>
										All Wallets Comparison
									</h3>
									<div class="space-y-3">
										{#each connectedWallets as w}
											{@const isActive = w.info.rdns === activeWallet.info.rdns}
											<div class="flex items-center justify-between p-3 rounded-lg {isActive ? 'bg-blue-500/20' : 'bg-white/5'}">
												<div class="flex items-center gap-3">
													<img src={w.info.icon} alt={w.info.name} class="w-8 h-8 rounded-full" />
													<div>
														<div class="text-white text-sm font-medium">{w.info.name}</div>
														<div class="text-white/60 text-xs font-mono">{shorten(w.addresses[0])}</div>
													</div>
												</div>
												<div class="text-right">
													<div class="text-white font-semibold">{formatEth(w.balance)} ETH</div>
													<div class="text-white/60 text-xs">{getChainInfo(w.chainId).name}</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</main>
				</div>
			</div>
		{/if}

		<!-- Available Wallets Section (always show) -->
		<div class="mt-8">
			<div class="text-center mb-6">
				<h2 class="text-2xl font-bold text-white mb-2">
					{#if connectedWallets.length > 0}
						Add Another Wallet
					{:else}
						Connect Your Wallets
					{/if}
				</h2>
				<p class="text-white/60">
					{#if connectedWallets.length > 0}
						Connect additional wallets to manage multiple accounts
					{:else}
						You can connect multiple wallets at once
					{/if}
				</p>
			</div>

			<div class="max-w-md mx-auto">

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
						{@const isConnected = wallets[aWallet.info.rdns]}
						<div class="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-200">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<img src={aWallet.info.icon} alt={aWallet.info.name} class="w-10 h-10 rounded-full" />
									<div>
										<span class="text-white font-semibold text-lg block">{aWallet.info.name}</span>
										{#if isConnected}
											<span class="text-green-400 text-xs">✓ Already connected</span>
										{/if}
									</div>
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
										<span>{isConnected ? 'Switch' : 'Connect'}</span>
									{/if}
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			</div>
		</div>
	</div>
</div>