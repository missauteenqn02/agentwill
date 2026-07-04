import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWatcherSphere } from './sphere';

const HEARTBEAT_TIMEOUT = parseInt(process.env.HEARTBEAT_TIMEOUT || '180', 10);
const PRINCIPAL_NAMETAG = process.env.PRINCIPAL_NAMETAG || 'agentwill_principal';

// Hardcoded for Vercel stateless demo
const SUCCESSORS = [
  { nametag: 'agentwill_successor1', sharePercent: 50 },
  { nametag: 'agentwill_successor2', sharePercent: 50 }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sphere = await getWatcherSphere();
    console.log(`[Watcher API] Checking principal: ${PRINCIPAL_NAMETAG}`);

    const history = await sphere.payments.getHistory({ nametag: PRINCIPAL_NAMETAG });
    const recentTx = history.find((tx: any) => tx.from === PRINCIPAL_NAMETAG || tx.sender === PRINCIPAL_NAMETAG);

    if (!recentTx || !recentTx.timestamp) {
      console.log(`[Watcher API] No recent transaction found for ${PRINCIPAL_NAMETAG}.`);
      return res.status(200).json({ status: 'ignored', reason: 'No recent transaction found' });
    }

    const txTimestamp = typeof recentTx.timestamp === 'number' ? recentTx.timestamp : new Date(recentTx.timestamp).getTime();
    const elapsedSeconds = (Date.now() - txTimestamp) / 1000;

    if (elapsedSeconds <= HEARTBEAT_TIMEOUT) {
      console.log(`[Watcher API] ${PRINCIPAL_NAMETAG} is healthy. Elapsed: ${elapsedSeconds.toFixed(1)}s / ${HEARTBEAT_TIMEOUT}s`);
      return res.status(200).json({ status: 'healthy', elapsedSeconds, timeout: HEARTBEAT_TIMEOUT });
    }

    // Timeout exceeded! Check balance to prevent double-spending
    const assets = await sphere.payments.getAssets();
    const uctAsset = assets.find((a: any) => a.coinId === 'UCT' || a.symbol === 'UCT');
    const totalBalanceStr = uctAsset?.totalAmount || uctAsset?.balance || '0';
    const totalBalance = BigInt(totalBalanceStr);

    if (totalBalance === 0n) {
      console.warn('[Watcher API] Treasury is empty. Succession already triggered or no funds.');
      return res.status(200).json({ status: 'completed', reason: 'Treasury is empty.' });
    }

    console.warn(`[Watcher API] TIMEOUT EXCEEDED! Triggering succession...`);
    const results = [];

    for (const successor of SUCCESSORS) {
      const shareAmount = (totalBalance * BigInt(Math.floor(successor.sharePercent * 100))) / 10000n;
      
      try {
        const result = await sphere.payments.send({
          recipient: successor.nametag,
          amount: shareAmount.toString(),
          coinId: 'UCT',
          memo: 'Succession triggered via Vercel'
        });
        results.push({ nametag: successor.nametag, status: result.status });

        if (sphere.communications && sphere.communications.sendDM) {
          await sphere.communications.sendDM({
            recipient: successor.nametag,
            content: `Succession triggered. You have received your share of ${PRINCIPAL_NAMETAG}'s treasury.`
          });
        }
      } catch (err: any) {
        console.error(`Failed to process successor ${successor.nametag}:`, err.message || err);
        results.push({ nametag: successor.nametag, error: err.message || 'Unknown' });
      }
    }

    return res.status(200).json({ status: 'succession_triggered', results });
  } catch (err: any) {
    console.error(`[Watcher API] Error:`, err.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Unknown error' });
  }
}
