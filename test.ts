import { getPrincipalSphere } from './api/sphere';

async function test() {
  try {
    console.log('Testing sphere init...');
    const sphere = await getPrincipalSphere();
    console.log('Sphere init success. Nametag:', sphere.identity?.nametag);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
