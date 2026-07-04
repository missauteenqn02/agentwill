# AgentWill (Vercel Serverless Edition)

AgentWill is a "digital will" for autonomous agents built on the Unicity Testnet v2 using the `@unicitylabs/sphere-sdk`. 

This repository has been structured specifically for deployment on **Vercel** using Serverless Functions and Cron Jobs.

## Architecture

To comply with Vercel's stateless serverless constraints, the project uses two independent API endpoints invoked periodically by Vercel Cron:

1. **Heartbeat Trigger (`/api/heartbeat`)**: 
   - Invoked every minute by Vercel Cron.
   - Bootstraps the Sphere SDK as the `principal-agent` and sends a 1 micro-UCT transaction to itself on the Unicity network.

2. **Stateless Watcher (`/api/watcher`)**:
   - Invoked every minute by Vercel Cron.
   - Bootstraps the Sphere SDK as the `watcher-agent`.
   - **Agentic Logic**: It fetches the principal's transaction history directly from the Unicity network. It calculates the elapsed time since the principal's last heartbeat transaction. 
   - If the time exceeds `HEARTBEAT_TIMEOUT` (e.g. 180s) and the watcher's treasury has an available balance, it automatically divides the funds according to the hardcoded plan and executes the transfers to the successors.
   - If the treasury is empty, it understands that succession has already occurred, preventing double-spending without needing a database.

## Proof of No Human-in-the-Loop
- **Triggering**: Both the heartbeat and watcher run completely autonomously on a schedule defined in `vercel.json`.
- **Stateless Validation**: The watcher does not rely on manual input or local databases. It derives the "proof of life" directly from cryptographic, on-chain transaction timestamps. 
- **Automatic Execution**: If a timeout is detected, the API automatically generates, signs, and broadcasts the transactions to transfer the treasury, followed by DMs.

## Deployment on Vercel

1. Push this repository to your GitHub account.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. In the Environment Variables section, add the following:
   - `NETWORK`: `testnet`
   - `PRINCIPAL_NAMETAG`: `agentwill_principal`
   - `WATCHER_NAMETAG`: `agentwill_watcher`
   - `HEARTBEAT_TIMEOUT`: `180` (Must be at least 120-180 seconds due to Vercel's 1-minute cron minimum limit).
5. Click **Deploy**.

*Note: For the testnet, ensure that both agents (particularly the Watcher, acting as the treasury) have sufficient UCT balances to execute transactions. You can use the Unicity SDK to self-mint UCT on testnet if needed.*

## Local Testing

You can test the serverless functions locally using the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Then, simulate the cron jobs by navigating to:
- `http://localhost:3000/api/heartbeat`
- `http://localhost:3000/api/watcher`
