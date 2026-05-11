import { Connection } from "@solana/web3.js";
import type { Network } from "@/types/solana";

export const NETWORK_ENDPOINTS: Record<Network, string> = {
  "mainnet-beta":
    import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
};

export const EXPLORER_BASE = "https://explorer.solana.com";

export function getExplorerTxUrl(signature: string, _network?: Network): string {
  return `${EXPLORER_BASE}/tx/${signature}`;
}

export function getExplorerAddressUrl(address: string, _network?: Network): string {
  return `${EXPLORER_BASE}/address/${address}`;
}

let connectionCache: Partial<Record<Network, Connection>> = {};

export function getConnection(network: Network): Connection {
  if (!connectionCache[network]) {
    connectionCache[network] = new Connection(NETWORK_ENDPOINTS[network], "confirmed");
  }
  return connectionCache[network]!;
}

export function clearConnectionCache(): void {
  connectionCache = {};
}
