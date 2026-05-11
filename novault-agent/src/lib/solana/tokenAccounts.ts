import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "./connection";
import type { Network, TokenAccountInfo } from "@/types/solana";

export async function fetchTokenAccounts(
  walletAddress: string,
  network: Network
): Promise<TokenAccountInfo[]> {
  const connection = getConnection(network);
  const publicKey = new PublicKey(walletAddress);
  const results: TokenAccountInfo[] = [];

  const [splAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    }),
    connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ]);

  for (const item of splAccounts.value) {
    const parsed = item.account.data.parsed?.info;
    if (!parsed) continue;
    results.push({
      pubkey: item.pubkey.toBase58(),
      mint: parsed.mint,
      owner: parsed.owner,
      amount: parsed.tokenAmount?.amount ?? "0",
      decimals: parsed.tokenAmount?.decimals ?? 0,
      uiAmount: parsed.tokenAmount?.uiAmount ?? null,
      programId: TOKEN_PROGRAM_ID.toBase58(),
      isToken2022: false,
    });
  }

  for (const item of token2022Accounts.value) {
    const parsed = item.account.data.parsed?.info;
    if (!parsed) continue;
    results.push({
      pubkey: item.pubkey.toBase58(),
      mint: parsed.mint,
      owner: parsed.owner,
      amount: parsed.tokenAmount?.amount ?? "0",
      decimals: parsed.tokenAmount?.decimals ?? 0,
      uiAmount: parsed.tokenAmount?.uiAmount ?? null,
      programId: TOKEN_2022_PROGRAM_ID.toBase58(),
      isToken2022: true,
    });
  }

  return results;
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
