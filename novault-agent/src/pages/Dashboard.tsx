import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useLocation } from "wouter";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Copy,
  Check,
  ArrowUpRight,
  Activity,
  Layers,
  Cpu,
  Shield,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { truncateAddress } from "@/lib/solana/tokenAccounts";
import { loadActivity, refreshTransactionStatus } from "@/lib/storage/activity";
import { getExplorerTxUrl } from "@/lib/solana/connection";
import type { SubmittedTransaction } from "@/types/novault";

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [, setLocation] = useLocation();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentActivity, setRecentActivity] = useState<SubmittedTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      setSolBalance(null);
      return;
    }
    setBalanceLoading(true);
    connection
      .getBalance(publicKey)
      .then((lamports) => setSolBalance(lamports / LAMPORTS_PER_SOL))
      .catch(() => setSolBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [connected, publicKey, connection]);

  useEffect(() => {
    const activity = loadActivity().slice(0, 3);
    setRecentActivity(activity);
  }, []);

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleRefreshActivity = async () => {
    setRefreshing(true);
    const activity = loadActivity().slice(0, 3);
    const refreshed = await Promise.all(activity.map((tx) => refreshTransactionStatus(tx)));
    setRecentActivity(refreshed);
    setRefreshing(false);
  };

  const statusColor: Record<string, string> = {
    Confirmed: "text-primary",
    Submitted: "text-amber-400",
    Failed: "text-destructive",
    Draft: "text-muted-foreground",
    Building: "text-blue-400",
    AwaitingApproval: "text-amber-400",
  };

  if (!connected) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-sm text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
            <img src="/logofav.png" alt="Novault" className="w-20 h-20 rounded-xl relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Novault Agent</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Private Solana transfer console. Connect your wallet to access the dashboard.
            </p>
          </div>
          <div className="w-full flex flex-col items-center gap-3">
            <WalletMultiButton
              data-testid="wallet-connect-button"
              className="!bg-primary !text-primary-foreground !rounded !font-medium !text-sm !px-6 !py-2 !h-auto hover:!opacity-90 transition-opacity"
            />
            <p className="text-xs text-muted-foreground font-mono">
              Supports Phantom, Solflare, Backpack
            </p>
          </div>
          <div className="w-full p-3 bg-card border border-border rounded text-xs text-muted-foreground font-mono text-left space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-3 h-3" />
              <span>Security notice</span>
            </div>
            <p>Novault Agent never holds private keys.</p>
            <p>Never enter your seed phrase anywhere.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground font-mono">AGENT STATUS: READY</p>
        </div>
        <WalletMultiButton
          data-testid="wallet-connect-button"
          className="!bg-card !border !border-border !text-foreground !rounded !font-medium !text-xs !px-3 !py-1.5 !h-auto hover:!border-primary/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-lg p-4 col-span-1 md:col-span-2 lg:col-span-1"
          data-testid="wallet-status-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Wallet Connected
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-sm text-foreground" data-testid="wallet-address">
              {truncateAddress(publicKey!.toBase58(), 8)}
            </span>
            <button
              onClick={handleCopy}
              data-testid="copy-address-button"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground" data-testid="sol-balance">
              {balanceLoading
                ? "—"
                : solBalance !== null
                ? solBalance.toFixed(4)
                : "Error"}
            </span>
            <span className="text-sm text-muted-foreground font-mono">SOL</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">MAINNET</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Agent Status
            </span>
          </div>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="text-primary">Confidential</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="text-primary">MAINNET</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custody</span>
              <span className="text-destructive">None</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Quick Actions
            </span>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setLocation("/transfer")}
              data-testid="new-transfer-button"
              className="w-full flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/20 rounded text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              <span>New Private Transfer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLocation("/tokens")}
              data-testid="check-readiness-nav-button"
              className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 border border-border rounded text-sm text-foreground hover:border-primary/30 transition-colors"
            >
              <span>Token-2022 Readiness</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium">Recent Activity</span>
          </div>
          <button
            onClick={handleRefreshActivity}
            data-testid="refresh-activity-button"
            disabled={refreshing}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground font-mono">
              No transactions submitted yet.
            </div>
          ) : (
            recentActivity.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-4 py-3"
                data-testid={`activity-row-${tx.id}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs text-foreground">
                    {truncateAddress(tx.signature, 6)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono ${statusColor[tx.status] ?? "text-muted-foreground"}`}
                  >
                    {tx.status.toUpperCase()}
                  </span>
                  <a
                    href={getExplorerTxUrl(tx.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <div className="p-3 bg-card/50 border border-border/50 rounded text-xs text-muted-foreground font-mono flex items-start gap-2">
        <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
        <span>
          Novault Agent prepares transactions but cannot move funds without your wallet signature.
          Amounts are represented as encrypted in private transfer mode.
        </span>
      </div>
    </div>
  );
}
