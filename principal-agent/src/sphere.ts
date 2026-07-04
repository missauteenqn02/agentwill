import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PRINCIPAL_NAMETAG = process.env.PRINCIPAL_NAMETAG || 'agentwill_principal';
const NETWORK = process.env.NETWORK || 'testnet';

let sphereInstance: any = null;

export async function getPrincipalSphere() {
  if (!sphereInstance) {
    const base = createNodeProviders({
      network: NETWORK as any,
      oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' },
    });

    const providers = createWalletApiProviders(base, {
      baseUrl: 'https://wallet-api.unicity.network',
      network: NETWORK as any,
      deviceId: 'agentwill-principal-device-1',
    });

    const result = await Sphere.init({
      ...providers,
      autoGenerate: true,
      nametag: PRINCIPAL_NAMETAG
    });
    
    sphereInstance = result.sphere;

    if (result.created && result.generatedMnemonic) {
      console.log(`[Principal] Created new wallet. Mnemonic: ${result.generatedMnemonic}`);
      console.log(`[Principal] Note: Heartbeats require test UCT. Please mint UCT if needed.`);
    } else {
      console.log(`[Principal] Logged in as: ${PRINCIPAL_NAMETAG}`);
    }
  }
  return sphereInstance;
}
