<script lang="ts">
    import { availableWallets, connectWallet, disconnectWallet, handleAnnounceProvider, isConnecting, wallet, walletError } 
    from "$states/wallet.svelte.js";
    import blockies from 'ethereum-blockies';
    import { onMount } from "svelte";
    
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

<div>
    {#if wallet.address && wallet.chainId}
        <div>
            <div>
                <h2>Connected Wallet</h2>
                <img src={wallet.info.icon} alt={wallet.info.name} />
            </div>
            <div>
                <div>
                    <img src={blockies.create({ seed: wallet.address, size: 8, scale: 4 }).toDataURL()} alt="Blockie Icon" />
                </div>
                <div>{wallet.info.name}</div>
                <div>
                    <div>
                        <span>Chain ID:</span>
                        <span>{wallet.chainId}</span>
                        <span>Address:</span>
                        <span>{shorten(wallet.address)}</span>
                        <div>
                            <div>
                                <span>WEI:</span>
                                <span>{wallet.balance}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <button onclick={disconnectWallet}>
                    Disconnect
                </button>
            </div>
        </div>
    {:else}
        <div>
            <h2>Connect Wallet</h2>
            {#if walletError.message}
                <div>
                    <p>Error: {walletError.message}</p>
                    {#if walletError.code}
                        <p>Code: {walletError.code}</p>
                    {/if}
                </div>
            {/if}
            {#if availableWallets.list.length === 0}
                <div>
                    {#if loading}
                        <div></div>
                        <p>Detecting wallets...</p>
                    {:else}
                        <p>No wallets found. Please install a wallet extension.</p>
                    {/if}
                </div>
            {:else}
                <div>
                    {#each availableWallets.list as aWallet}
                        <div>
                            <img src={aWallet.info.icon} alt={aWallet.info.name} />
                            <span>{aWallet.info.name}</span>
                            <button onclick={() => connectWallet(aWallet)} disabled={isConnecting()}>
                                {#if isConnecting()}
                                    <span>Loading...</span>
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
