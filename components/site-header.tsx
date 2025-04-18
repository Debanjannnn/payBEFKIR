"use client"

import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const { connected } = useWallet()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">Befkir</span>
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/"
              className={cn("flex items-center text-sm font-medium text-muted-foreground", "hover:text-foreground")}
            >
              Home
            </Link>
            {connected && (
              <>
                <Link
                  href="/send"
                  className={cn("flex items-center text-sm font-medium text-muted-foreground", "hover:text-foreground")}
                >
                  Send
                </Link>
                <Link
                  href="/transfers"
                  className={cn("flex items-center text-sm font-medium text-muted-foreground", "hover:text-foreground")}
                >
                  Transfers
                </Link>
                <Link
                  href="/group-payments"
                  className={cn("flex items-center text-sm font-medium text-muted-foreground", "hover:text-foreground")}
                >
                  Group Payments
                </Link>
                <Link
                  href="/profile"
                  className={cn("flex items-center text-sm font-medium text-muted-foreground", "hover:text-foreground")}
                >
                  Profile
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            <WalletMultiButton className="wallet-adapter-button" />
          </nav>
        </div>
      </div>
    </header>
  )
}
