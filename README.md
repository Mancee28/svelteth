# Svelteth

**Try Svelteth live demo at: [https://svelteth-demo.vercel.app/](https://svelteth-demo.vercel.app/)**

**Svelteth** is an open-source library designed to simplify and amplify Web3 adoption in Svelte 5 projects. By leveraging Svelte's reactivity, Svelteth makes it easy to connect, manage, and interact with Ethereum wallets and providers in your Svelte applications.

## Features

- 🔗 **Easy Wallet Connection**: Seamlessly connect to Ethereum wallets using EIP-6963.
- ⚡ **Reactive State**: All wallet and provider states are fully reactive, thanks to Svelte 5.
- 🦊 **Multi-Wallet Support**: Detect and connect to multiple wallet extensions.
- 🛡️ **TypeScript Support**: Fully typed for safety and autocompletion.

## Installation

```bash
npm install svelteth
```

## Usage

Use the reactive wallet state and actions directly:

```typescript
import {
	availableWallets,
	wallet,
	connectWallet,
	disconnectWallet,
	listenToProviderEvents,
	isConnecting,
	isSearching,
	signMessage,
	sendTransaction,
	// Multi-wallet support
	wallets,
	activeWalletId,
	getConnectedWalletIds,
	getWallet,
	switchWallet,
	getAllWallets
} from 'svelteth';
```

## Lifecycle Setup

To make sure **Svelteth** can detect available wallets via **EIP-6963**,  
you need to call `listenToProviderEvents()` inside the Svelte `onMount` lifecycle:

```typescript
<script lang="ts">
	import { onMount } from 'svelte';
	import { listenToProviderEvents } from 'svelteth';

	onMount(() => {
		listenToProviderEvents();
	});
</script>
```

## Multi-Wallet Support

Svelteth supports connecting and managing multiple wallets simultaneously. This is useful for:
- Testing transactions between different accounts
- Managing multiple identities
- Switching between wallets without disconnecting

### Working with Multiple Wallets

```typescript
import { 
	wallets,           // Record of all connected wallets
	activeWalletId,    // Currently active wallet ID
	wallet,            // Get the active wallet
	getWallet,         // Get a specific wallet by ID
	switchWallet,      // Switch to a different wallet
	getAllWallets,     // Get array of all connected wallets
	getConnectedWalletIds  // Get list of wallet IDs
} from 'svelteth';

// Connect multiple wallets
availableWallets.list.forEach(w => connectWallet(w));

// Get all connected wallets
const allWallets = getAllWallets();

// Switch active wallet
switchWallet('com.metamask'); // Use wallet's RDNS as ID

// Get specific wallet
const specificWallet = getWallet('com.coinbase.wallet');

// Access active wallet (reactive)
const activeWallet = wallet();

// Disconnect specific wallet or all
disconnectWallet('com.metamask'); // Disconnect one
disconnectWallet('all');          // Disconnect all
```

### Wallet State

Each wallet in the `wallets` object contains:
- `info`: Wallet metadata (name, icon, rdns, uuid)
- `provider`: EIP-1193 provider instance
- `addresses`: Array of wallet addresses
- `chainId`: Current chain ID
- `balance`: Current balance in wei
- `gas`: EIP-1559 gas estimates (baseFee and priority fees)
- `isConnected`: Connection status
- `error`: Error details, if any

## Add Your Own Chain

Want to see your chain supported in Svelteth? You can easily add it by editing the chain file:

- Open `src/lib/chain/index.ts`
- Add a new entry to the `CHAIN` constant with your chain's ID, name, and logo.

```typescript
 12345 :{
	name: 'Your Chain Name',
	logo: 'URL to your chain logo'
 },
```

Feel free to contribute with a pull request on GitHub to make it available for everyone!

## License

MIT

---

Made with ❤️ for the Svelte and Web3 communities.
