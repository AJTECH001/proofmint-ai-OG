// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/Groth16Verifier.sol";
import "../src/ZKKYCVerifier.sol";
import "../src/ProofMintToken.sol";
import "../src/PaymentEscrow.sol";
import "../src/ProofMint.sol";

contract DeployProofMint is Script {
    address public admin = 0xa4280dd3f9E1f6Bf1778837AC12447615E1d0317;

    function run() external {
        vm.startBroadcast();

        // Deploy Groth16Verifier
        Groth16Verifier groth16Verifier = new Groth16Verifier();
        console.log("Groth16Verifier deployed at:", address(groth16Verifier));

        // Deploy ZKKYCVerifier
        ZKKYCVerifier zkkycVerifier = new ZKKYCVerifier();
        zkkycVerifier.initialize(address(groth16Verifier), admin);
        console.log("ZKKYCVerifier deployed at:", address(zkkycVerifier));

        // Deploy ProofMintToken
        ProofMintToken proofMintToken = new ProofMintToken(1000000 * 10 ** 18); // 1M tokens
        console.log("ProofMintToken deployed at:", address(proofMintToken));

        // Deploy ProofMint (UUPS proxy)
        ProofMint proofMint = new ProofMint();
        proofMint.initialize(admin, address(zkkycVerifier), address(proofMintToken));
        console.log("ProofMint deployed at:", address(proofMint));

        // Deploy PaymentEscrow
        PaymentEscrow paymentEscrow = new PaymentEscrow();
        paymentEscrow.initialize(address(proofMint));
        console.log("PaymentEscrow deployed at:", address(paymentEscrow));

        // Transfer tokens to ProofMint for recycling rewards
        proofMintToken.transfer(address(proofMint), 1000 * 10 ** 18);

        vm.stopBroadcast();
    }
}
