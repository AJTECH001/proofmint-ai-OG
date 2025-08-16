// contracts/PaymentEscrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IProofMint.sol";

contract PaymentEscrow is Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IProofMint public proofMint;

    struct Escrow {
        IERC20 token;
        uint256 amount;
    }

    mapping(uint256 => Escrow) public escrows; // receiptId => Escrow

    event Deposited(uint256 indexed receiptId, address indexed buyer, IERC20 token, uint256 amount);
    event Released(uint256 indexed receiptId, address indexed merchant, IERC20 token, uint256 amount);
    event Initialized(address proofMintAddress);

    error Unauthorized();
    error InvalidReceipt(); // reserved
    error NothingToRelease();
    error NotPaid();

    function initialize(address _proofMint) external initializer {
        proofMint = IProofMint(_proofMint);
        emit Initialized(_proofMint);
    }

    /// @notice Buyer deposits ERC-20 tokens into escrow for a specific receipt.
    function deposit(uint256 receiptId, IERC20 token, uint256 amount) external nonReentrant {
        address buyer = proofMint.buyerOf(receiptId);
        if (msg.sender != buyer) revert Unauthorized();

        Escrow storage e = escrows[receiptId];

        if (address(e.token) == address(0)) {
            e.token = token; // first deposit defines token
        } else if (address(e.token) != address(token)) {
            revert("TokenMismatch");
        }

        e.amount += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(receiptId, buyer, token, amount);
    }

    /// @notice Merchant pulls funds after receipt is marked as paid.
    function release(uint256 receiptId) external nonReentrant {
        address merchant = proofMint.merchantOf(receiptId);
        if (msg.sender != merchant) revert Unauthorized();
        if (!proofMint.isPaid(receiptId)) revert NotPaid();

        Escrow storage e = escrows[receiptId];
        uint256 amount = e.amount;
        if (amount == 0) revert NothingToRelease();

        e.amount = 0;
        e.token.safeTransfer(merchant, amount);

        emit Released(receiptId, merchant, e.token, amount);
    }
}
