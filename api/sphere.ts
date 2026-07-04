import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const NETWORK = process.env.NETWORK || 'testnet';

let principalSphere: any = null;
let watcherSphere: any = null;

export async function getPrincipalSphere() {
  if (!principalSphere) {
    const nametag = process.env.PRINCIPAL_NAMETAG || 'agentwill_principal';
    const base = createNodeProviders({
      network: NETWORK as any,
      oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' },
    });

    const providers = createWalletApiProviders(base, {
      baseUrl: 'https://wallet-api.unicity.network',
      network: 'testnet2',
      deviceId: 'agentwill-principal-vercel',
    });

    const result = await Sphere.init({
      ...providers,
      network: NETWORK as any,
      autoGenerate: true,
      nametag
    });
    
    principalSphere = result.sphere;
  }
  return principalSphere;
}

export async function getWatcherSphere() {
  if (!watcherSphere) {
    const nametag = process.env.WATCHER_NAMETAG || 'agentwill_watcher';
    const base = createNodeProviders({
      network: NETWORK as any,
      oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' },
    });

    const providers = createWalletApiProviders(base, {
      baseUrl: 'https://wallet-api.unicity.network',
      network: 'testnet2',
      deviceId: 'agentwill-watcher-vercel',
    });

    const result = await Sphere.init({
      ...providers,
      network: NETWORK as any,
      autoGenerate: true,
      nametag
    });
    
    watcherSphere = result.sphere;
  }
  return watcherSphere;
}
