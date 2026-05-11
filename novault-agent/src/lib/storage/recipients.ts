import { PublicKey } from "@solana/web3.js";
import type { Recipient } from "@/types/novault";

const STORAGE_KEY = "novault_recipients";

export function loadRecipients(): Recipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Recipient[];
  } catch {
    return [];
  }
}

export function saveRecipient(recipient: Omit<Recipient, "id" | "createdAt">): Recipient {
  const recipients = loadRecipients();
  const newRecipient: Recipient = {
    ...recipient,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  recipients.push(newRecipient);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipients));
  return newRecipient;
}

export function updateRecipient(id: string, updates: Partial<Omit<Recipient, "id" | "createdAt">>): void {
  const recipients = loadRecipients();
  const idx = recipients.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Recipient not found");
  recipients[idx] = { ...recipients[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipients));
}

export function deleteRecipient(id: string): void {
  const recipients = loadRecipients().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipients));
}

export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
