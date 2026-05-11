import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { RefreshCw, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { fetchTokenAccounts } from "@/lib/solana/tokenAccounts";
import { fetchMintInfo } from "@/lib/solana/token2022";
import { useWalletStore } from "@/store/walletStore";
import type { TokenAccountInfo, Token2022MintInfo } from "@/types/solana";

export default function Tokens() {
  const { connected, publicKey } = useWallet();
  const { network } = useWalletStore();

  const [accounts, setAccounts] = useState<TokenAccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customMint, setCustomMint] = useState("");
  const [mintInfo, setMintInfo] = useState<Token2022MintInfo | null>(null);
  const [mintInfoLoading, setMintInfoLoading] = useState(false);
  const [mintInfoError, setMintInfoError] = useState<string | null>(null);
  const [expandedMint, setExpandedMint] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTokenAccounts(publicKey.toBase58(), network);
      setAccounts(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [publicKey, network]);

  const handleInspectMint = async () => {
    if (!customMint.trim()) return;
    setMintInfoLoading(true);
    setMintInfoError(null);
    setMintInfo(null);
    try {
      const info = await fetchMintInfo(customMint.trim(), network);
      setMintInfo(info);
    } catch (e) {
      setMintInfoError(String(e));
    } finally {
      setMintInfoLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to scan token accounts.</p>
        <WalletMultiButton data-testid="wallet-connect-button" />
      </div>
    );
  }

  const splCount = accounts.filter((a) => !a.isToken2022).length;
  const token2022Count = accounts.filter((a) => a.isToken2022).length;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Token-2022 Readiness</h1>
          <p className="text-xs text-muted-foreground font-mono">REAL RPC — {network.toUpperCase()}</p>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          data-testid="fetch-tokens-button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded text-xs text-foreground hover:border-primary/50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Scan Accounts
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-xs font-mono text-destructive">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
            <p className="text-xs text-muted-foreground font-mono">Total Accounts</p>
          </div>
          <div className="bg-card border border-border rounded p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{splCount}</p>
            <p className="text-xs text-muted-foreground font-mono">SPL Token</p>
          </div>
          <div className="bg-card border border-border rounded p-3 text-center">
            <p className="text-2xl font-bold text-primary">{token2022Count}</p>
            <p className="text-xs text-muted-foreground font-mono">Token-2022</p>
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Token Accounts
            </span>
          </div>
          <div className="divide-y divide-border">
            {accounts.map((acc, i) => (
              <motion.div
                key={acc.pubkey}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="px-4 py-3"
                data-testid={`token-account-${i}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                        acc.isToken2022
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {acc.isToken2022 ? "Token-2022" : "SPL"}
                    </div>
                    <span className="text-xs font-mono text-foreground">
                      {acc.mint.slice(0, 8)}...{acc.mint.slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-foreground">
                      {acc.uiAmount?.toLocaleString() ?? "0"}
                    </span>
                    {acc.isToken2022 ? (
                      <div className="flex items-center gap-1 text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs font-mono">CT: Unknown</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="w-3 h-3" />
                        <span className="text-xs font-mono">CT: N/A</span>
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setExpandedMint((e) => (e === acc.pubkey ? null : acc.pubkey))
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedMint === acc.pubkey ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedMint === acc.pubkey && (
                  <div className="mt-3 pl-2 border-l border-border space-y-1 text-xs font-mono">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground w-24">Account</span>
                      <span className="text-foreground break-all">{acc.pubkey}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground w-24">Mint</span>
                      <span className="text-foreground break-all">{acc.mint}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground w-24">Program</span>
                      <span className="text-foreground break-all">{acc.programId}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground w-24">Decimals</span>
                      <span className="text-foreground">{acc.decimals}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground w-24">Raw Amount</span>
                      <span className="text-foreground">{acc.amount}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Inspect Mint Address
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={customMint}
              onChange={(e) => setCustomMint(e.target.value)}
              placeholder="Enter any Solana mint address..."
              data-testid="mint-address-input"
              className="flex-1 bg-background border border-input rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleInspectMint}
              disabled={!customMint.trim() || mintInfoLoading}
              data-testid="inspect-mint-button"
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded text-sm text-foreground hover:border-primary/50 disabled:opacity-50 transition-colors"
            >
              <Search className={`w-3.5 h-3.5 ${mintInfoLoading ? "animate-pulse" : ""}`} />
              Inspect
            </button>
          </div>

          {mintInfoError && (
            <p className="text-xs font-mono text-destructive">{mintInfoError}</p>
          )}

          {mintInfo && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 text-xs font-mono"
              data-testid="mint-info-panel"
            >
              <div className="flex items-center gap-2 mb-2">
                {mintInfo.hasConfidentialTransfer ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                )}
                <span
                  className={mintInfo.hasConfidentialTransfer ? "text-primary" : "text-destructive"}
                >
                  Confidential Transfer:{" "}
                  {mintInfo.hasConfidentialTransfer ? "Configured" : "Not Detected"}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="text-muted-foreground w-24">Decimals</span>
                <span className="text-foreground">{mintInfo.decimals}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-muted-foreground w-24">Extensions</span>
                <span className="text-foreground">
                  {mintInfo.extensions.length > 0
                    ? mintInfo.extensions.map((e) => e.type).join(", ")
                    : "None detected"}
                </span>
              </div>
              {mintInfo.confidentialTransferMintConfig && (
                <>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground w-24">Auto-approve</span>
                    <span className="text-foreground">
                      {mintInfo.confidentialTransferMintConfig.autoApproveNewAccounts
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
