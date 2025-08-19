# Svelteth

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
	sendTransaction
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

## Why Svelteth?

- **Simplifies Web3 integration** in Svelte apps.
- **Reactive by design**: All wallet and provider changes update your UI instantly thanks to Svelte5.

## Add Your Own Chain

Want to see your chain supported in Svelteth? You can easily add it by editing the chain file:

- Open `src/lib/chain/index.ts`
- Add a new entry to the `CHAIN` constant with your chain's ID, name, and logo.

Example:

```typescript
CHAIN[12345] = {
	name: 'Your Chain Name',
	logo: 'URL to your chain logo'
};
```

Feel free to contribute with a pull request on GitHub to make it available for everyone!

## License

MIT

---

Made with ❤️ for the Svelte and Web3 communities.
