# Svelteth

**Svelteth** is an open-source library designed to simplify and amplify Web3 adoption in Svelte 5 projects. By leveraging Svelte's reactivity, Svelteth makes it easy to connect, manage, and interact with Ethereum wallets and providers in your Svelte applications.

## Features

- 🔗 **Easy Wallet Connection**: Seamlessly connect to Ethereum wallets using EIP-6963.
- ⚡ **Reactive State**: All wallet and provider states are fully reactive, thanks to Svelte 5.
- 🦊 **Multi-Wallet Support**: Detect and connect to multiple wallet extensions.
- 🛡️ **TypeScript Support**: Fully typed for safety and autocompletion.
- 🧩 **Composable**: Use as Svelte components or state modules.

## Installation

```bash
npm install svelteth
```

## Usage

Import the `Wallet` component and add it to your Svelte page:

```svelte
<script lang="ts">
	import { Wallet } from 'svelteth';
</script>

<Wallet theme={'dark'} />
```

Or use the reactive wallet state and actions directly:

```typescript
import { wallet, connectWallet, disconnectWallet } from 'svelteth';
```

## Why Svelteth?

- **Simplifies Web3 integration** in Svelte apps.
- **Reactive by design**: All wallet and provider changes update your UI instantly.
- **Extensible**: Use your own UI or the provided components.

## License

MIT

---

Made with ❤️ for the Svelte and Web3 communities.
