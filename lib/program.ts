import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import { PublicKey, type Connection } from "@solana/web3.js"
import type { BN } from "bn.js"

// Constants from the program
export const MAX_USERNAME_LEN = 32
export const MAX_REMARKS_LEN = 100

// Program ID - replace with your actual program ID
export const PROGRAM_ID = new PublicKey("BEnbE74SakZikgjs8wvec7ou2ZCjA3sZ78o3MyFZbLpg")

// Seeds for PDAs
export const TRANSFER_SEED = Buffer.from("transfer")
export const GROUP_PAYMENT_SEED = Buffer.from("group_payment")
export const USER_PROFILE_SEED = Buffer.from("user_profile")

// Enum values
export enum TransferStatus {
  Pending = 0,
  Claimed = 1,
  Refunded = 2,
}

export enum GroupPaymentStatus {
  Open = 0,
  Completed = 1,
}

// Interface for the program
export interface BefkirProgram extends Program {
  methods: {
    registerUsername: (username: string) => any
    sendToAddress: (amount: BN, remarks: string, transferId: BN) => any
    claimTransfer: (transferId: BN) => any
    refundTransfer: (transferId: BN) => any
    createGroupPayment: (paymentId: BN, numParticipants: BN, amountPerPerson: BN, remarks: string) => any
    contributeToGroupPayment: (paymentId: BN, amount: BN) => any
  }
}

// Get the program instance
export const getProgram = (connection: Connection, wallet: any): BefkirProgram => {
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "processed" })

  // This requires your IDL file
  const idl = require("../idl/befkir.json")

  return new anchor.Program(idl, PROGRAM_ID, provider) as BefkirProgram
}

// Helper function to find the user profile PDA
export const findUserProfilePDA = async (owner: PublicKey) => {
  return PublicKey.findProgramAddressSync([USER_PROFILE_SEED, owner.toBuffer()], PROGRAM_ID)
}

// Helper function to find the transfer PDA
export const findTransferPDA = async (sender: PublicKey, transferId: BN) => {
  return PublicKey.findProgramAddressSync(
    [TRANSFER_SEED, sender.toBuffer(), transferId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID,
  )
}

// Helper function to find the group payment PDA
export const findGroupPaymentPDA = async (creator: PublicKey, paymentId: BN) => {
  return PublicKey.findProgramAddressSync(
    [GROUP_PAYMENT_SEED, creator.toBuffer(), paymentId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID,
  )
}
