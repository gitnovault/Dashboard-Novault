import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "./connection";
import type { Network, Token2022MintInfo, Token2022Extension } from "@/types/solana";

export async function fetchMintInfo(
  mintAddress: string,
  network: Network
): Promise<Token2022MintInfo> {
  const connection = getConnection(network);
  const mintPubkey = new PublicKey(mintAddress);

  const accountInfo = await connection.getParsedAccountInfo(mintPubkey);

  if (!accountInfo.value) {
    throw new Error(`Mint account not found: ${mintAddress}`);
  }

  const isToken2022 =
    accountInfo.value.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58();

  const parsed = (accountInfo.value.data as { parsed?: { info?: Record<string, unknown>; type?: string } }).parsed;

  if (!parsed || parsed.type !== "mint") {
    throw new Error(`Account is not a mint: ${mintAddress}`);
  }

  const info = parsed.info as Record<string, unknown>;
  const decimals = (info.decimals as number) ?? 0;

  const extensions: Token2022Extension[] = [];
  let hasConfidentialTransfer = false;
  let confidentialTransferMintConfig:
    | Token2022MintInfo["confidentialTransferMintConfig"]
    | undefined = undefined;

  if (isToken2022 && Array.isArray(info.extensions)) {
    for (const ext of info.extensions as Array<{ extension: string; state?: Record<string, unknown> }>) {
      extensions.push({ type: ext.extension, data: ext.state });
      if (ext.extension === "confidentialTransferMint") {
        hasConfidentialTransfer = true;
        const state = ext.state ?? {};
        confidentialTransferMintConfig = {
          authority: (state.authority as string | null) ?? null,
          autoApproveNewAccounts: Boolean(state.autoApproveNewAccounts),
          auditorElgamalPubkey: (state.auditorElgamalPubkey as string | null) ?? null,
        };
      }
    }
  }

  return {
    mint: mintAddress,
    decimals,
    extensions,
    hasConfidentialTransfer,
    confidentialTransferMintConfig,
  };
}

export async function isToken2022Account(address: string, network: Network): Promise<boolean> {
  try {
    const connection = getConnection(network);
    const info = await connection.getAccountInfo(new PublicKey(address));
    return info?.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58();
  } catch {
    return false;
  }
}
