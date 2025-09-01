# ProofMint AI - Smart Contracts

## Overview

The `smartcontract` folder contains the core Solidity contracts for ProofMint AI, a decentralized receipts-as-a-service platform for the 0G WaveHack. Deployed on 0G Chain Testnet (Chain ID 16601), these contracts address the $500B e-waste crisis by enabling tamper-proof receipt issuance, secure payments, and recycling rewards. This README details the deployed contracts, their roles, and future integration plans.

## Mission

To facilitate a transparent, AI-enhanced ecosystem for sustainable commerce, these contracts leverage 0G’s infrastructure to issue verifiable receipts, ensuring trust and incentivizing recycling on a global scale.

## Problem Solved

These contracts tackle e-waste fraud (only 22.3% of 62M tonnes recycled annually) and payment disputes by providing immutable, blockchain-based receipts and trustless escrow, overcoming traditional scalability limits with 0G’s AI-ready chain.

## Contracts Overview

### 1. Groth16Verifier (`0xdEDeBDB00a83a0bD09b414Ea5FD876dB40799529`)
- **Purpose:** A placeholder contract for zero-knowledge proof verification, supporting KYC compliance in `ZKKYCVerifier`.
- **Functionality:** Validates proofs (e.g., merchant identity) using a mock Groth16 implementation, extensible for future ZK upgrades.
- **Deployment Hash:** `0x65e6cf9866e7847a17a1e3c48a2c6000edc50fd16f1a34d4a774ea40ce2df02c`
- **Gas Paid:** 0.000014696263187844 ETH (638148 gas * 0.023029553 gwei)

### 2. ZKKYCVerifier (`0xEEe28Afd5077a0Add3D1C59f85B8eaEE49816127`)
- **Purpose:** Ensures merchant KYC compliance with privacy-preserving zero-knowledge proofs.
- **Functionality:** Calls `Groth16Verifier` to validate proofs, restricting receipt issuance to verified merchants.
- **Constructor Args:** `groth16Verifier` (0x0000000000000000000000000000000000000001), `admin` (0xYourAdminAddress).
- **Deployment Hash:** `0xa08f800729f8eaf157f5869e0ec339aabb59f298b96bf621c472ab4b90a8f39e`
- **Gas Paid:** 0.000014088536313727 ETH (611759 gas * 0.023029553 gwei)

### 3. ProofMintToken (`0xe4DD90EfcD4B520f07444ad90f7208eDc7813CC6`)
- **Purpose:** An ERC20 token (PMT) for rewarding recycling and staking.
- **Functionality:** Mints 1M tokens (1000000 * 10^18) to the deployer, enabling reward distribution.
- **Deployment Hash:** `0x9894c084032c6ae56c6aca456c66f62ccecd75a59f8c04a328da25823ad17a7f`
- **Gas Paid:** 0.000014008187474886 ETH (562647 gas * 0.024896938 gwei)

### 4. ProofMint (`0x045962833e855095DbE8B061d0e7E929a3f5C55c`)
- **Purpose:** The main contract for receipt issuance and lifecycle management.
- **Functionality:** Issues NFTs for receipts, integrates with `ZKKYCVerifier` for merchant validation, and links to `ProofMintToken` for rewards. Emits events for off-chain storage (e.g., CID storage planned).
- **Constructor Args:** `admin` (0xYourAdminAddress), `kycVerifier` (0xEEe28Afd5077a0Add3D1C59f85B8eaEE49816127), `rewardToken` (0xe4DD90EfcD4B520f07444ad90f7208eDc7813CC6).
- **Deployment Hash:** `0x8fb42ea3d7ce6c5a5febc8744e1c37a0995453696dc5ee0b89e5c81fff7d132d`
- **Gas Paid:** 0.000059057260269024 ETH (2293752 gas * 0.025747012 gwei)

### 5. PaymentEscrow (`0xdf08928EB624d3c058a769F4Af16d8b398DF1027`)
- **Purpose:** Manages trustless payment escrow between buyers and merchants.
- **Functionality:** Holds funds until AI-verified conditions (e.g., recycling proof) are met, releasing payments via `ProofMint` authorization.
- **Constructor Arg:** `proofMint` (0x045962833e855095DbE8B061d0e7E929a3f5C55c).
- **Deployment Hash:** `0xb3c228fb0723503f6977431d8d605236a84f013128012c0239bfe97b7c470acc`
- **Gas Paid:** 0.000014249452068292 ETH (553441 gas * 0.025747012 gwei)

## Process Overview
- **Verification:** Contracts are being verified on [0G Chain Scan](https://explorer-testnet.0g.ai/verify) with Solidity 0.8.30 and Cancun EVM, including library addresses if applicable (e.g., OpenZeppelin).

## Key Features and Innovation
- **Immutable Receipts:** `ProofMint` issues NFTs, ensuring ownership proof.
- **Privacy Compliance:** `ZKKYCVerifier` enforces secure merchant onboarding.
- **Reward System:** `ProofMintToken` incentivizes recycling.
- **Trustless Payments:** `PaymentEscrow` ensures fair transactions.
- **AI Readiness:** Foundation for future AI-driven verification.

## Technology Stack
- **0G Chain:** Deployed with 2,500 TPS, low fees (0.000126643318473839 ETH total), and 1-2 second finality.
- **Solidity:** 0.8.30 with Cancun EVM compatibility.
- **Foundry:** Used for efficient deployment and testing.



## License
MIT License - Open for community contribution.

