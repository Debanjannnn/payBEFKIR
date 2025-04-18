import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { BN } from "bn.js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function lamportsToSol(lamports: number | BN): number {
  if (typeof lamports === "number") {
    return lamports / LAMPORTS_PER_SOL
  }
  return lamports.toNumber() / LAMPORTS_PER_SOL
}

export function solToLamports(sol: number): BN {
  return new BN(sol * LAMPORTS_PER_SOL)
}

export function formatSol(sol: number): string {
  return `${sol.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  })} SOL`
}

export function getRandomId(): BN {
  return new BN(Math.floor(Math.random() * 1000000000))
}
