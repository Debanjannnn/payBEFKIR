"use client"

import type React from "react"

import { useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

import { getProgram, findTransferPDA, MAX_REMARKS_LEN } from "@/lib/program"
import { getRandomId, solToLamports } from "@/lib/utils"

export default function SendPage() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!wallet.connected || !wallet.publicKey) {
      toast('Please connect your wallet to send a payment.')
      return
    }

    // Validate recipient
    let recipientPubkey: PublicKey
    try {
      recipientPubkey = new PublicKey(recipient)
    } catch (error) {
      toast('Please enter a valid Solana address.')
      return
    }

    // Validate amount
    const parsedAmount = Number.parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast('Please enter a valid amount greater than 0.')
      return
    }

    // Validate remarks
    if (remarks.length > MAX_REMARKS_LEN) {
      toast(`Remarks must be ${MAX_REMARKS_LEN} characters or less.`)
      return
    }

    try {
      setLoading(true)
      const program = getProgram(connection, wallet)
      const transferId = getRandomId()
      const [transferPDA] = await findTransferPDA(wallet.publicKey, transferId)

      const lamports = solToLamports(parsedAmount)

      await program.methods
        .sendToAddress(lamports, remarks, transferId)
        .accounts({
          transfer: transferPDA,
          signer: wallet.publicKey,
          recipient: recipientPubkey,
          systemProgram: PublicKey.default,
        })
        .rpc()

      toast(`You have successfully sent ${parsedAmount} SOL to ${recipient.slice(0, 4)}...${recipient.slice(-4)}.`)

      // Reset form
      setRecipient('')
      setAmount('')
      setRemarks('')
    } catch (error) {
      console.error('Error sending payment:', error)
      toast('There was an error sending your payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!wallet.connected) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Send Payment</CardTitle>
            <CardDescription>Connect your wallet to send a payment.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-muted-foreground">Please connect your wallet to continue.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Send Payment</CardTitle>
          <CardDescription>Send SOL to any Solana address.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendPayment}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (SOL)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000000001"
                  min="0"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add a note about this payment"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  maxLength={MAX_REMARKS_LEN}
                />
                <p
                  className={`text-xs ${remarks.length > MAX_REMARKS_LEN ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {remarks.length}/{MAX_REMARKS_LEN} characters
                </p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Payment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
