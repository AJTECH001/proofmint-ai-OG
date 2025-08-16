// contracts/ProofMint.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./libs/ReceiptCodec.sol";
import "./interfaces/IProofMint.sol";
import "./ZKKYCVerifier.sol";
import "./Groth16Verifier.sol";

contract ProofMint is IProofMint, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");

    // External components
    address public kycVerifier; // ZKKYCVerifier
    Groth16Verifier public verifier; // (reserved hook; not used in flow)
    IERC20 public rewardToken;

    // NFC binding (off-chain challenge/response recommended)
    mapping(address => bytes32) public nfcKeyHashByBuyer;

    struct ReceiptData {
        address merchant;
        address buyer;
        bytes ipfsCID; // full CID bytes (CIDv1 bytes)
        bytes32 productType; // e.g., keccak256("PHONE")
        address recycledBy; // who recycled (0x0 if not)
        uint64 recycledAt; // timestamp (0 if not)
        ReceiptCodec.Packed packed; // amount/timestamp/flags
    }

    // Storage
    mapping(uint256 => ReceiptData) private _receipts;
    mapping(address => uint256[]) private _merchantReceipts;
    mapping(address => uint256[]) private _buyerReceipts;
    mapping(address => uint256[]) private _recyclerReceipts;

    // prevent duplicate CID per (buyer, merchant)
    mapping(address => mapping(address => mapping(bytes32 => bool))) private _usedIpfsCIDs;

    uint256 public nextReceiptId;

    // Errors
    error Unauthorized();
    error KYCNotVerified();
    error OnlyMerchant();
    error AlreadyPaid();
    error AlreadyRecycled();
    error InsufficientTokenBalance();
    error DuplicateReceipt();
    error ZeroAddress();
    error InvalidReceipt();
    error NotPaid();

    // Initializer
    function initialize(address admin, address _kycVerifier, address _rewardToken) external initializer {
        if (admin == address(0) || _kycVerifier == address(0) || _rewardToken == address(0)) {
            revert ZeroAddress();
        }
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        kycVerifier = _kycVerifier;
        rewardToken = IERC20(_rewardToken);

        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    // --- Admin & Roles ---

    function addMerchant(address merchant) external onlyRole(ADMIN_ROLE) {
        if (!ZKKYCVerifier(kycVerifier).kycPassed(merchant)) revert KYCNotVerified();
        _grantRole(MERCHANT_ROLE, merchant);
        emit MerchantAdded(merchant);
    }

    function addRecycler(address recycler) external onlyRole(ADMIN_ROLE) {
        _grantRole(RECYCLER_ROLE, recycler);
        emit RecyclerAdded(recycler);
    }

    function linkNFC(bytes calldata nfcPubKey) external whenNotPaused {
        bytes32 h = keccak256(nfcPubKey);
        nfcKeyHashByBuyer[msg.sender] = h;
        emit NFCAssociated(msg.sender, h);
    }

    // --- Issuance & Lifecycle ---

    function issueReceipt(address buyer, bytes calldata ipfsCID, bytes32 productType, uint128 amount)
        external
        whenNotPaused
        onlyRole(MERCHANT_ROLE)
        returns (uint256 id)
    {
        bytes32 cidHash = keccak256(ipfsCID);
        if (_usedIpfsCIDs[buyer][msg.sender][cidHash]) revert DuplicateReceipt();

        id = nextReceiptId++;

        _receipts[id] = ReceiptData({
            merchant: msg.sender,
            buyer: buyer,
            ipfsCID: ipfsCID,
            productType: productType,
            recycledBy: address(0),
            recycledAt: 0,
            packed: ReceiptCodec.encode(amount, uint64(block.timestamp), false)
        });

        _merchantReceipts[msg.sender].push(id);
        _buyerReceipts[buyer].push(id);
        _usedIpfsCIDs[buyer][msg.sender][cidHash] = true;

        emit ReceiptIssued(id, msg.sender, buyer, cidHash, _receipts[id].packed);

        // Optional, if you want indexers to ingest the full string form:
        // Try-catch to avoid revert if bytes aren't valid UTF-8/base32
        // This is purely illustrative; you can remove if not needed.
        // emit ReceiptCID(id, string(ipfsCID));
    }

    function markPaid(uint256 receiptId) external whenNotPaused {
        ReceiptData storage r = _receipts[receiptId];
        if (r.merchant == address(0)) revert InvalidReceipt();
        if (r.merchant != msg.sender) revert OnlyMerchant();

        (,, bool paid) = ReceiptCodec.decode(r.packed);
        if (paid) revert AlreadyPaid();

        r.packed.flags |= 1; // set bit0 = paid
        emit PaymentStatusChanged(receiptId, true);
    }

    function markRecycled(uint256 receiptId) external whenNotPaused onlyRole(RECYCLER_ROLE) {
        ReceiptData storage r = _receipts[receiptId];
        if (r.merchant == address(0)) revert InvalidReceipt();

        (,, bool paid) = ReceiptCodec.decode(r.packed);
        if (!paid) revert NotPaid();
        if (r.recycledBy != address(0)) revert AlreadyRecycled();

        r.recycledBy = msg.sender;
        r.recycledAt = uint64(block.timestamp);
        r.packed.flags |= 2; // set bit1 = recycled

        // Example: fixed reward (adjust as needed or make configurable)
        uint256 rewardAmount = 10 * 10 ** 18;
        if (rewardToken.balanceOf(address(this)) < rewardAmount) revert InsufficientTokenBalance();
        rewardToken.safeTransfer(r.buyer, rewardAmount);

        _recyclerReceipts[msg.sender].push(receiptId);

        emit RecyclingReward(r.buyer, receiptId, rewardAmount);
        emit ReceiptRecycled(receiptId, msg.sender, r.recycledAt);
    }

    // --- Views & Access Control Helpers ---

    function _canView(address caller, ReceiptData storage r) internal view returns (bool) {
        if (caller == r.buyer) return true;
        if (caller == r.merchant) return true;
        if (r.recycledBy != address(0) && caller == r.recycledBy) return true;
        if (hasRole(ADMIN_ROLE, caller)) return true;
        return false;
    }

    function getReceipt(uint256 id)
        public
        view
        returns (
            address merchant,
            address buyer,
            bytes memory ipfsCID,
            bytes32 productType,
            address recycledBy,
            uint64 recycledAt,
            ReceiptCodec.Packed memory packed
        )
    {
        ReceiptData storage r = _receipts[id];
        if (r.merchant == address(0)) revert InvalidReceipt();
        if (!_canView(msg.sender, r)) revert Unauthorized();
        return (r.merchant, r.buyer, r.ipfsCID, r.productType, r.recycledBy, r.recycledAt, r.packed);
    }

    function receiptsByMerchant(address merchantAddr) external view returns (uint256[] memory) {
        if (msg.sender != merchantAddr && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        return _merchantReceipts[merchantAddr];
    }

    function receiptsByBuyer(address buyerAddr) external view returns (uint256[] memory) {
        if (msg.sender != buyerAddr && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        return _buyerReceipts[buyerAddr];
    }

    function receiptsByRecycler(address recyclerAddr) external view returns (uint256[] memory) {
        if (msg.sender != recyclerAddr && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        return _recyclerReceipts[recyclerAddr];
    }

    // Escrow helpers
    function buyerOf(uint256 id) external view returns (address) {
        ReceiptData storage r = _receipts[id];
        if (r.merchant == address(0)) revert InvalidReceipt();
        return r.buyer;
    }

    function merchantOf(uint256 id) external view returns (address) {
        ReceiptData storage r = _receipts[id];
        if (r.merchant == address(0)) revert InvalidReceipt();
        return r.merchant;
    }

    function isPaid(uint256 id) external view returns (bool) {
        ReceiptData storage r = _receipts[id];
        if (r.merchant == address(0)) revert InvalidReceipt();
        (,, bool paid) = ReceiptCodec.decode(r.packed);
        return paid;
    }

    // Admin scanning helper (paginate across all receipt IDs)
    function adminAllReceipts(uint256 start, uint256 max)
        external
        view
        onlyRole(ADMIN_ROLE)
        returns (uint256[] memory ids)
    {
        uint256 endExclusive = nextReceiptId;
        if (start >= endExclusive) return new uint256[](0);

        uint256 last = start + max;
        if (last > endExclusive) last = endExclusive;

        uint256 n = last - start;
        ids = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) {
            ids[i] = start + i;
        }
    }

    // UUPS authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
