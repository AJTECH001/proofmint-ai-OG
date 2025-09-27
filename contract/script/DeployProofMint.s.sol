// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/ProofMint.sol";

contract DeployProofMint is Script {
    address public admin = 0xa4280dd3f9E1f6Bf1778837AC12447615E1d0317;

    function run() external {
        vm.startBroadcast();

        // Deploy ProofMint contract
        ProofMint proofMint = new ProofMint();
        console.log("ProofMint deployed at:", address(proofMint));

        // Add initial merchants (optional)
        address[] memory initialMerchants = new address[](1);
        initialMerchants[0] = 0xDF68A7B0AC3F44dA6cabaEfcA8B93f17de3A8a86; // Example merchant
        
        for (uint256 i = 0; i < initialMerchants.length; i++) {
            proofMint.addMerchant(initialMerchants[i]);
            console.log("Added merchant:", initialMerchants[i]);
        }

        // Add initial recyclers (optional)
        address[] memory initialRecyclers = new address[](1);
        initialRecyclers[0] = 0x587077F3dccABCdbd64D0f4Cb484075F097DF53a; // Example recycler
        
        for (uint256 i = 0; i < initialRecyclers.length; i++) {
            proofMint.addRecycler(initialRecyclers[i]);
            console.log("Added recycler:", initialRecyclers[i]);
        }

        vm.stopBroadcast();
    }
}
