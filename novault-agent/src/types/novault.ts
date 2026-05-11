export interface TransferIntent {
  rawInput: string;
}

export interface ParsedTransferIntent {
  action: "send" | "withdraw" | "deposit" | "unknown";
  tokenSymbol?: string;
  mintAddress?: string;
  resolvedMint?: string | null;
  isNativeSol?: boolean;
  recipientAddress?: string;
  amount?: number;
  schedule?: string;
  privacyMode: "confidential" | "standard";
  memo?: string;
  parseErrors: string[];
}

export interface TransferDraft {
  id: string;
  senderWallet?: string;
  recipientWallet?: string;
  tokenMint?: string;
  sourceTokenAccount?: string;
  destinationTokenAccount?: string;
  amount?: number;
  decimals?: number;
  network: string;
  privacyMode: "confidential" | "standard";
  memo?: string;
  schedule?: string;
  estimatedSteps: string[];
  warnings: string[];
  errors: string[];
  createdAt: string;
}

export interface UnsupportedFeature {
  feature: string;
  reason: string;
  suggestion?: string;
}

export interface BuildTransactionResult {
  success: boolean;
  transaction?: unknown;
  unsupportedFeature?: UnsupportedFeature;
  error?: string;
}

export type TxStatus = "Draft" | "Building" | "AwaitingApproval" | "Submitted" | "Confirmed" | "Failed";

export interface SubmittedTransaction {
  id: string;
  signature: string;
  status: TxStatus;
  network: string;
  createdAt: string;
  confirmedAt?: string;
  slot?: number;
  description?: string;
  error?: string;
}

export interface Recipient {
  id: string;
  label: string;
  address: string;
  createdAt: string;
}
