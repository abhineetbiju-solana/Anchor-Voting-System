# Voting System

A decentralized polling application built on Solana. Create polls, cast votes, and view results - all on-chain.

## Overview

This project combines a Solana smart contract (written in Rust using Anchor) with a vanilla JavaScript frontend. Every poll and vote is recorded on the blockchain, ensuring transparency and immutability.

**Live on Solana Devnet** — Program ID: `9ySVZtNi4B34cq4ewXAdVS2fwJ7q2cTbRmnSBGo2BF58`

## Features

- **Create Polls** — Write a question and add multiple options
- **Vote** — Cast your vote with a single click (one vote per wallet per poll)
- **Real-time Results** — See vote counts update instantly
- **Close Polls** — Poll creators can end voting at any time
- **Wallet Integration** — Connects seamlessly with Phantom and other Solana wallets

## Tech Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Solana (Devnet) |
| Smart Contract | Rust + Anchor Framework |
| Frontend | HTML, CSS, JavaScript |
| Bundler | Vite |

## Getting Started

### Prerequisites

- Node.js 16+
- Yarn
- A Solana wallet (e.g., [Phantom](https://phantom.app/))

### Install & Run

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev
```

Open http://localhost:3000 and connect your wallet (set to Devnet).

### Build

```bash
yarn build
```

Output goes to `dist/`.

## Project Structure

```
├── app/
│   ├── index.html          # Main page
│   ├── styles.css          # Styles
│   ├── app.js              # Frontend logic
│   ├── idl/                # Contract interface (IDL)
│   └── utils/              # Helpers (wallet client, toasts)
├── programs/
│   └── voting-system/
│       └── src/lib.rs      # Solana program
├── tests/                  # Contract tests
├── Anchor.toml             # Anchor config
└── package.json
```

## How It Works

### Smart Contract

The Solana program exposes three instructions:

| Instruction | Description |
|-------------|-------------|
| `create_poll` | Creates a new poll with a question and options |
| `initialize_vote` | Records a vote for a specific option |
| `end_poll` | Closes the poll (creator only) |

Duplicate votes are prevented using a `VoterRecord` PDA (Program Derived Address) that's unique per voter-poll combination.

### Frontend

The UI fetches all polls from the blockchain, renders them as cards, and handles voting through the Anchor client. Event delegation keeps the code clean — a single listener on the poll container handles all vote and delete button clicks.

## Development

### Smart Contract

```bash
# Build
anchor build

# Deploy
anchor deploy

# Test
yarn test
```

### Get Devnet SOL

You'll need test SOL for transactions: https://faucet.solana.com/