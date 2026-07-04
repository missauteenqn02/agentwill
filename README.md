# AgentWill

AgentWill is a "digital will" for autonomous agents built on the Unicity Testnet v2 using the `@unicitylabs/sphere-sdk`. 

It consists of two independent processes:
1. **Principal Agent (`principal-agent`)**: The agent that performs its tasks and periodically sends a "heartbeat" transaction to itself to prove it is alive.
2. **Succession Watcher (`succession-watcher`)**: An independent monitoring agent that watches the principal's heartbeat. If the principal goes offline for a configured duration, the watcher automatically transfers the principal's treasury to a predefined list of successors according to a strict percentage split.

## Proof of No Human-in-the-Loop
AgentWill operates entirely autonomously.
- **Heartbeat Generation**: The Principal Agent runs a background loop (`setInterval` in `principal-agent/src/index.ts`) that automatically sends a tiny Unicity token (UCT) transaction on-chain as a heartbeat proof.
- **Succession Triggering**: The Succession Watcher (`succession-watcher/src/watcher.ts`) runs an independent polling loop. It checks the principal's transaction history using `sphere.payments.getHistory()`. If the delta between `Date.now()` and the last heartbeat timestamp exceeds the configured timeout, it **automatically** calculates the shares, sends the payments (`sphere.payments.send()`), and dispatches DMs (`sphere.communications.sendDM()`) to the successors.
- **No Manual Triggers**: There is absolutely no CLI command, API endpoint, or UI button in the Watcher to force a succession. The `triggerSuccession()` function is only ever called internally by the watcher loop when a genuine timeout is detected.

> **Note on Timeout Values:** The default `HEARTBEAT_TIMEOUT` in the `.env` file is set to `60` seconds for **demo purposes** so that reviewers do not have to wait a long time to verify the succession logic. In a real production system, this value would typically be configured in hours or days (e.g., `86400` for 24 hours).

## Project Setup

### Prerequisites
- Node.js >= 22.0.0
- A Unicity Testnet v2 wallet with UCT for testing. You can self-mint test UCT on Testnet using the SDK if your wallet is empty.

### Installation

1. Copy `.env.example` to `.env` in the root `AgentWill` directory.
```bash
cp .env.example .env
```

2. Install dependencies for both projects:
```bash
cd principal-agent
npm install
cd ../succession-watcher
npm install
```

## Running the Demo

The demo demonstrates the automatic triggering of a succession plan with 2 successors splitting the treasury 50/50.

1. **Start the Watcher:**
   Open a terminal, navigate to `succession-watcher`, and run the watcher:
   ```bash
   cd succession-watcher
   npx ts-node src/index.ts
   ```
   The watcher will initialize its wallet and start monitoring `agentwill_principal`. *Note: Ensure the Watcher's wallet has UCT to distribute, as the demo uses the Watcher's balance to simulate the escrowed treasury.*

2. **Start the Principal Agent:**
   Open a second terminal, navigate to `principal-agent`, and run the principal:
   ```bash
   cd principal-agent
   npx ts-node src/index.ts
   ```
   The principal agent will initialize and start sending a heartbeat transaction (1 micro UCT) every 20 seconds. 

3. **Observe the Watcher:**
   In Terminal 1, you will see the watcher logging successful heartbeat detections based on the on-chain transactions.

4. **Simulate Agent Death (Testing Override):**
   By default, `.env` configures `TESTING_OVERRIDE_STOP_AFTER=3`. After the principal agent sends 3 heartbeats, it will intentionally stop its process. 
   This is the **only** testing override provided to simulate the agent crashing or going offline. 
   
5. **Watch the Autonomous Succession:**
   Once the principal stops, wait for 60 seconds (the `HEARTBEAT_TIMEOUT`). In Terminal 1, the Watcher will log a `TIMEOUT EXCEEDED` warning. It will then automatically:
   - Calculate a 50% split of the available treasury.
   - Execute `sphere.payments.send()` to `agentwill_successor1`.
   - Execute `sphere.payments.send()` to `agentwill_successor2`.
   - Dispatch notifications via `sphere.communications.sendDM()` to both successors.

## Architecture & Design Decisions
- **Two Separate Processes**: Ensures that the watcher operates completely independent of the principal. If the principal crashes, the watcher remains active.
- **On-chain Heartbeats**: Using `sphere.payments.send()` for heartbeats provides an immutable, verifiable timestamp on the Unicity L3 network, preventing disputes about when the agent was last active.
- **JSON Plan Store**: For this MVP demo, the succession plans are stored in a simple JSON file (`store.json`). In production, this would be backed by SQLite or PostgreSQL.
