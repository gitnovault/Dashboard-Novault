export type Network = "mainnet-beta";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  solBalance: number | null;
  loading: boolean;
  error: string | null;
}

export interface TokenAccountInfo {
  pubkey: string;
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
  programId: string;
  isToken2022: boolean;
  symbol?: string;
  name?: string;
}

export interface Token2022Extension {
  type: string;
  data?: Record<string, unknown>;
}

export interface Token2022MintInfo {
  mint: string;
  decimals: number;
  extensions: Token2022Extension[];
  hasConfidentialTransfer: boolean;
  confidentialTransferMintConfig?: {
    authority: string | null;
    autoApproveNewAccounts: boolean;
    auditorElgamalPubkey: string | null;
  };
}

export interface ConfidentialReadiness {
  walletConnected: boolean;
  isToken2022Mint: boolean;
  confidentialTransferMintConfigured: boolean;
  userTokenAccountExists: boolean;
  userConfidentialTransferAccountConfigured: boolean;
  pendingBalanceAvailable: boolean;
  errors: string[];
  warnings: string[];
}
