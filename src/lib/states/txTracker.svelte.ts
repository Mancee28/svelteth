// WIP

import type { EthereumTransaction } from "$types/eip2718.js";

export let txTracker = {
    transactions: [] as EthereumTransaction[]
};