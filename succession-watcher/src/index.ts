import { checkHeartbeats } from './watcher';

const CHECK_INTERVAL_MS = 15000; // Check every 15 seconds

async function start() {
  console.log('[Watcher] Starting succession watcher service...');
  
  // Initial check
  await checkHeartbeats();

  // Schedule loop
  setInterval(async () => {
    try {
      await checkHeartbeats();
    } catch (err) {
      console.error('[Watcher] Error in heartbeat check loop:', err);
    }
  }, CHECK_INTERVAL_MS);
}

start().catch(err => {
  console.error('[Watcher] Fatal error during startup:', err);
  process.exit(1);
});
