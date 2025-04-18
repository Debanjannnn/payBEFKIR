
# payBEFKIR 💸  
**Secure and Inclusive Payment dApp on Solana**

**payBEFKIR** is a decentralized app built with Anchor on Solana that simplifies and secures SOL payments using usernames, escrow-like transfers, and group contributions—no more sending to wrong wallet addresses!

> 🏆 Grant Submission for [Solana Foundation x CoinDCX Instagrant Program]  
> Focus: Developer Tooling | Mobile | Cause-Driven Building

---

## ✨ Features
- 🔐 **Username-Based Transfers** – Link human-readable names to wallets.
- 🔁 **Refundable Payments** – Escrow-like protection with refund options.
- 👥 **Group Payments** – Pool SOL for bills or crowdfunding.
- 📡 **Event Emission** – For real-time transaction tracking.
- ⚡ **Powered by Solana** – Fast (65K TPS), low-cost ($0.00025/txn).
- 📱 **Mobile App (WIP)** – Android app with Okto wallet integration.

---

## 📖 Overview  
payBEFKIR tackles wallet mistakes—often causing billions in losses—by replacing public keys with usernames and PDA-based holding. Aiming to serve India’s 60M+ crypto users and onboard 10K+ users to Solana.

---

## 🛠️ Installation

### Prerequisites
- [Rust](https://rustup.rs/) (`v1.65+`)
- [Solana CLI](https://docs.solana.com/cli/install) (`v1.18+`)
- [Anchor](https://book.anchor-lang.com/)  
  ```bash
  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
  avm install latest && avm use latest
  ```
- Node.js (`v16+`) & Yarn (for frontend)

### Setup
```bash
git clone https://github.com/Debanjannnn/payBEFKIR.git
cd payBEFKIR
cargo build-sbf
```
For frontend (if available):
```bash
cd app
yarn install
```

### Configure Devnet
```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
anchor build
anchor deploy
```

> 📝 Update `Anchor.toml` with your wallet path & deployed program ID.

---

## 🚀 Usage

### Key Instructions
```js
// Register username
await program.methods.registerUsername("friend123").rpc();

// Send funds (escrow)
await program.methods.sendToAddress(pubkey, new anchor.BN(amount)).rpc();

// Claim/Refund transfers
await program.methods.claimTransfer().rpc();
await program.methods.refundTransfer().rpc();

// Group payments
await program.methods.createGroupPayment(...).rpc();
await program.methods.contributeToGroupPayment(...).rpc();
```

### Run Tests
```bash
anchor test
```

---

## 📁 Project Structure

```
payBEFKIR/
├── programs/         # Anchor program (lib.rs)
├── tests/            # Test scripts (payBEFKIR.ts)
├── app/              # React Native frontend (WIP)
├── migrations/       # Deployment scripts
├── Anchor.toml       # Config file
└── Cargo.toml        # Rust dependencies
```

---

## 🤝 Contributing

1. **Fork:**  
   `git fork https://github.com/Debanjannnn/payBEFKIR.git`
2. **Branch:**  
   `git checkout -b feature/your-feature`
3. **Code + Test:**  
   Add your changes and run `anchor test`.
4. **PR:**  
   Push and open a pull request with a clear description.

> Follow the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

---

## 📜 License  
MIT License – see [LICENSE](./LICENSE)

---

## 🌟 Acknowledgements
- **Solana Foundation** & **CoinDCX Instagrant**
- **Anchor Framework**
- **Okto Wallet** (integration planned)
- **Solana Dev Community**

---

## 📧 Contact  
Maintainer: [Debanjan (@Debanjannnn)](https://github.com/Debanjannnn)  
X (Twitter): *Coming Soon*

---

Let’s make Solana payments safe, seamless, and inclusive with **payBEFKIR**! 🚀

---
