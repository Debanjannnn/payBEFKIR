"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getProgram, findGroupPaymentPDA, GroupPaymentStatus, MAX_REMARKS_LEN } from "@/lib/program"
import { lamportsToSol, formatSol, shortenAddress, getRandomId, solToLamports } from "@/lib/utils"
import { BN } from "bn.js"
import { Loader2, Users, CheckCircle, Clock, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface GroupPayment {
  pubkey: PublicKey
  account: {
    creator: PublicKey
    recipient: PublicKey
    totalAmount: InstanceType<typeof BN>
    amountPerPerson: InstanceType<typeof BN>
    numParticipants: InstanceType<typeof BN>
    amountCollected: InstanceType<typeof BN>
    status: number
    remarks: string
    timestamp: InstanceType<typeof BN>
  }
}

export default function GroupPaymentsPage() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [createdPayments, setCreatedPayments] = useState<GroupPayment[]>([])
  const [availablePayments, setAvailablePayments] = useState<GroupPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // New group payment form state
  const [recipient, setRecipient] = useState("")
  const [numParticipants, setNumParticipants] = useState("")
  const [amountPerPerson, setAmountPerPerson] = useState("")
  const [remarks, setRemarks] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    const fetchGroupPayments = async () => {
      if (!wallet.connected || !wallet.publicKey) return

      try {
        setLoading(true)
        const program = getProgram(connection, wallet)

        // Fetch all group payments
        const allPayments = await program.account.groupPayment.all()

        // Filter created payments
        const created = allPayments.filter((p) => (p.account as any).creator.toString() === wallet.publicKey?.toString())

        // Filter available payments (open and not created by the user)
        const available = allPayments.filter(
          (p) =>
            (p.account as any).creator.toString() !== wallet.publicKey?.toString() &&
            (p.account as any).status === GroupPaymentStatus.Open,
        )

        setCreatedPayments(created as unknown as GroupPayment[])
        setAvailablePayments(available as unknown as GroupPayment[])
      } catch (error) {
        console.error('Error fetching group payments:', error)
        toast('Failed to load group payments. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchGroupPayments()
  }, [wallet.connected, wallet.publicKey, connection])

  const handleCreateGroupPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!wallet.connected || !wallet.publicKey) {
      toast('Please connect your wallet to create a group payment.')
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

    // Validate number of participants
    const parsedNumParticipants = Number.parseInt(numParticipants)
    if (isNaN(parsedNumParticipants) || parsedNumParticipants <= 0) {
      toast('Please enter a valid number greater than 0.')
      return
    }

    // Validate amount per person
    const parsedAmountPerPerson = Number.parseFloat(amountPerPerson)
    if (isNaN(parsedAmountPerPerson) || parsedAmountPerPerson <= 0) {
      toast('Please enter a valid amount greater than 0.')
      return
    }

    // Validate remarks
    if (remarks.length > MAX_REMARKS_LEN) {
      toast(`Remarks must be ${MAX_REMARKS_LEN} characters or less.`)
      return
    }

    try {
      setCreateLoading(true)
      const program = getProgram(connection, wallet)
      const paymentId = getRandomId()
      const [groupPaymentPDA] = await findGroupPaymentPDA(wallet.publicKey, paymentId)

      const bnNumParticipants = new BN(parsedNumParticipants)
      const bnAmountPerPerson = solToLamports(parsedAmountPerPerson)

      await program.methods
        .createGroupPayment(paymentId, bnNumParticipants, bnAmountPerPerson, remarks)
        .accounts({
          groupPayment: groupPaymentPDA,
          signer: wallet.publicKey,
          recipient: recipientPubkey,
          systemProgram: PublicKey.default,
        })
        .rpc()

      toast(`You have successfully created a group payment for ${parsedNumParticipants} participants.`)

      // Add the new payment to the UI
      const newPayment: GroupPayment = {
        pubkey: groupPaymentPDA,
        account: {
          creator: wallet.publicKey,
          recipient: recipientPubkey,
          totalAmount: bnAmountPerPerson.mul(bnNumParticipants),
          amountPerPerson: bnAmountPerPerson,
          numParticipants: bnNumParticipants,
          amountCollected: new BN(0),
          status: GroupPaymentStatus.Open,
          remarks: remarks,
          timestamp: new BN(Math.floor(Date.now() / 1000)),
        },
      }

      setCreatedPayments((prev) => [...prev, newPayment])

      // Reset form and close dialog
      setRecipient("")
      setNumParticipants("")
      setAmountPerPerson("")
      setRemarks("")
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating group payment:', error)
      toast('There was an error creating the group payment. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleContributeToGroupPayment = async (payment: GroupPayment) => {
    if (!wallet.connected || !wallet.publicKey) return

    try {
      setActionLoading(payment.pubkey.toString())
      const program = getProgram(connection, wallet)

      await program.methods
        .contributeToGroupPayment(new BN(0), payment.account.amountPerPerson)
        .accounts({
          groupPayment: payment.pubkey,
          signer: wallet.publicKey,
          recipient: payment.account.recipient,
          systemProgram: PublicKey.default,
        })
        .rpc()

      toast(`You have successfully contributed ${formatSol(lamportsToSol(payment.account.amountPerPerson))} to the group payment.`)

      // Update the payment in the UI
      const updatedPayment = {
        ...payment,
        account: {
          ...payment.account,
          amountCollected: payment.account.amountCollected.add(payment.account.amountPerPerson),
        },
      }

      // If this was the last contribution needed, update the status
      if (updatedPayment.account.amountCollected.gte(updatedPayment.account.totalAmount)) {
        updatedPayment.account.status = GroupPaymentStatus.Completed
      }

      setAvailablePayments((prev) => prev.filter((p) => p.pubkey.toString() !== payment.pubkey.toString()))
    } catch (error) {
      console.error('Error contributing to group payment:', error)
      toast('There was an error contributing to the group payment. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  // Add this helper function to safely convert BN to number
  const safeToNumber = (bn: InstanceType<typeof BN>) => {
    try {
      return bn.toNumber()
    } catch (error) {
      return 0
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case GroupPaymentStatus.Open:
        return (
          <div className="flex items-center text-yellow-500">
            <Clock className="mr-1 h-4 w-4" />
            <span>Open</span>
          </div>
        )
      case GroupPaymentStatus.Completed:
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="mr-1 h-4 w-4" />
            <span>Completed</span>
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
            <CardTitle>Group Payments</CardTitle>
            <CardDescription>Connect your wallet to view and create group payments.</CardDescription>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Group Payments</CardTitle>
            <CardDescription>Create and contribute to group payments.</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group Payment</DialogTitle>
                <DialogDescription>Create a new group payment for splitting bills with friends.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroupPayment}>
                <div className="grid gap-4 py-4">
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
                    <Label htmlFor="numParticipants">Number of Participants</Label>
                    <Input
                      id="numParticipants"
                      type="number"
                      min="1"
                      placeholder="2"
                      value={numParticipants}
                      onChange={(e) => setNumParticipants(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amountPerPerson">Amount Per Person (SOL)</Label>
                    <Input
                      id="amountPerPerson"
                      type="number"
                      step="0.000000001"
                      min="0"
                      placeholder="0.0"
                      value={amountPerPerson}
                      onChange={(e) => setAmountPerPerson(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add a note about this group payment"
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
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="available">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Payments</TabsTrigger>
              <TabsTrigger value="created">Created Payments</TabsTrigger>
            </TabsList>
            <TabsContent value="available" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : availablePayments.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p className="text-muted-foreground">No available group payments found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availablePayments.map((payment) => (
                    <Card key={payment.pubkey.toString()}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Created by</p>
                            <p className="text-sm">{shortenAddress(payment.account.creator.toString(), 6)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Recipient</p>
                            <p className="text-sm">{shortenAddress(payment.account.recipient.toString(), 6)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Amount Per Person</p>
                            <p className="text-lg font-bold">
                              {formatSol(lamportsToSol(payment.account.amountPerPerson))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Progress</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  (safeToNumber(payment.account.amountCollected) /
                                    safeToNumber(payment.account.totalAmount)) *
                                  100
                                }
                                className="h-2"
                              />
                              <span className="text-xs">
                                {formatSol(lamportsToSol(payment.account.amountCollected))}/
                                {formatSol(lamportsToSol(payment.account.totalAmount))}
                              </span>
                            </div>
                          </div>
                          {payment.account.remarks && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium">Remarks</p>
                              <p className="text-sm">{payment.account.remarks}</p>
                            </div>
                          )}
                          <div className="md:col-span-2 flex justify-end">
                            <Button
                              onClick={() => handleContributeToGroupPayment(payment)}
                              disabled={actionLoading === payment.pubkey.toString()}
                            >
                              {actionLoading === payment.pubkey.toString() ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Contributing...
                                </>
                              ) : (
                                <>
                                  <Users className="mr-2 h-4 w-4" />
                                  Contribute {formatSol(lamportsToSol(payment.account.amountPerPerson))}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="created" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : createdPayments.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p className="text-muted-foreground">You haven't created any group payments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {createdPayments.map((payment) => (
                    <Card key={payment.pubkey.toString()}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Recipient</p>
                            <p className="text-sm">{shortenAddress(payment.account.recipient.toString(), 6)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            {getStatusBadge(payment.account.status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Amount</p>
                            <p className="text-lg font-bold">{formatSol(lamportsToSol(payment.account.totalAmount))}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Progress</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  (safeToNumber(payment.account.amountCollected) /
                                    safeToNumber(payment.account.totalAmount)) *
                                  100
                                }
                                className="h-2"
                              />
                              <span className="text-xs">
                                {formatSol(lamportsToSol(payment.account.amountCollected))}/
                                {formatSol(lamportsToSol(payment.account.totalAmount))}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Participants</p>
                            <p className="text-sm">{payment.account.numParticipants.toString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Amount Per Person</p>
                            <p className="text-sm">{formatSol(lamportsToSol(payment.account.amountPerPerson))}</p>
                          </div>
                          {payment.account.remarks && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium">Remarks</p>
                              <p className="text-sm">{payment.account.remarks}</p>
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
