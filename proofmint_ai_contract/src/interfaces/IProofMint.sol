// contracts/interfaces/IProofMint.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../libs/ReceiptCodec.sol";

interface IProofMint {
    // Events
    event ReceiptIssued(
        uint256 indexed id, address indexed merchant, address indexed buyer, bytes32 cidHash, ReceiptCodec.Packed packed
    );

    /// @notice Optional convenience event with the full CID (useful for indexers)
    event ReceiptCID(uint256 indexed id, string cidV1);

    event PaymentStatusChanged(uint256 indexed id, bool paid);
    event RecyclingReward(address indexed buyer, uint256 indexed receiptId, uint256 amount);
    event MerchantAdded(address indexed merchant);
    event RecyclerAdded(address indexed recycler);
    event NFCAssociated(address indexed buyer, bytes32 keyHash);
    event ReceiptRecycled(uint256 indexed id, address indexed recycler, uint64 recycledAt);

    // Issuance & lifecycle
    function issueReceipt(address buyer, bytes calldata ipfsCID, bytes32 productType, uint128 amount)
        external
        returns (uint256 id);

    function markPaid(uint256 receiptId) external;

    function markRecycled(uint256 receiptId) external;

    // Role-gated views
    function getReceipt(uint256 id)
        external
        view
        returns (
            address merchant,
            address buyer,
            bytes memory ipfsCID,
            bytes32 productType,
            address recycledBy,
            uint64 recycledAt,
            ReceiptCodec.Packed memory packed
        );

    function receiptsByMerchant(address merchant) external view returns (uint256[] memory);
    function receiptsByBuyer(address buyer) external view returns (uint256[] memory);
    function receiptsByRecycler(address recycler) external view returns (uint256[] memory);

    // Escrow helpers
    function buyerOf(uint256 id) external view returns (address);
    function merchantOf(uint256 id) external view returns (address);
    function isPaid(uint256 id) external view returns (bool);

    // Admin helpers
    function adminAllReceipts(uint256 start, uint256 max) external view returns (uint256[] memory);
}
