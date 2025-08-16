// contracts/ProofMintToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ProofMintToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("ProofMintToken", "PMT") {
        _mint(msg.sender, initialSupply);
    }
}
