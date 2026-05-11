import type { ParsedTransferIntent, TransferIntent } from "@/types/novault";
import { isValidSolanaAddress } from "@/lib/solana/tokenAccounts";
import { resolveToken, isNativeSol } from "@/lib/solana/tokenRegistry";

const TOKEN_ALIASES: Record<string, string> = {
  usdc: "USDC",
  "usdc-2022": "USDC-2022",
  sol: "SOL",
  usdt: "USDT",
  bonk: "BONK",
  jup: "JUP",
};

const SCHEDULE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /every\s+day|daily/i, label: "Every day" },
  { pattern: /every\s+week|weekly/i, label: "Every week" },
  { pattern: /every\s+monday/i, label: "Every Monday" },
  { pattern: /every\s+tuesday/i, label: "Every Tuesday" },
  { pattern: /every\s+wednesday/i, label: "Every Wednesday" },
  { pattern: /every\s+thursday/i, label: "Every Thursday" },
  { pattern: /every\s+friday/i, label: "Every Friday" },
  { pattern: /every\s+saturday/i, label: "Every Saturday" },
  { pattern: /every\s+sunday/i, label: "Every Sunday" },
  { pattern: /every\s+month|monthly/i, label: "Every month" },
];

const PRIVATE_TERMS = /\bprivate(?:ly)?\b|\bconfidential\b|\bhidden\b|\bsecret\b|\bprivacy\b|\bzk\b/i;

export function parseTransferIntent(intent: TransferIntent): ParsedTransferIntent {
  const input = intent.rawInput.trim();
  const errors: string[] = [];

  let action: ParsedTransferIntent["action"] = "unknown";
  if (/\bsend\b|\btransfer\b/i.test(input)) action = "send";
  else if (/\bwithdraw\b/i.test(input)) action = "withdraw";
  else if (/\bdeposit\b/i.test(input)) action = "deposit";

  if (action === "unknown") {
    errors.push("Could not determine action. Use 'send', 'transfer', 'withdraw', or 'deposit'.");
  }

  const amountMatch = input.match(/\b(\d+(?:\.\d+)?)\s*([A-Za-z-]{2,10})?\b/);
  let amount: number | undefined;
  let tokenSymbol: string | undefined;

  if (amountMatch) {
    const parsed = parseFloat(amountMatch[1]);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
    if (amountMatch[2]) {
      const raw = amountMatch[2].toLowerCase();
      tokenSymbol = TOKEN_ALIASES[raw] ?? amountMatch[2].toUpperCase();
    }
  }

  if (!amount) {
    errors.push("Could not determine amount. Example: '500 USDC'");
  }

  const tokenPatternMatch = input.match(
    /\b(usdc(?:-2022)?|usdt|sol|bonk|jup|[A-Z]{2,8})\b/i
  );
  if (!tokenSymbol && tokenPatternMatch) {
    const raw = tokenPatternMatch[1].toLowerCase();
    tokenSymbol = TOKEN_ALIASES[raw] ?? tokenPatternMatch[1].toUpperCase();
  }

  const words = input.split(/\s+/);
  let recipientAddress: string | undefined;
  for (const word of words) {
    const cleaned = word.replace(/[^A-Za-z0-9]/g, "");
    if (cleaned.length >= 32 && isValidSolanaAddress(cleaned)) {
      recipientAddress = cleaned;
      break;
    }
  }

  if (!recipientAddress) {
    const toMatch = input.match(/\bto\s+([A-Za-z0-9]{32,44})\b/i);
    if (toMatch) {
      recipientAddress = toMatch[1];
    }
  }

  if (!recipientAddress) {
    errors.push(
      "Could not find a valid recipient Solana address. Example: 'to 9xQeAB...'"
    );
  }

  let schedule: string | undefined;
  for (const { pattern, label } of SCHEDULE_PATTERNS) {
    if (pattern.test(input)) {
      schedule = label;
      break;
    }
  }

  const privacyMode: ParsedTransferIntent["privacyMode"] = PRIVATE_TERMS.test(input)
    ? "confidential"
    : "standard";

  const memoMatch = input.match(/\bmemo[:\s]+["']?([^"']+?)["']?(?:\s|$)/i);
  const memo = memoMatch ? memoMatch[1].trim() : undefined;

  let resolvedMint: string | null | undefined;
  let nativeSol = false;
  if (tokenSymbol) {
    const known = resolveToken(tokenSymbol);
    if (known) {
      resolvedMint = known.mint;
      nativeSol = isNativeSol(known);
    } else {
      errors.push(
        `Unknown token "${tokenSymbol}". Known: SOL, USDC, USDT, BONK, JUP, WSOL. Paste an explicit mint address to use other tokens.`
      );
    }
  }

  return {
    action,
    tokenSymbol,
    recipientAddress,
    amount,
    schedule,
    privacyMode,
    memo,
    resolvedMint,
    isNativeSol: nativeSol,
    parseErrors: errors,
  };
}
