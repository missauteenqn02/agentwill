import { getPrincipalSphere } from './sphere';

export async function sendHeartbeat() {
  try {
    const sphere = await getPrincipalSphere();
    const nametag = sphere.identity?.nametag || process.env.PRINCIPAL_NAMETAG || 'agentwill_principal';

    console.log(`[Principal] Sending heartbeat transaction to ${nametag}...`);
    
    const result = await sphere.payments.send({
      recipient: nametag,
      amount: '1', // 1 micro-unit of UCT
      coinId: 'UCT',
      memo: 'heartbeat'
    });
    
    console.log(`[Principal] Heartbeat sent! Status: ${result.status}`);
  } catch (err: any) {
    console.error(`[Principal] Error sending heartbeat:`, err.message || err);
    console.log(`[Principal] Note: If error is insufficient balance, please use a script to self-mint UCT first on testnet.`);
  }
}
