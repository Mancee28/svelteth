<script lang="ts">
    import { availableWallets, connectWallet, disconnectWallet, handleAnnounceProvider, isConnecting, wallet } from "$states/wallet.svelte.js";
    import { onMount } from "svelte";
    import "$styles/svelteth-theme.css";
    
    /** Internal helper: shorten an ETH address */
    const shorten = (addr: string) => addr.slice(0, 6) + "…" + addr.slice(-4);

    let loading = $state(true);

    onMount(() => {
        window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);

        window.dispatchEvent(new Event('eip6963:requestProvider'));

        const timeout = setTimeout(() => {
            loading = false;
        }, 2000);

        return () => {
            window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
            clearTimeout(timeout);
        };
    });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="svelteth-wallet">
    {#if wallet.provider && wallet.accounts.length > 0}
        <div class="wallet-connected">
            <div class="wallet-header">
                <h2>Connected Wallet</h2>
                <img src={wallet.info.icon} alt={wallet.info.name} class="wallet-icon" />
            </div>
            <div class="wallet-info">
                <div class="wallet-name">{wallet.info.name}</div>
                {#each wallet.accounts as account}
                    <div class="wallet-address">
                        <span class="address-label">Address:</span>
                        <span class="address-value">{shorten(account)}</span>
                    </div>
                {/each}
            </div>
            <div class="wallet-footer">
                <button class="disconnect-btn" onclick={disconnectWallet}>
                    Disconnect
                </button>
            </div>
        </div>
    {:else}
        <div class="wallet-selector">
            <h2>Connect Wallet</h2>
            {#if availableWallets.list.length === 0}
                <div class="wallet-status">
                    {#if loading}
                        <div class="loading-spinner"></div>
                        <p>Detecting wallets...</p>
                    {:else}
                        <p class="no-wallet-msg">No wallets found. Please install a wallet extension.</p>
                    {/if}
                </div>
            {:else}
                <div class="wallet-list">
                    {#each availableWallets.list as aWallet}
                        <div class="wallet-option">
                            <img src={aWallet.info.icon} alt={aWallet.info.name} class="wallet-icon" />
                            <span class="wallet-name">{aWallet.info.name}</span>
                            <button class="connect-btn" onclick={() => connectWallet(aWallet)} disabled={isConnecting()}>
                                Connect
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .svelteth-wallet {
        font-family: var(--svelteth-font, 'Inter', sans-serif);
        background-color: var(--svelteth-card-bg, #1e1f22);
        color: var(--svelteth-text, #ffffff);
        border-radius: var(--svelteth-radius, 12px);
        box-shadow: var(--svelteth-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
        width: var(--svelteth-width, 380px);
        max-width: 100%;
        margin: var(--svelteth-margin, auto);
        overflow: hidden;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--svelteth-heading, #ffffff);
    }

    /* Connected wallet styling */
    .wallet-connected {
        padding: 1.5rem;
    }

    .wallet-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
    }

    .wallet-info {
        background-color: var(--svelteth-info-bg, rgba(0, 0, 0, 0.2));
        border-radius: var(--svelteth-radius, 12px);
        padding: 1rem;
        margin-bottom: 1.25rem;
    }

    .wallet-name {
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }

    .wallet-address {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .address-label {
        color: var(--svelteth-muted, #9ca3af);
        font-size: 0.9rem;
    }

    .address-value {
        font-family: monospace;
        background-color: var(--svelteth-address-bg, rgba(139, 153, 255, 0.1));
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    /* Wallet selection styling */
    .wallet-selector {
        padding: 1.5rem;
    }

    .wallet-selector h2 {
        margin-bottom: 1.25rem;
        text-align: center;
    }

    .wallet-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        text-align: center;
    }

    .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        border-top-color: var(--svelteth-primary, #8b99ff);
        animation: spinner 1s ease-in-out infinite;
        margin-bottom: 1rem;
    }

    @keyframes spinner {
        to { transform: rotate(360deg); }
    }

    .no-wallet-msg {
        color: var(--svelteth-muted, #9ca3af);
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .wallet-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .wallet-option {
        background-color: var(--svelteth-option-bg, rgba(0, 0, 0, 0.2));
        border-radius: var(--svelteth-radius, 12px);
        padding: 1rem;
        display: flex;
        align-items: center;
        transition: transform 0.15s ease, background-color 0.15s ease;
    }

    .wallet-option:hover {
        background-color: var(--svelteth-option-hover, rgba(0, 0, 0, 0.3));
        transform: translateY(-2px);
    }

    .wallet-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        margin-right: 0.75rem;
    }

    .wallet-option .wallet-name {
        flex: 1;
        margin: 0;
        font-weight: 500;
    }

    .connect-btn, .disconnect-btn {
        font-family: inherit;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .connect-btn {
        background-color: var(--svelteth-primary, #8b99ff);
        color: var(--svelteth-btn-text, white);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: var(--svelteth-radius, 12px);
    }

    .connect-btn:hover {
        background-color: var(--svelteth-primary-hover, #7a89ff);
        transform: scale(1.05);
    }

    .disconnect-btn {
        width: 100%;
        background-color: transparent;
        color: var(--svelteth-muted, #9ca3af);
        border: 1px solid var(--svelteth-border, rgba(156, 163, 175, 0.2));
        padding: 0.5rem 1rem;
        border-radius: var(--svelteth-radius, 12px);
    }

    .disconnect-btn:hover {
        background-color: var(--svelteth-disconnect-hover, rgba(255, 100, 100, 0.1));
        color: var(--svelteth-disconnect-text, #ff6464);
        border-color: var(--svelteth-disconnect-border, rgba(255, 100, 100, 0.3));
    }
</style>
