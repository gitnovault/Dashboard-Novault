import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Network } from "@/types/solana";
import type { TransferDraft } from "@/types/novault";

interface WalletStoreState {
  network: Network;
  agentMemoryEnabled: boolean;
  setAgentMemoryEnabled: (enabled: boolean) => void;
  defaultPrivacyMode: "confidential" | "standard";
  setDefaultPrivacyMode: (mode: "confidential" | "standard") => void;
  pendingDraft: TransferDraft | null;
  setPendingDraft: (draft: TransferDraft | null) => void;
}

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set) => ({
      network: "mainnet-beta",
      agentMemoryEnabled: true,
      setAgentMemoryEnabled: (agentMemoryEnabled) => set({ agentMemoryEnabled }),
      defaultPrivacyMode: "confidential",
      setDefaultPrivacyMode: (defaultPrivacyMode) => set({ defaultPrivacyMode }),
      pendingDraft: null,
      setPendingDraft: (pendingDraft) => set({ pendingDraft }),
    }),
    {
      name: "novault-store-v2",
      partialize: (state) => ({
        network: state.network,
        agentMemoryEnabled: state.agentMemoryEnabled,
        defaultPrivacyMode: state.defaultPrivacyMode,
      }),
    }
  )
);
