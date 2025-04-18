"use client"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getProgram, TransferStatus } from "@/lib/program"
import { lamportsToSol, formatSol, shortenAddress } from "@/lib/utils"
import { BN } from "bn.js"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"

interface Transfer {
  pubkey: PublicKey
  account: {
    sender: PublicKey
    recipient: PublicKey
    amount: typeof BN
    status: number
    remarks: string
    timestamp: typeof BN
  }
}

export default function TransfersPage() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [sentTransfers, setSentTransfers] = useState<Transfer[]>([])
  const [receivedTransfers, setReceivedTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!wallet.connected || !wallet.publicKey) return

      try {
        setLoading(true)
        const program = getProgram(connection, wallet)

        // Fetch all transfers
        const allTransfers = await program.account.transfer.all()

        // Filter sent and received transfers
        const sent = allTransfers.filter((t) => (t.account as any).sender.toString() === wallet.publicKey?.toString())
        const received = allTransfers.filter((t) => (t.account as any).recipient.toString() === wallet.publicKey?.toString())

        setSentTransfers(sent as unknown as Transfer[])
        setReceivedTransfers(received as unknown as Transfer[])
      } catch (error) {
        console.error('Error fetching transfers:', error)
        toast('Failed to load transfers. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTransfers()
  }, [wallet.connected, wallet.publicKey, connection])

  const handleClaimTransfer = async (transfer: Transfer) => {
    if (!wallet.connected || !wallet.publicKey) return

    try {
      setActionLoading(transfer.pubkey.toString())
      const program = getProgram(connection, wallet)

      await program.methods
        .claimTransfer(new BN(0))
        .accounts({
          transfer: transfer.pubkey,
          signer: wallet.publicKey,
          recipient: transfer.account.recipient,
          systemProgram: PublicKey.default,
        })
        .rpc()

      toast('You have successfully claimed the transfer.')

      // Update the transfer in the UI
      setReceivedTransfers((prev) => prev.filter((t) => t.pubkey.toString() !== transfer.pubkey.toString()))
    } catch (error) {
      console.error('Error claiming transfer:', error)
      toast('There was an error claiming the transfer. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefundTransfer = async (transfer: Transfer) => {
    if (!wallet.connected || !wallet.publicKey) return

    try {
      setActionLoading(transfer.pubkey.toString())
      const program = getProgram(connection, wallet)

      await program.methods
        .refundTransfer(new BN(0))
        .accounts({
          transfer: transfer.pubkey,
          signer: wallet.publicKey,
          sender: transfer.account.sender,
          systemProgram: PublicKey.default,
        })
        .rpc()

      toast('You have successfully refunded the transfer.')

      // Update the transfer in the UI
      setSentTransfers((prev) => prev.filter((t) => t.pubkey.toString() !== transfer.pubkey.toString()))
    } catch (error) {
      console.error('Error refunding transfer:', error)
      toast('There was an error refunding the transfer. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case TransferStatus.Pending:
        return (
          <div className="flex items-center text-yellow-500">
            <Clock className="mr-1 h-4 w-4" />
            <span>Pending</span>
          </div>
        )
      case TransferStatus.Claimed:
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="mr-1 h-4 w-4" />
            <span>Claimed</span>
          </div>
        )
      case TransferStatus.Refunded:
        return (
          <div className="flex items-center text-red-500">
            <XCircle className="mr-1 h-4 w-4" />
            <span>Refunded</span>
          </div>
        )
      default:
        return <span>Unknown</span>
    }
  }

  if (!wallet.connected) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Transfers</CardTitle>
            <CardDescription>Connect your wallet to view your transfers.</CardDescription>
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
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Transfers</CardTitle>
          <CardDescription>View and manage your transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
            <TabsContent value="received" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : receivedTransfers.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p className="text-muted-foreground">No received transfers found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedTransfers.map((transfer) => (
                    <Card key={transfer.pubkey.toString()}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium">From</p>
                            <p className="text-sm">{shortenAddress(transfer.account.sender.toString(), 6)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Amount</p>
                            <p className="text-lg font-bold">{formatSol(lamportsToSol(transfer.account.amount))}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            {getStatusBadge(transfer.account.status)}
                          </div>
                          {transfer.account.remarks && (
                            <div className="md:col-span-3">
                              <p className="text-sm font-medium">Remarks</p>
                              <p className="text-sm">{transfer.account.remarks}</p>
                            </div>
                          )}
                          {transfer.account.status === TransferStatus.Pending && (
                            <div className="md:col-span-3 flex justify-end">
                              <Button
                                onClick={() => handleClaimTransfer(transfer)}
                                disabled={actionLoading === transfer.pubkey.toString()}
                              >
                                {actionLoading === transfer.pubkey.toString() ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Claiming...
                                  </>
                                ) : (
                                  "Claim Transfer"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sentTransfers.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p className="text-muted-foreground">No sent transfers found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentTransfers.map((transfer) => (
                    <Card key={transfer.pubkey.toString()}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium">To</p>
                            <p className="text-sm">{shortenAddress(transfer.account.recipient.toString(), 6)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Amount</p>
                            <p className="text-lg font-bold">{formatSol(lamportsToSol(transfer.account.amount))}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            {getStatusBadge(transfer.account.status)}
                          </div>
                          {transfer.account.remarks && (
                            <div className="md:col-span-3">
                              <p className="text-sm font-medium">Remarks</p>
                              <p className="text-sm">{transfer.account.remarks}</p>
                            </div>
                          )}
                          {transfer.account.status === TransferStatus.Pending && (
                            <div className="md:col-span-3 flex justify-end">
                              <Button
                                variant="destructive"
                                onClick={() => handleRefundTransfer(transfer)}
                                disabled={actionLoading === transfer.pubkey.toString()}
                              >
                                {actionLoading === transfer.pubkey.toString() ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Refunding...
                                  </>
                                ) : (
                                  "Refund Transfer"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
