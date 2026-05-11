import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { fetchTokenAccounts } from "@/lib/solana/tokenAccounts";
import { buildConfidentialTransferTx } from "@/lib/solana/confidentialTransfer";
import { buildTransferFromDraft } from "@/lib/solana/transfers";
import { saveTransaction } from "@/lib/storage/activity";
import { getExplorerTxUrl } from "@/lib/solana/connection";
import type { ConfidentialReadiness } from "@/types/solana";

type Step = "idle" | "checking" | "building" | "signing" | "submitted" | "confirmed" | "failed";

export default function Review() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [, setLocation] = useLocation();
  const { network, pendingDraft } = useWalletStore();

  const [step, setStep] = useState<Step>("idle");
  const [readiness, setReadiness] = useState<ConfidentialReadiness | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [builtSteps, setBuiltSteps] = useState<string[] | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const draft = pendingDraft;

  useEffect(() => {
    if (!connected || !pendingDraft) return;
  }, [connected, pendingDraft]);

  if (!connected) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to review transfers.</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-sm text-muted-foreground">No transfer draft found.</p>
        <button
          onClick={() => setLocation("/transfer")}
          className="text-sm text-primary hover:underline"
        >
          Go to New Transfer
        </button>
      </div>
    );
  }

  const handleCheckReadiness = async () => {
    setStep("checking");
    setBuildError(null);

    const result: ConfidentialReadiness = {
      walletConnected: connected && !!publicKey,
      isToken2022Mint: false,
      confidentialTransferMintConfigured: false,
      userTokenAccountExists: false,
      userConfidentialTransferAccountConfigured: false,
      pendingBalanceAvailable: false,
      errors: [],
      warnings: [],
    };

    try {
      if (publicKey) {
        const accounts = await fetchTokenAccounts(publicKey.toBase58(), network);
        const mintAddress = draft.tokenMint;

        if (mintAddress) {
          const matchedAccount = accounts.find((a) => a.mint === mintAddress);
          if (matchedAccount) {
            result.userTokenAccountExists = true;
            result.isToken2022Mint = matchedAccount.isToken2022;
            if (!matchedAccount.isToken2022) {
              result.warnings.push("This token uses the standard SPL Token program, not Token-2022. Confidential transfers are not supported.");
            }
          } else {
            result.errors.push("No token account found for the specified mint.");
          }
        } else {
          result.warnings.push("No token mint specified. Readiness check is incomplete.");
        }
      }

      if (draft.privacyMode === "confidential") {
        if (!result.isToken2022Mint) {
          result.errors.push("Confidential transfers require a Token-2022 mint.");
        }
        result.warnings.push(
          "Browser-side ZK proof generation is not yet available in this environment. Building a confidential transaction will return an UnsupportedFeature error."
        );
      }
    } catch (e) {
      result.errors.push(`RPC error: ${String(e)}`);
    }

    setReadiness(result);
    setStep("idle");
  };

  const handleBuildTransaction = async () => {
    setStep("building");
    setBuildError(null);
    setBuiltSteps(null);

    if (draft.privacyMode === "confidential") {
      const result = buildConfidentialTransferTx();
      if (!result.success && result.unsupportedFeature) {
        setBuildError(
          `Unsupported: ${result.unsupportedFeature.feature}\n\n${result.unsupportedFeature.reason}\n\nSuggestion: ${result.unsupportedFeature.suggestion}`
        );
        setStep("idle");
        return;
      }
    }

    if (!publicKey) {
      setBuildError("Wallet not connected.");
      setStep("idle");
      return;
    }
    if (!draft.recipientWallet) {
      setBuildError("Recipient wallet address is required.");
      setStep("idle");
      return;
    }
    if (!draft.amount || draft.amount <= 0) {
      setBuildError("A positive amount is required.");
      setStep("idle");
      return;
    }

    try {
      const { PublicKey } = await import("@solana/web3.js");
      const built = await buildTransferFromDraft({
        connection,
        sender: publicKey,
        recipient: new PublicKey(draft.recipientWallet),
        tokenMint: draft.tokenMint,
        amountUi: draft.amount,
      });
      setBuiltSteps(built.steps);
      setStep("idle");
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : String(e));
      setStep("idle");
    }
  };

  const handleSign = async () => {
    if (!publicKey || !sendTransaction) return;
    if (draft.privacyMode === "confidential") {
      setBuildError(
        "Confidential mode cannot be signed in-browser. Switch privacy mode to standard or use a backend service."
      );
      return;
    }
    if (!draft.recipientWallet) {
      setTxError("Recipient wallet address is required.");
      setStep("failed");
      return;
    }
    if (!draft.amount || draft.amount <= 0) {
      setTxError("A positive amount is required.");
      setStep("failed");
      return;
    }

    setStep("signing");
    setTxError(null);
    setBuildError(null);

    try {
      const { PublicKey } = await import("@solana/web3.js");
      const built = await buildTransferFromDraft({
        connection,
        sender: publicKey,
        recipient: new PublicKey(draft.recipientWallet),
        tokenMint: draft.tokenMint,
        amountUi: draft.amount,
      });
      setBuiltSteps(built.steps);

      const sig = await sendTransaction(built.transaction, connection);
      setTxSignature(sig);

      saveTransaction({
        signature: sig,
        status: "Submitted",
        network,
        description: built.description,
      });

      setStep("submitted");

      const result = await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: built.blockhash,
          lastValidBlockHeight: built.lastValidBlockHeight,
        },
        "confirmed"
      );
      if (result.value.err) {
        setTxError(JSON.stringify(result.value.err));
        setStep("failed");
        return;
      }
      setStep("confirmed");
    } catch (e) {
      setTxError(e instanceof Error ? e.message : String(e));
      setStep("failed");
    }
  };

  const ReadinessRow = ({
    label,
    pass,
    warning,
  }: {
    label: string;
    pass: boolean;
    warning?: boolean;
  }) => (
    <div className="flex items-center gap-3 py-2">
      {warning ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : pass ? (
        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
      )}
      <span className="text-xs font-mono text-foreground">{label}</span>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Transfer Review</h1>
        <p className="text-xs text-muted-foreground font-mono">VERIFY BEFORE SIGNING</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg"
      >
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Draft Details
          </span>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Sender", value: draft.senderWallet ? (draft.senderWallet.slice(0, 8) + "..." + draft.senderWallet.slice(-6)) : "—" },
            { label: "Recipient", value: draft.recipientWallet ? (draft.recipientWallet.slice(0, 8) + "..." + draft.recipientWallet.slice(-6)) : "—" },
            { label: "Token Mint", value: draft.tokenMint ?? "Not specified" },
            { label: "Amount", value: draft.amount?.toString() ?? "—" },
            { label: "Network", value: "MAINNET" },
            { label: "Privacy", value: draft.privacyMode },
            { label: "Schedule", value: draft.schedule ?? "One-time" },
            { label: "Memo", value: draft.memo ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground font-mono">{label}</span>
              <span className="text-xs font-mono text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {draft.estimatedSteps.length > 0 && (
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
            Estimated Steps
          </p>
          <div className="space-y-1">
            {draft.estimatedSteps.map((s, i) => (
              <p key={i} className="text-xs font-mono text-foreground">
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {(draft.warnings.length > 0 || draft.errors.length > 0) && (
        <div className="space-y-1.5">
          {draft.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs font-mono text-amber-400">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
          {draft.errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-xs font-mono text-destructive">
              <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      {readiness && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg px-4 py-3"
        >
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
            Readiness Checklist
          </p>
          <ReadinessRow label="Wallet connected" pass={readiness.walletConnected} />
          <ReadinessRow label="Token-2022 mint" pass={readiness.isToken2022Mint} />
          <ReadinessRow
            label="Confidential transfer mint configured"
            pass={readiness.confidentialTransferMintConfigured}
          />
          <ReadinessRow
            label="User token account exists"
            pass={readiness.userTokenAccountExists}
          />
          <ReadinessRow
            label="User confidential transfer account configured"
            pass={readiness.userConfidentialTransferAccountConfigured}
          />
          {readiness.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {readiness.errors.map((e, i) => (
                <p key={i} className="text-xs font-mono text-destructive">
                  {e}
                </p>
              ))}
            </div>
          )}
          {readiness.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {readiness.warnings.map((w, i) => (
                <p key={i} className="text-xs font-mono text-amber-400">
                  {w}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {builtSteps && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <p className="text-xs font-mono text-primary uppercase tracking-wider mb-2">
            Built Transaction
          </p>
          <div className="space-y-1">
            {builtSteps.map((s, i) => (
              <p key={i} className="text-xs font-mono text-foreground">
                • {s}
              </p>
            ))}
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-2">
            Click "Sign with Wallet" to submit to mainnet.
          </p>
        </motion.div>
      )}

      {buildError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-card border border-border rounded-lg"
        >
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
              Unsupported Feature
            </span>
          </div>
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{buildError}</pre>
        </motion.div>
      )}

      {txSignature && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <p className="text-xs font-mono text-primary mb-2">
            {step === "confirmed" ? "TRANSACTION CONFIRMED" : "TRANSACTION SUBMITTED"}
          </p>
          <p className="text-xs font-mono text-foreground break-all mb-2">{txSignature}</p>
          <a
            href={getExplorerTxUrl(txSignature, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View on Solana Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      )}

      {txError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs font-mono text-destructive">{txError}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCheckReadiness}
          disabled={step === "checking"}
          data-testid="check-readiness-button"
          className="flex items-center gap-1.5 px-4 py-2 bg-muted border border-border rounded text-sm text-foreground hover:border-primary/50 disabled:opacity-50 transition-colors"
        >
          {step === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Check Readiness
        </button>

        <button
          onClick={handleBuildTransaction}
          disabled={step === "building" || !readiness}
          data-testid="build-tx-button"
          className="flex items-center gap-1.5 px-4 py-2 bg-muted border border-border rounded text-sm text-foreground hover:border-primary/50 disabled:opacity-50 transition-colors"
        >
          {step === "building" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Build Transaction
        </button>

        <button
          onClick={handleSign}
          disabled={step === "signing" || step === "submitted" || step === "confirmed" || !!buildError}
          data-testid="sign-tx-button"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {step === "signing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Sign with Wallet
        </button>
      </div>

      <div className="p-3 bg-card/50 border border-border/50 rounded text-xs text-muted-foreground font-mono space-y-1">
        <div className="flex items-center gap-1.5 text-primary">
          <Shield className="w-3 h-3" />
          <span>Security</span>
        </div>
        <p>Novault Agent prepares transactions but cannot move funds without your wallet signature.</p>
        <p>Never enter a seed phrase.</p>
        <p>Confidential Transfers hide amounts, not necessarily sender/receiver addresses.</p>
        <p>Final settlement requires wallet approval.</p>
      </div>
    </div>
  );
}
