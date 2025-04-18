"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Send, Users, RefreshCw, UserCircle } from "lucide-react"

export default function Home() {
  const { connected } = useWallet()

  return (
    <main className="container py-10">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="flex max-w-[980px] flex-col items-start gap-2">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1]">
            Befkir: Decentralized Payments <br className="hidden sm:inline" />
            Built on Solana
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Send, receive, and manage payments with ease. Create group payments and split bills with friends.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {!connected ? (
            <WalletMultiButton className="wallet-adapter-button-trigger" />
          ) : (
            <>
              <Link href="/send">
                <Button size="lg">
                  Send Payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="lg">
                  Set Up Profile
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {connected &&
        (
          <section className="space-y-6 py-8 md:py-12 lg:py-16">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Send Payment</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Send SOL to any Solana address with optional remarks.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/send" className="w-full">
                  <Button className="w-full">Send</Button>
                </Link>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Group Payments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage group payments for splitting bills.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/group-payments" className="w-full">
                  <Button className="w-full">Group Payments</Button>
                </Link>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transfers</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage your pending, claimed, and refunded transfers.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/transfers" className="w-full">
                  <Button className="w-full">Transfers</Button>
                </Link>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile</CardTitle>
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Register a username and manage your profile settings.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/profile" className="w-full">
                  <Button className="w-full">Profile</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
        )}
    </main>
  )
}
