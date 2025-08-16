import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Define localhost chain with proper configuration
export const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
} as const

// Define Monad Testnet
export const monadTestnet = {
  id: 41454,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
  testnet: true,
} as const

export const config = getDefaultConfig({
  appName: 'Omikuji Shrine on Monad',
  projectId: 'omikuji-test-project', // Simple test project ID
  chains: [localhost, monadTestnet],
  ssr: false,
})