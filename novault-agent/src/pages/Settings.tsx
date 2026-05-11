import { motion } from "framer-motion";
import { Shield, Server, Brain, Lock, Globe } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";

export default function Settings() {
  const {
    agentMemoryEnabled,
    setAgentMemoryEnabled,
    defaultPrivacyMode,
    setDefaultPrivacyMode,
  } = useWalletStore();

  return (
    <div className="p-6 space-y-5 max-w-lg">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground font-mono">AGENT CONFIGURATION</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Server className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Network
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Solana mainnet endpoint. Configure a custom RPC via the
            <code className="mx-1 px-1 py-0.5 bg-muted/40 rounded text-primary">VITE_SOLANA_RPC_URL</code>
            environment variable.
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-primary/40 bg-primary/10 text-sm font-mono text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            mainnet-beta
          </div>
          <p className="text-xs text-amber-400 font-mono mt-2">
            Real funds will be used. All transactions are live.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Default Privacy Mode
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Default privacy setting when composing new transfers.
          </p>
          <div className="flex gap-2">
            {(["confidential", "standard"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDefaultPrivacyMode(mode)}
                data-testid={`privacy-option-${mode}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded border text-sm font-mono transition-colors ${
                  defaultPrivacyMode === mode
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {mode === "confidential" ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                {mode}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Agent Memory
          </span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Enable Agent Memory</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stores parsed intents and draft history locally.
            </p>
          </div>
          <button
            onClick={() => setAgentMemoryEnabled(!agentMemoryEnabled)}
            data-testid="agent-memory-toggle"
            className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
              agentMemoryEnabled
                ? "bg-primary border-primary"
                : "bg-muted border-border"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                agentMemoryEnabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-destructive/20 rounded-lg"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-destructive/20">
          <Shield className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs font-mono text-destructive uppercase tracking-wider">
            Security
          </span>
        </div>
        <div className="p-4 space-y-3 text-xs font-mono">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
            <p className="text-foreground font-bold">Novault Agent never holds private keys.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
            <p className="text-muted-foreground">
              All transactions require your wallet signature before submission.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
            <p className="text-muted-foreground">Never enter your seed phrase anywhere in this app.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
            <p className="text-muted-foreground">
              Confidential Transfers hide amounts, not necessarily sender/receiver addresses.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
            <p className="text-muted-foreground">
              Browser-side ZK proof generation is not yet available for confidential transfers.
              The agent will display an explicit unsupported feature error, never fake success.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
