import express from 'express';
import heartbeatHandler from './api/heartbeat';
import watcherHandler from './api/watcher';
import { getPrincipalSphere, getWatcherSphere } from './api/sphere';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('AgentWill is running on Render.com! Visit /api/heartbeat or /api/watcher');
});

app.get('/api/heartbeat', async (req, res) => {
  await heartbeatHandler(req as any, res as any);
});

app.get('/api/watcher', async (req, res) => {
  await watcherHandler(req as any, res as any);
});

app.listen(port, async () => {
  console.log(`[AgentWill] Server is running on port ${port}`);
  
  try {
    console.log('[AgentWill] Initializing SDKs...');
    await getPrincipalSphere();
    await getWatcherSphere();
    console.log('[AgentWill] SDKs initialized successfully.');

    // Run automatically in the background
    setInterval(async () => {
      console.log('--- Auto-triggering Heartbeat ---');
      const mockRes = { status: () => ({ json: (data: any) => console.log(data) }) };
      await heartbeatHandler(null as any, mockRes as any);
    }, 60000);

    setTimeout(() => {
      setInterval(async () => {
        console.log('--- Auto-triggering Watcher ---');
        const mockRes = { status: () => ({ json: (data: any) => console.log(data) }) };
        await watcherHandler(null as any, mockRes as any);
      }, 60000);
    }, 30000); // offset watcher by 30s
  } catch (err) {
    console.error('[AgentWill] Startup error:', err);
  }
});
