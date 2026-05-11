export interface KnownToken {
  symbol: string;
  mint: string | null;
  isToken2022?: boolean;
  note?: string;
}

export const SOL_TOKEN: KnownToken = {
  symbol: "SOL",
  mint: null,
  note: "Native SOL — uses SystemProgram.transfer.",
};

export const KNOWN_MAINNET_TOKENS: Record<string, KnownToken> = {
  SOL: SOL_TOKEN,
  USDC: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  USDT: {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
  BONK: {
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  },
  JUP: {
    symbol: "JUP",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  },
  WSOL: {
    symbol: "WSOL",
    mint: "So11111111111111111111111111111111111111112",
  },
};

export function resolveToken(symbol: string | undefined): KnownToken | null {
  if (!symbol) return null;
  return KNOWN_MAINNET_TOKENS[symbol.toUpperCase()] ?? null;
}

export function isNativeSol(token: KnownToken | null | undefined): boolean {
  return !!token && token.symbol === "SOL" && token.mint === null;
}
