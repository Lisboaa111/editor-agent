import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { KeyPair, keyStores, connect } from 'near-api-js';
import { parseSeedPhrase } from 'near-seed-phrase';

const app = new Hono();

const ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID;
const CONTRACT_ID = process.env.NEXT_PUBLIC_contractId;
const SEED_PHRASE = process.env.NEAR_SEED_PHRASE;
const PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY;

console.log('=== ENV ===');
console.log('ACCOUNT_ID:', ACCOUNT_ID);
console.log('CONTRACT_ID:', CONTRACT_ID);
console.log('HAS SEED:', !!SEED_PHRASE);
console.log('HAS KEY:', !!PRIVATE_KEY);

let near: any;
let accountId: string;
let nearInitialized = false;

async function initNear() {
  if (nearInitialized) return;
  
  if (!CONTRACT_ID || !ACCOUNT_ID) {
    throw new Error('Missing NEAR_ACCOUNT_ID or NEXT_PUBLIC_contractId');
  }

  let keyPair;
  if (PRIVATE_KEY) {
    console.log('Using private key...');
    keyPair = KeyPair.fromString(PRIVATE_KEY);
  } else if (SEED_PHRASE) {
    console.log('Using seed phrase...');
    const { secretKey } = parseSeedPhrase(SEED_PHRASE);
    keyPair = KeyPair.fromString(secretKey);
  } else {
    throw new Error('Missing NEAR_SEED_PHRASE or NEAR_PRIVATE_KEY');
  }

  const networkId = CONTRACT_ID.includes('testnet') ? 'testnet' : 'mainnet';
  
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(networkId, ACCOUNT_ID, keyPair);
  await keyStore.setKey(networkId, CONTRACT_ID, keyPair);

  near = await connect({
    networkId,
    keyStore,
    nodeUrl: networkId === 'testnet' ? 'https://rpc.testnet.near.org' : 'https://rpc.mainnet.near.org',
    walletUrl: networkId === 'testnet' ? 'https://testnet.mynearwallet.com/' : 'https://app.mynearwallet.com/',
  });

  accountId = ACCOUNT_ID;
  nearInitialized = true;
  console.log(`NEAR initialized for account: ${accountId}`);
}

app.get('/api/agent-account', async (c) => {
  try {
    await initNear();
    return c.json({ accountId });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get('/api/agent-info', async (c) => {
  return c.json({ 
    codehash: 'local',
    checksum: 'local-dev' 
  });
});

app.get('/api/balance', async (c) => {
  try {
    await initNear();
    const account = await near.account(accountId);
    const balance = await account.getAccountBalance();
    return c.json({ balance: balance.total });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/api/sign-transaction', async (c) => {
  return c.json({ 
    error: 'Use shade-agent-cli for signing in production' 
  }, 400);
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

const port = parseInt(process.env.PORT || '3000');
console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});
