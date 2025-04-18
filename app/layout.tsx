import type React from "react"
import { Inter } from "next/font/google"

import { WalletProvider } from "@/components/wallet-provider"
import { Toaster } from "sonner"
import { SiteHeader } from "@/components/site-header"
import "@/app/globals.css"
import { ThemeProvider } from "next-themes"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Befkir - Solana Payments App",
  description: "A decentralized payment application built on Solana",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WalletProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
            </div>
            <Toaster position="top-right" richColors />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
