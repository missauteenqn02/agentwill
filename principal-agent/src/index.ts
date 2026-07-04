import { sendHeartbeat } from './heartbeat';
import { getPrincipalSphere } from './sphere';

const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '20000', 10);
const STOP_AFTER = parseInt(process.env.TESTING_OVERRIDE_STOP_AFTER || '0', 10);

async function start() {
  console.log('[Principal] Starting AgentWill Principal...');
  
  // Ensure initialized
  await getPrincipalSphere();

  let count = 0;

  // Send first heartbeat immediately
  await sendHeartbeat();
  count++;

  if (STOP_AFTER > 0 && count >= STOP_AFTER) {
    console.warn(`[Principal] Testing Override: Stopping heartbeat after ${count} sent.`);
    process.exit(0);
  }

  const interval = setInterval(async () => {
    try {
      await sendHeartbeat();
      count++;
      
      if (STOP_AFTER > 0 && count >= STOP_AFTER) {
        console.warn(`[Principal] Testing Override: Stopping heartbeat after ${count} sent.`);
        clearInterval(interval);
        process.exit(0);
      }
    } catch (err) {
      console.error('[Principal] Error in heartbeat loop:', err);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

start().catch(err => {
  console.error('[Principal] Fatal error during startup:', err);
  process.exit(1);
});
