import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const WATCHER_NAMETAG = process.env.WATCHER_NAMETAG || 'agentwill_watcher';
const NETWORK = process.env.NETWORK || 'testnet';

let sphereInstance: any = null;

export async function getWatcherSphere() {
  if (!sphereInstance) {
    const base = createNodeProviders({
      network: NETWORK as any,
      oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' },
    });

    const providers = createWalletApiProviders(base, {
      baseUrl: 'https://wallet-api.unicity.network',
      network: NETWORK as any,
      deviceId: 'agentwill-watcher-device-1',
    });

    const result = await Sphere.init({
      ...providers,
      autoGenerate: true,
      nametag: WATCHER_NAMETAG
    });
    
    sphereInstance = result.sphere;

    if (result.created && result.generatedMnemonic) {
      console.log(`[Watcher] Created new wallet. Mnemonic: ${result.generatedMnemonic}`);
      console.log(`[Watcher] Please ensure this wallet has UCT to distribute to successors!`);
    } else {
      console.log(`[Watcher] Logged in as: ${WATCHER_NAMETAG}`);
    }
  }
  return sphereInstance;
}
