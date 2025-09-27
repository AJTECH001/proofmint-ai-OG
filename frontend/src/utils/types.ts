// src/utils/types.ts
export type Role = "ADMIN_ROLE" | "MERCHANT_ROLE" | "RECYCLER_ROLE" | "DEFAULT_ADMIN_ROLE" | "";

export interface Gadget {
  id: number;
  name: string;
  price: string; // BigNumber in ethers.js, string for simplicity
  seller: string;
  sold: boolean;
}

export interface LifecycleEvent {
  eventHash: string;
  timestamp: number;
  eventType: string;
}