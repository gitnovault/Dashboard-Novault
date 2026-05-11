import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Zap, Edit2, ChevronRight, AlertCircle, Lock, Globe } from "lucide-react";
import { parseTransferIntent } from "@/lib/agent/intentParser";
import { useWalletStore } from "@/store/walletStore";
import { isValidSolanaAddress } from "@/lib/solana/tokenAccounts";
import type { ParsedTransferIntent, TransferDraft } from "@/types/novault";

export default function Transfer() {
  const { connected, publicKey } = useWallet();
  const [, setLocation] = useLocation();
  const { network, defaultPrivacyMode, setPendingDraft } = useWalletStore();

  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedTransferIntent | null>(null);
  const [editing, setEditing] = useState<Partial<ParsedTransferIntent>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleParse = () => {
    const result = parseTransferIntent({ rawInput: input });
    setParsed(result);
    setEditing({
      action: result.action,
      tokenSymbol: result.tokenSymbol,
      recipientAddress: result.recipientAddress,
      amount: result.amount,
      schedule: result.schedule,
      privacyMode: result.privacyMode,
      memo: result.memo,
    });
    setIsEditing(false);
  };

  const effective = parsed ? { ...parsed, ...editing } : null;

  const handleContinue = () => {
    if (!effective || !publicKey) return;
    const draft: TransferDraft = {
      id: crypto.randomUUID(),
      senderWallet: publicKey.toBase58(),
      recipientWallet: effective.recipientAddress,
      tokenMint: effective.isNativeSol
        ? undefined
        : effective.resolvedMint ?? undefined,
      amount: effective.amount,
      network,
      privacyMode: effective.privacyMode ?? defaultPrivacyMode,
      memo: effective.memo,
      schedule: effective.schedule,
      estimatedSteps: effective.privacyMode === "confidential"
        ? [
            "1. Verify Token-2022 confidential transfer capability",
            "2. Check confidential transfer account configuration",
            "3. Build encrypted transaction (browser proof generation may be unavailable)",
            "4. Sign with wallet",
            "5. Submit to network",
          ]
        : [
            "1. Build SPL transfer transaction",
            "2. Sign with wallet",
            "3. Submit to network",
          ],
      warnings:
        effective.privacyMode === "confidential"
          ? ["Browser-side ZK proof generation may not be available. See Token Readiness page."]
          : [],
      errors: effective.parseErrors ?? [],
      createdAt: new Date().toISOString(),
    };
    setPendingDraft(draft);
    setLocation("/review");
  };

  const hasResolvedAsset =
    !!effective &&
    (effective.isNativeSol === true ||
      (typeof effective.resolvedMint === "string" && effective.resolvedMint.length > 0));

  const canContinue =
    !!effective &&
    effective.action !== "unknown" &&
    !!effective.amount &&
    effective.amount > 0 &&
    !!effective.recipientAddress &&
    isValidSolanaAddress(effective.recipientAddress) &&
    hasResolvedAsset &&
    effective.parseErrors.length === 0;

  if (!connected) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <p className="text-sm text-muted-foreground">Connect your wallet to compose a transfer.</p>
          <WalletMultiButton data-testid="wallet-connect-button" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">New Private Transfer</h1>
        <p className="text-xs text-muted-foreground font-mono">
          AGENT COMPOSER — describe your transfer in natural language
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 mb-4"
      >
        <label className="block text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">
          Transfer Intent
        </label>
        <textarea
          data-testid="transfer-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Send 500 USDC privately to 9xQeAB...xyz every Friday after approval`}
          rows={3}
          className="w-full bg-background border border-input rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground font-mono">
            Include: token, amount, recipient address, privacy, schedule
          </p>
          <button
            onClick={handleParse}
            disabled={!input.trim()}
            data-testid="parse-intent-button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Zap className="w-3 h-3" />
            Parse Intent
          </button>
        </div>
      </motion.div>

      {effective && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg mb-4"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Parsed Intent
            </span>
            <button
              onClick={() => setIsEditing((e) => !e)}
              data-testid="edit-intent-button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {isEditing ? "Done" : "Edit"}
            </button>
          </div>

          {effective.parseErrors.length > 0 && (
            <div className="px-4 py-3 border-b border-border">
              {effective.parseErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-destructive font-mono">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="divide-y divide-border">
            {(
              [
                { label: "Action", field: "action" as const, value: effective.action },
                { label: "Token", field: "tokenSymbol" as const, value: effective.tokenSymbol ?? "—" },
                { label: "Amount", field: "amount" as const, value: effective.amount?.toString() ?? "—" },
                { label: "Recipient", field: "recipientAddress" as const, value: effective.recipientAddress ?? "—" },
                { label: "Privacy", field: "privacyMode" as const, value: effective.privacyMode },
                { label: "Schedule", field: "schedule" as const, value: effective.schedule ?? "None" },
                { label: "Memo", field: "memo" as const, value: effective.memo ?? "—" },
              ] as Array<{ label: string; field: keyof ParsedTransferIntent; value: string }>
            ).map(({ label, field, value }) => (
              <div key={field} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-muted-foreground font-mono w-24">{label}</span>
                {isEditing ? (
                  <input
                    className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-right"
                    value={String(editing[field] ?? value)}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [field]: field === "amount" ? parseFloat(e.target.value) || 0 : e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {field === "privacyMode" &&
                      (value === "confidential" ? (
                        <Lock className="w-3 h-3 text-primary" />
                      ) : (
                        <Globe className="w-3 h-3 text-muted-foreground" />
                      ))}
                    <span className="text-xs font-mono text-foreground text-right">{value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              data-testid="continue-to-review-button"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Continue to Review
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="p-3 bg-card/50 border border-border/50 rounded text-xs text-muted-foreground font-mono space-y-1">
        <p className="text-primary">Security</p>
        <p>The agent prepares a draft — nothing is sent until you approve with your wallet.</p>
        <p>Final settlement requires wallet approval.</p>
        <p>Confidential Transfers hide amounts, not necessarily sender/receiver addresses.</p>
      </div>
    </div>
  );
}
