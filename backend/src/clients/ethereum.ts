import { JsonRpcProvider } from 'ethers';

const { ETH_RPC_URL } = process.env;

if (!ETH_RPC_URL) {
  // eslint-disable-next-line no-console
  console.warn('ETH_RPC_URL is not set. Ethereum tracing will fallback to mock data.');
}

export const ethereumProvider = ETH_RPC_URL ? new JsonRpcProvider(ETH_RPC_URL) : undefined;
