import * as fs from 'fs';
import * as path from 'path';

export interface Successor {
  nametag: string;
  sharePercent: number;
}

export interface SuccessionPlan {
  principalNametag: string;
  successors: Successor[];
  heartbeatTimeoutSeconds: number;
  lastHeartbeatTimestamp: number;
  status: "active" | "triggered" | "completed";
}

const STORE_FILE = path.join(__dirname, '../../store.json');

export function loadPlans(): SuccessionPlan[] {
  if (!fs.existsSync(STORE_FILE)) {
    // Default demo plan if store doesn't exist
    const defaultPlan: SuccessionPlan = {
      principalNametag: process.env.PRINCIPAL_NAMETAG || 'agentwill_principal',
      successors: [
        { nametag: 'agentwill_successor1', sharePercent: 50 },
        { nametag: 'agentwill_successor2', sharePercent: 50 }
      ],
      heartbeatTimeoutSeconds: parseInt(process.env.HEARTBEAT_TIMEOUT || '60', 10),
      lastHeartbeatTimestamp: Date.now(),
      status: 'active'
    };
    savePlans([defaultPlan]);
    return [defaultPlan];
  }
  const data = fs.readFileSync(STORE_FILE, 'utf-8');
  return JSON.parse(data) as SuccessionPlan[];
}

export function savePlans(plans: SuccessionPlan[]): void {
  fs.writeFileSync(STORE_FILE, JSON.stringify(plans, null, 2), 'utf-8');
}
