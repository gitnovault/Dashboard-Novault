import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Copy, Check, Edit2, Save, X, Users } from "lucide-react";
import {
  loadRecipients,
  saveRecipient,
  deleteRecipient,
  updateRecipient,
  validateSolanaAddress,
} from "@/lib/storage/recipients";
import type { Recipient } from "@/types/novault";

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setRecipients(loadRecipients());
  }, []);

  const refresh = () => setRecipients(loadRecipients());

  const handleAdd = () => {
    setAddError(null);
    if (!newLabel.trim()) {
      setAddError("Label is required.");
      return;
    }
    if (!validateSolanaAddress(newAddress.trim())) {
      setAddError("Invalid Solana address.");
      return;
    }
    saveRecipient({ label: newLabel.trim(), address: newAddress.trim() });
    setNewLabel("");
    setNewAddress("");
    setShowAdd(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteRecipient(id);
    refresh();
  };

  const startEdit = (r: Recipient) => {
    setEditingId(r.id);
    setEditLabel(r.label);
    setEditAddress(r.address);
    setEditError(null);
  };

  const handleSaveEdit = () => {
    setEditError(null);
    if (!editLabel.trim()) {
      setEditError("Label is required.");
      return;
    }
    if (!validateSolanaAddress(editAddress.trim())) {
      setEditError("Invalid Solana address.");
      return;
    }
    updateRecipient(editingId!, { label: editLabel.trim(), address: editAddress.trim() });
    setEditingId(null);
    refresh();
  };

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Recipients</h1>
          <p className="text-xs text-muted-foreground font-mono">STORED LOCALLY — NO BACKEND</p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          data-testid="add-recipient-button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Recipient
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-lg p-4 space-y-3"
        >
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            New Recipient
          </p>
          <div className="space-y-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Alice, Treasury)"
              data-testid="recipient-label-input"
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Solana wallet address"
              data-testid="recipient-address-input"
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {addError && (
            <p className="text-xs font-mono text-destructive">{addError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              data-testid="save-recipient-button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs text-foreground hover:border-primary/50 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {recipients.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground font-mono">No saved recipients.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Save frequently used addresses for quick access.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {recipients.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-4 py-3"
              data-testid={`recipient-row-${r.id}`}
            >
              {editingId === r.id ? (
                <div className="space-y-2">
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full bg-background border border-input rounded px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {editError && (
                    <p className="text-xs font-mono text-destructive">{editError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded text-xs hover:opacity-90"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-muted border border-border rounded text-xs text-foreground"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.label}</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {r.address.slice(0, 12)}...{r.address.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => handleCopy(r.address, r.id)}
                      data-testid={`copy-recipient-${r.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedId === r.id ? (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(r)}
                      data-testid={`edit-recipient-${r.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      data-testid={`delete-recipient-${r.id}`}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
