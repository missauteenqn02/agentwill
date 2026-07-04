import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrincipalSphere } from './sphere';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sphere = await getPrincipalSphere();
    const nametag = sphere.identity?.nametag || process.env.PRINCIPAL_NAMETAG || 'agentwill_principal';

    console.log(`[Principal API] Sending heartbeat to ${nametag}...`);
    
    const result = await sphere.payments.send({
      recipient: nametag,
      amount: '1',
      coinId: 'UCT',
      memo: 'heartbeat via Vercel'
    });
    
    console.log(`[Principal API] Heartbeat sent! Status: ${result.status}`);
    return res.status(200).json({ success: true, status: result.status });
  } catch (err: any) {
    console.error(`[Principal API] Error sending heartbeat:`, err.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Unknown error' });
  }
}
