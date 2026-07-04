import { loadPlans, savePlans, SuccessionPlan } from './planStore';
import { getWatcherSphere } from './sphere';

export async function checkHeartbeats() {
  const sphere = await getWatcherSphere();
  const plans = loadPlans();
  let plansChanged = false;

  for (const plan of plans) {
    if (plan.status !== 'active') continue;

    console.log(`[Watcher] Checking principal: ${plan.principalNametag}`);

    try {
      // 1. Fetch latest transactions of the principal
      // As per prompt, we use sphere.payments.getHistory() to check heartbeat
      const history = await sphere.payments.getHistory({ nametag: plan.principalNametag });
      
      // Find the most recent transaction where the principal is the sender
      const recentTx = history.find((tx: any) => tx.from === plan.principalNametag || tx.sender === plan.principalNametag);
      
      if (recentTx && recentTx.timestamp) {
        const txTimestamp = typeof recentTx.timestamp === 'number' ? recentTx.timestamp : new Date(recentTx.timestamp).getTime();
        if (txTimestamp > plan.lastHeartbeatTimestamp) {
          plan.lastHeartbeatTimestamp = txTimestamp;
          plansChanged = true;
          console.log(`[Watcher] Heartbeat detected for ${plan.principalNametag} at ${new Date(txTimestamp).toISOString()}`);
        }
      }

      // 2. Check if timeout is exceeded
      const now = Date.now();
      const elapsedSeconds = (now - plan.lastHeartbeatTimestamp) / 1000;

      if (elapsedSeconds > plan.heartbeatTimeoutSeconds) {
        console.warn(`[Watcher] TIMEOUT EXCEEDED for ${plan.principalNametag}! Triggering succession...`);
        await triggerSuccession(plan, sphere);
        plan.status = 'completed';
        plansChanged = true;
      } else {
        console.log(`[Watcher] ${plan.principalNametag} is healthy. Elapsed: ${elapsedSeconds.toFixed(1)}s / ${plan.heartbeatTimeoutSeconds}s`);
      }

    } catch (err) {
      console.error(`[Watcher] Error checking ${plan.principalNametag}:`, err);
    }
  }

  if (plansChanged) {
    savePlans(plans);
  }
}

async function triggerSuccession(plan: SuccessionPlan, sphere: any) {
  try {
    // The watcher acts as the executor. We assume it holds the escrowed treasury or has authority.
    const assets = await sphere.payments.getAssets();
    const uctAsset = assets.find((a: any) => a.coinId === 'UCT' || a.symbol === 'UCT');
    
    if (!uctAsset) {
      console.error('[Watcher] No UCT balance available to distribute.');
      return;
    }

    const totalBalanceStr = uctAsset.totalAmount || uctAsset.balance || '0';
    const totalBalance = BigInt(totalBalanceStr);
    
    console.log(`[Watcher] Treasury balance: ${totalBalance.toString()} UCT`);

    if (totalBalance === 0n) {
      console.warn('[Watcher] Treasury is empty. Succession completed without transfers.');
      return;
    }

    for (const successor of plan.successors) {
      // Calculate share
      const shareAmount = (totalBalance * BigInt(Math.floor(successor.sharePercent * 100))) / 10000n;
      
      console.log(`[Watcher] Sending ${shareAmount.toString()} UCT to ${successor.nametag} (${successor.sharePercent}%)`);
      
      try {
        const result = await sphere.payments.send({
          recipient: successor.nametag,
          amount: shareAmount.toString(),
          coinId: 'UCT',
          memo: 'Succession triggered'
        });
        console.log(`[Watcher] Payment to ${successor.nametag} status:`, result.status);
      } catch (sendErr) {
        console.error(`[Watcher] Failed to send to ${successor.nametag}:`, sendErr);
      }

      // Send DM
      try {
        if (sphere.communications && sphere.communications.sendDM) {
          await sphere.communications.sendDM({
            recipient: successor.nametag, 
            content: `Succession triggered. You have received your share of ${plan.principalNametag}'s treasury.`
          });
        }
      } catch (dmErr) {
        console.error(`[Watcher] Failed to send DM to ${successor.nametag}:`, dmErr);
      }
    }
  } catch (err) {
    console.error(`[Watcher] Error in triggerSuccession:`, err);
  }
}
