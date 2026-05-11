import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getMint,
} from "@solana/spl-token";

export interface BuildTransferInput {
  connection: Connection;
  sender: PublicKey;
  recipient: PublicKey;
  tokenMint?: string;
  amountUi: number;
}

export interface BuildTransferOutput {
  transaction: Transaction;
  description: string;
  steps: string[];
  blockhash: string;
  lastValidBlockHeight: number;
}

function uiAmountToBaseUnits(amountUi: number, decimals: number): bigint {
  if (!Number.isFinite(amountUi) || amountUi <= 0) {
    throw new Error("Amount must be a positive finite number.");
  }
  const str = amountUi.toFixed(decimals);
  const [whole, frac = ""] = str.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  const value = BigInt(combined === "" ? "0" : combined);
  if (value <= 0n) {
    throw new Error(
      `Amount ${amountUi} is too small to represent at ${decimals} decimals (would be 0 base units).`
    );
  }
  return value;
}

export async function buildSolTransfer(
  input: BuildTransferInput
): Promise<BuildTransferOutput> {
  const { connection, sender, recipient, amountUi } = input;
  const lamportsBig = uiAmountToBaseUnits(amountUi, 9);
  if (lamportsBig > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds maximum safe lamport range.");
  }
  const lamports = Number(lamportsBig);

  const tx = new Transaction();
  tx.add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports,
    })
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = sender;

  return {
    transaction: tx,
    description: `Transfer ${amountUi} SOL (${lamports} lamports, ${LAMPORTS_PER_SOL} per SOL)`,
    steps: [`SystemProgram.transfer ${lamports} lamports`],
    blockhash,
    lastValidBlockHeight,
  };
}

export async function buildSplTransfer(
  input: BuildTransferInput
): Promise<BuildTransferOutput> {
  const { connection, sender, recipient, tokenMint, amountUi } = input;
  if (!tokenMint) throw new Error("SPL transfer requires a token mint address.");
  if (!Number.isFinite(amountUi) || amountUi <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  const mintPubkey = new PublicKey(tokenMint);

  const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
  if (!mintAccountInfo) {
    throw new Error(`Token mint ${tokenMint} not found on-chain.`);
  }
  const programId = mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : mintAccountInfo.owner.equals(TOKEN_PROGRAM_ID)
      ? TOKEN_PROGRAM_ID
      : null;
  if (!programId) {
    throw new Error(
      `Mint owner program ${mintAccountInfo.owner.toBase58()} is not SPL Token or Token-2022.`
    );
  }

  const mintInfo = await getMint(connection, mintPubkey, "confirmed", programId);
  const decimals = mintInfo.decimals;
  const baseAmount = uiAmountToBaseUnits(amountUi, decimals);

  const senderAta = getAssociatedTokenAddressSync(
    mintPubkey,
    sender,
    false,
    programId
  );
  const recipientAta = getAssociatedTokenAddressSync(
    mintPubkey,
    recipient,
    false,
    programId
  );

  const tx = new Transaction();
  const steps: string[] = [];

  const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
  if (!recipientAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientAta,
        recipient,
        mintPubkey,
        programId
      )
    );
    steps.push("Create recipient associated token account");
  }

  tx.add(
    createTransferCheckedInstruction(
      senderAta,
      mintPubkey,
      recipientAta,
      sender,
      baseAmount,
      decimals,
      [],
      programId
    )
  );
  steps.push(
    `TransferChecked ${amountUi} (${baseAmount.toString()} base units, ${decimals} decimals) via ${
      programId.equals(TOKEN_2022_PROGRAM_ID) ? "Token-2022" : "SPL Token"
    }`
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = sender;

  return {
    transaction: tx,
    description: `Transfer ${amountUi} of ${tokenMint.slice(0, 6)}...${tokenMint.slice(-4)}`,
    steps,
    blockhash,
    lastValidBlockHeight,
  };
}

export async function buildTransferFromDraft(args: {
  connection: Connection;
  sender: PublicKey;
  recipient: PublicKey;
  tokenMint?: string;
  amountUi: number;
}): Promise<BuildTransferOutput> {
  const isSol =
    !args.tokenMint ||
    args.tokenMint.toUpperCase() === "SOL" ||
    args.tokenMint === "So11111111111111111111111111111111111111112";

  return isSol ? buildSolTransfer(args) : buildSplTransfer(args);
}
