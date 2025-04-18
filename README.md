payBEFKIR - Secure and Inclusive Payment dApp on Solana

Secure SOL payments with usernames, refunds, and group contributions.
Welcome to payBEFKIR, a decentralized application (dApp) built on the Solana blockchain using the Anchor framework. Befikr simplifies and secures SOL payments by addressing the common issue of sending funds to wrong wallet addresses. With human-readable usernames, escrow-like transfer protection, and group payment features, Befikr makes crypto accessible and safe for everyone, especially targeting India’s 60 million crypto users.
This project is part of a grant application for the Solana Foundation & CoinDCX Instagrant Program, focusing on Developer Tooling, Mobile, and Cause-driven Building.
✨ Features
Username Registration: Link a unique username to your Solana public key for easy identification.
Secure Transfers: Send SOL with an escrow-like mechanism, allowing refunds for unclaimed transfers.
Group Payments: Create payment pools for bill splitting or crowdfunding, with automatic disbursement.
Event Transparency: Emit events for all actions (e.g., TransferInitiated, GroupPaymentCompleted) for tracking.
Solana-Powered: Leverage Solana’s low fees ($0.00025) and high throughput (65,000 TPS).
Mobile App (In Progress): Upcoming Android app with Okto wallet integration for seamless payments.
📖 Overview
Befikr tackles the costly problem of wrong wallet address losses, estimated to contribute to $250 billion in lost crypto Chainalysis, 2021. By using usernames instead of 44-character public keys and a PDA-based holding mechanism, Befikr ensures users can send SOL safely and recover funds if mistakes occur. Designed for India’s growing crypto market, Befikr aims to onboard 10,000 users and drive Solana adoption.
🛠️ Installation
Prerequisites
Rust: Install Rust using rustup (version 1.65+ recommended).
Solana CLI: Install the Solana CLI tools (version 1.18+ recommended).
bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
Anchor: Install Anchor for Solana smart contract development.
bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
Node.js: For frontend development (optional, Node.js v16+).
Yarn: For managing frontend dependencies (optional).
Setup
Clone the Repository:
bash
git clone https://github.com/Debanjannnn/payBEFKIR.git
cd payBEFKIR
Install Dependencies:
For the smart contract:
bash
cargo build-sbf
For the frontend (if applicable):
bash
cd app
yarn install
Configure Solana Network:
Set the Solana CLI to Devnet for testing:
bash
solana config set --url https://api.devnet.solana.com
Ensure you have a Solana wallet with some SOL for testing:
bash
solana airdrop 2
Build the Smart Contract:
bash
anchor build
Deploy to Devnet:
bash
anchor deploy
Note: Update the Anchor.toml file with your wallet path and program ID after deployment.
🚀 Usage
Smart Contract Instructions
The Befikr smart contract includes the following instructions:
register_username: Register a username linked to your Solana public key.
Example:
javascript
await program.methods.registerUsername("friend123").rpc();
send_to_address: Send SOL to a recipient, holding funds in a PDA.
Example:
javascript
await program.methods.sendToAddress(recipientPubkey, new anchor.BN(amount)).rpc();
claim_transfer: Claim a pending transfer as the recipient.
refund_transfer: Refund an unclaimed transfer as the sender.
create_group_payment: Create a group payment pool with a target amount.
contribute_to_group_payment: Contribute SOL to a group payment pool.
Testing
Run the test suite to verify the smart contract functionality:
bash
anchor test
Frontend (In Development)
The mobile app frontend will allow users to:
Register usernames.
Send SOL using usernames.
Manage group payments.
Track transactions via events.
Stay tuned for frontend updates in the app/ directory!
📁 Project Structure
payBEFKIR/
├── programs/               # Smart contract source code
│   └── payBEFKIR/          # Anchor program
│       └── src/
│           └── lib.rs      # Main program logic
├── tests/                  # Test suite for smart contract
│   └── payBEFKIR.ts        # Test scripts
├── app/                    # Mobile app frontend (in development)
│   └── src/                # React Native source code (coming soon)
├── migrations/             # Deployment scripts
├── Anchor.toml             # Anchor configuration
├── Cargo.toml              # Rust dependencies
└── README.md               # Project documentation
🤝 Contributing
We welcome contributions to make Befikr even better! To contribute:
Fork the Repository:
bash
git fork https://github.com/Debanjannnn/payBEFKIR.git
Create a Branch:
bash
git checkout -b feature/your-feature-name
Make Changes:
Add new features, fix bugs, or improve documentation.
Ensure tests pass with anchor test.
Submit a Pull Request:
Push your changes and create a PR with a clear description.
Follow the Contributor Covenant Code of Conduct.
Issues
Found a bug or have a feature request? Open an issue here.
📜 License
This project is licensed under the MIT License. See the LICENSE file for details.
🌟 Acknowledgements
Solana Foundation & CoinDCX: For supporting innovative Web3 projects through the Instagrant Program.
Anchor: For providing a robust framework for Solana smart contract development.
Okto: For wallet integration support (planned).
Solana Community: For resources, tutorials, and inspiration.
📧 Contact
Maintainer: Debanjan (@Debanjannnn)
X: Follow us on X for updates! (Link coming soon)
Let’s make Solana payments safe and inclusive with Befikr! 💸
