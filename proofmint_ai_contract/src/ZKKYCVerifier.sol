// contracts/ZKKYCVerifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Groth16Verifier.sol";

contract ZKKYCVerifier is Initializable, AccessControlUpgradeable {
    Groth16Verifier public verifier;
    mapping(address => bool) public kycPassed;
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    event KYCVerified(address indexed merchant, uint256 commitment);

    error AlreadyVerified();
    error InvalidProof();
    error Unauthorized();

    function initialize(address _verifier, address admin) external initializer {
        __AccessControl_init();
        verifier = Groth16Verifier(_verifier);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    modifier onlyVerifier() {
        if (!hasRole(VERIFIER_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    function verifyKYC(
        address merchant,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256 commitment
    ) external onlyVerifier {
        if (kycPassed[merchant]) revert AlreadyVerified();
        if (!verifier.verifyProof(a, b, c, [commitment])) revert InvalidProof();
        kycPassed[merchant] = true;
        emit KYCVerified(merchant, commitment);
    }
}
