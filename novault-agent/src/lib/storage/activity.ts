import type { SubmittedTransaction, TxStatus } from "@/types/novault";
import { getConnection } from "@/lib/solana/connection";
import type { Network } from "@/types/solana";

const STORAGE_KEY = "novault_activity";

export function loadActivity(): SubmittedTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SubmittedTransaction[];
  } catch {
    return [];
  }
}

export function saveTransaction(tx: Omit<SubmittedTransaction, "id" | "createdAt">): SubmittedTransaction {
  const activity = loadActivity();
  const newTx: SubmittedTransaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  activity.unshift(newTx);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
  return newTx;
}

export function updateTransaction(id: string, updates: Partial<SubmittedTransaction>): void {
  const activity = loadActivity();
  const idx = activity.findIndex((t) => t.id === id);
  if (idx === -1) return;
  activity[idx] = { ...activity[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
}

export async function refreshTransactionStatus(tx: SubmittedTransaction): Promise<SubmittedTransaction> {
  const network = tx.network as Network;
  const connection = getConnection(network);

  try {
    const result = await connection.getSignatureStatuses([tx.signature], {
      searchTransactionHistory: true,
    });

    const status = result.value[0];

    if (!status) {
      return { ...tx, status: "Submitted" as TxStatus };
    }

    let newStatus: TxStatus = "Submitted";
    if (status.err) {
      newStatus = "Failed";
    } else if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
      newStatus = "Confirmed";
    }

    const updated: SubmittedTransaction = {
      ...tx,
      status: newStatus,
      slot: status.slot ?? tx.slot,
      confirmedAt:
        newStatus === "Confirmed" && !tx.confirmedAt
          ? new Date().toISOString()
          : tx.confirmedAt,
      error: status.err ? JSON.stringify(status.err) : tx.error,
    };

    updateTransaction(tx.id, updated);
    return updated;
  } catch {
    return tx;
  }
}
