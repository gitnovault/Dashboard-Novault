import type { UnsupportedFeature, BuildTransactionResult } from "@/types/novault";

const BROWSER_PROOF_UNSUPPORTED: UnsupportedFeature = {
  feature: "Browser-side ZK proof generation",
  reason:
    "Generating zero-knowledge proofs for Confidential Transfers requires native cryptographic libraries (e.g. zk-token-proof program on-chain or WASM-compiled ElGamal circuits) that are not yet available for browser-based applications via @solana/spl-token.",
  suggestion:
    "To complete a real confidential transfer, use a Solana CLI tool or backend service that can generate the required ElGamal encryption proofs and submit the transaction.",
};

export function buildConfigureConfidentialTransferAccountTx(): BuildTransactionResult {
  return {
    success: false,
    unsupportedFeature: {
      ...BROWSER_PROOF_UNSUPPORTED,
      feature: "Configure Confidential Transfer Account",
    },
  };
}

export function buildDepositConfidentialTransferTx(): BuildTransactionResult {
  return {
    success: false,
    unsupportedFeature: {
      ...BROWSER_PROOF_UNSUPPORTED,
      feature: "Deposit to Confidential Balance",
    },
  };
}

export function buildApplyPendingBalanceTx(): BuildTransactionResult {
  return {
    success: false,
    unsupportedFeature: {
      ...BROWSER_PROOF_UNSUPPORTED,
      feature: "Apply Pending Balance",
    },
  };
}

export function buildWithdrawConfidentialTransferTx(): BuildTransactionResult {
  return {
    success: false,
    unsupportedFeature: {
      ...BROWSER_PROOF_UNSUPPORTED,
      feature: "Withdraw from Confidential Balance",
    },
  };
}

export function buildConfidentialTransferTx(): BuildTransactionResult {
  return {
    success: false,
    unsupportedFeature: {
      ...BROWSER_PROOF_UNSUPPORTED,
      feature: "Confidential Transfer",
    },
  };
}
