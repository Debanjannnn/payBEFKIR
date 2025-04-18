"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { getProgram, findUserProfilePDA, MAX_USERNAME_LEN } from "@/lib/program"
import { PublicKey } from "@solana/web3.js"

export default function ProfilePage() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!wallet.connected || !wallet.publicKey) return

      try {
        setIsLoading(true)
        const program = getProgram(connection, wallet)
        const [userProfilePDA] = await findUserProfilePDA(wallet.publicKey)

        try {
          const userProfile = await program.account.userProfile.fetch(userProfilePDA)
          setCurrentUsername(userProfile.username as string)
        } catch (error) {
          // User profile doesn't exist yet
          setCurrentUsername(null)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [wallet.connected, wallet.publicKey, connection])

  const handleRegisterUsername = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!wallet.connected || !wallet.publicKey) {
      toast('Please connect your wallet to register a username.')
      return
    }

    if (!username) {
      toast('Please enter a username.')
      return
    }

    if (username.length > MAX_USERNAME_LEN) {
      toast(`Username must be ${MAX_USERNAME_LEN} characters or less.`)
      return
    }

    try {
      setLoading(true)
      const program = getProgram(connection, wallet)
      const [userProfilePDA] = await findUserProfilePDA(wallet.publicKey)

      await program.methods
        .registerUsername(username)
        .accounts({
          userProfile: userProfilePDA,
          signer: wallet.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc()

      toast(`Your username "${username}" has been registered successfully.`)

      setCurrentUsername(username)
      setUsername("")
    } catch (error) {
      console.error("Error registering username:", error)
      toast("There was an error registering your username. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!wallet.connected) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Connect your wallet to manage your profile.</CardDescription>
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
          <CardTitle>Profile</CardTitle>
          <CardDescription>Register or update your username.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <p>Loading profile...</p>
            </div>
          ) : (
            <>
              {currentUsername && (
                <div className="mb-6 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">Current Username</p>
                  <p className="text-xl font-bold">{currentUsername}</p>
                </div>
              )}
              <form onSubmit={handleRegisterUsername}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">{currentUsername ? "New Username" : "Username"}</Label>
                    <Input
                      id="username"
                      placeholder="Enter a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={MAX_USERNAME_LEN}
                    />
                    <p
                      className={`text-xs ${username.length > MAX_USERNAME_LEN ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {username.length}/{MAX_USERNAME_LEN} characters
                    </p>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Registering..." : currentUsername ? "Update Username" : "Register Username"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
