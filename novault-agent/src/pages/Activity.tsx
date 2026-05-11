import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, RefreshCw, Activity as ActivityIcon } from "lucide-react";
import { loadActivity, refreshTransactionStatus } from "@/lib/storage/activity";
import { getExplorerTxUrl } from "@/lib/solana/connection";
import type { SubmittedTransaction } from "@/types/novault";

const STATUS_STYLES: Record<string, string> = {
  Confirmed: "text-primary bg-primary/10 border-primary/20",
  Submitted: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Failed: "text-destructive bg-destructive/10 border-destructive/20",
  Draft: "text-muted-foreground bg-muted/30 border-border",
  Building: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  AwaitingApproval: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export default function Activity() {
  const [activity, setActivity] = useState<SubmittedTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setActivity(loadActivity());
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const current = loadActivity();
    const refreshed = await Promise.all(
      current.map((tx) => refreshTransactionStatus(tx))
    );
    setActivity(refreshed);
    setRefreshing(false);
  }, []);

  const handleCopy = (sig: string, id: string) => {
    navigator.clipboard.writeText(sig);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Activity</h1>
          <p className="text-xs text-muted-foreground font-mono">
            REAL CONFIRMATION STATUS — MAINNET
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="refresh-activity-button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded text-xs text-foreground hover:border-primary/50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ActivityIcon className="w-10 h-10 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground font-mono">No transactions submitted yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Use the New Transfer page to create and sign transactions.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border">
            {["Signature", "Status", "Time", "Explorer"].map((h) => (
              <span key={h} className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {activity.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3"
                data-testid={`activity-row-${tx.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-foreground truncate">
                    {tx.signature.slice(0, 12)}...{tx.signature.slice(-8)}
                  </span>
                  <button
                    onClick={() => handleCopy(tx.signature, tx.id)}
                    data-testid={`copy-sig-${tx.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {copiedId === tx.id ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${STATUS_STYLES[tx.status] ?? "text-muted-foreground border-border"}`}
                >
                  {tx.status.toUpperCase()}
                </span>

                <div className="text-right">
                  <p className="text-xs font-mono text-foreground">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <a
                  href={getExplorerTxUrl(tx.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`explorer-link-${tx.id}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
