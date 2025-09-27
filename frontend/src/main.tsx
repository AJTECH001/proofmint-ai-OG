// src/index.tsx  
import React from "react";  
import ReactDOM from "react-dom/client";  
import App from "./App";  
import "./index.css";  

import '@rainbow-me/rainbowkit/styles.css';  
import {  
  getDefaultConfig,  
  RainbowKitProvider,  
} from '@rainbow-me/rainbowkit';  
import { WagmiProvider } from 'wagmi';  
// Removed other chain imports - using 0G network only  
import { defineChain } from 'viem'
import {  
  QueryClientProvider,  
  QueryClient,  
} from "@tanstack/react-query";  

// Define 0G testnet chain
const zgTestnet = defineChain({
  id: 16601,
  name: '0G Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'OG',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Chain Explorer',
      url: 'https://chainscan-galileo.0g.ai',
    },
  },
  testnet: true,
})

// Note: Ensure you have instantiated the queryClient since it is being used below  
const queryClient = new QueryClient();  

const config = getDefaultConfig({  
  appName: 'ProofMint 0G App',  
  projectId: 'YOUR_PROJECT_ID',  
  chains: [zgTestnet], // Only 0G testnet network
  ssr: true, // If your dApp uses server side rendering (SSR)  
});  

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);  
root.render(  
  <WagmiProvider config={config}>  
    <QueryClientProvider client={queryClient}>  
      <RainbowKitProvider>  
        <React.StrictMode>  
          <App />  
        </React.StrictMode>  
      </RainbowKitProvider>  
    </QueryClientProvider>  
  </WagmiProvider>  
);