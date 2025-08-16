// contracts/libs/ReceiptCodec.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Compact packing for receipt metadata.
/// Layout (single slot where possible):
/// - amount:    uint128
/// - timestamp: uint64
/// - flags:     uint8  (bit0 = paid, bit1 = recycled)
/// - _reserved: uint56 (future use; keeps slot aligned)
library ReceiptCodec {
    struct Packed {
        uint128 amount;
        uint64 timestamp;
        uint8 flags;
        uint56 _reserved;
    }

    function encode(uint128 amount, uint64 timestamp, bool paid) internal pure returns (Packed memory p) {
        uint8 flags = paid ? uint8(1) : uint8(0);
        p = Packed({amount: amount, timestamp: timestamp, flags: flags, _reserved: 0});
    }

    function decode(Packed memory p) internal pure returns (uint128 amount, uint64 timestamp, bool paid) {
        amount = p.amount;
        timestamp = p.timestamp;
        paid = (p.flags & 1) != 0;
    }

    function isRecycled(Packed memory p) internal pure returns (bool) {
        return (p.flags & 2) != 0;
    }
}
