/** Single field in `types` */
export interface EIP712TypeField {
    name: string;           // e.g. "owner"
    type: string;           // e.g. "address"
}

/** Map of sub‑types (EIP‑712 §3) */
export interface EIP712Types {
    /** Each key is a type‑name, each with an array of fields */
    [typeName: string]: EIP712TypeField[];
}

/** `domain` section (all fields optional for compatibility) */
export interface EIP712Domain {
    name?: string;
    version?: string;
    chainId?: number | bigint;
    verifyingContract?: string;
    salt?: string;
}

/** The complete payload to pass to `signTypedData` */
export interface EIP712TypedData {
    types: EIP712Types;
    primaryType: string;    // e.g. "Permit"
    domain: EIP712Domain;
    message: Record<string, any>;
}