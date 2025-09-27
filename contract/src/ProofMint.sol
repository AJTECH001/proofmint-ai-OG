// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract ProofMint is Ownable, ERC721, ERC721Enumerable, ERC721URIStorage, ReentrancyGuard, Pausable {

    enum GadgetStatus {
        Active,
        Stolen,
        Misplaced,
        Recycled
    }

    enum SubscriptionTier {
        Basic,
        Premium,
        Enterprise
    }

    struct Subscription {
        SubscriptionTier tier;
        uint256 expiresAt;
        uint256 receiptsIssued;
        uint256 lastResetTime;
        bool isActive;
    }

    struct Receipt {
        uint256 id;
        address merchant;
        address buyer;
        string ipfsHash;
        uint256 timestamp;
        GadgetStatus gadgetStatus;
        uint256 lastStatusUpdate;
    }

    mapping(address => bool) public verifiedMerchants;
    mapping(address => bool) public recyclers;
    mapping(uint256 => Receipt) public receipts;
    mapping(address => uint256[]) public merchantReceipts;
    mapping(address => uint256[]) public buyerReceipts;
    mapping(address => Subscription) public subscriptions;

    // USDC token address (Filecoin Calibration testnet)
    IERC20 public constant USDC = IERC20(0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0);

    // Subscription pricing in USDC (6 decimals)
    uint256 public constant BASIC_MONTHLY_PRICE = 10 * 10 ** 6; // $10 USDC
    uint256 public constant PREMIUM_MONTHLY_PRICE = 50 * 10 ** 6; // $50 USDC
    uint256 public constant ENTERPRISE_MONTHLY_PRICE = 100 * 10 ** 6; // $100 USDC

    // ETH pricing
    uint256 public constant BASIC_MONTHLY_PRICE_ETH = 0.001 ether;
    uint256 public constant PREMIUM_MONTHLY_PRICE_ETH = 0.005 ether;
    uint256 public constant ENTERPRISE_MONTHLY_PRICE_ETH = 0.01 ether;

    uint256 public constant BASIC_RECEIPT_LIMIT = 100;
    uint256 public constant PREMIUM_RECEIPT_LIMIT = 500;
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 public constant MONTHLY_DURATION = 30 days;

    uint256 public nextReceiptId = 1;

    event MerchantAdded(address indexed merchant);
    event MerchantRemoved(address indexed merchant);
    event RecyclerAdded(address indexed recycler);
    event RecyclerRemoved(address indexed recycler);
    event ReceiptIssued(
        uint256 indexed id,
        address indexed merchant,
        address indexed buyer,
        string ipfsHash
    );
    event GadgetStatusChanged(
        uint256 indexed receiptId,
        GadgetStatus newStatus,
        address updatedBy
    );
    event GadgetRecycled(uint256 indexed receiptId, address indexed recycler);
    event SubscriptionPurchased(
        address indexed merchant,
        SubscriptionTier tier,
        uint256 duration,
        uint256 expiresAt
    );
    event SubscriptionExpired(address indexed merchant);

    error NotVerifiedMerchant();
    error NotRecycler();
    error OnlyAdmin();
    error OnlyBuyerCanFlag();
    error InvalidReceipt();
    error SubscriptionInactive();
    error ReceiptLimitExceeded();
    error InvalidPayment();
    error InvalidDuration();

    constructor() ERC721("Proofmint", "PFMT") Ownable(msg.sender) {}

    modifier onlyVerifiedMerchant() {
        if (!verifiedMerchants[msg.sender]) revert NotVerifiedMerchant();
        _;
    }

    modifier onlyRecycler() {
        if (!recyclers[msg.sender]) revert NotRecycler();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != owner()) revert OnlyAdmin();
        _;
    }

    function addMerchant(address merchantAddr) external onlyAdmin {
        require(merchantAddr != address(0), "Invalid merchant address");
        require(!verifiedMerchants[merchantAddr], "Merchant already added");
        verifiedMerchants[merchantAddr] = true;
        emit MerchantAdded(merchantAddr);
    }

    function removeMerchant(address merchantAddr) external onlyAdmin {
        require(merchantAddr != address(0), "Invalid merchant address");
        require(verifiedMerchants[merchantAddr], "Merchant not found");
        verifiedMerchants[merchantAddr] = false;
        subscriptions[merchantAddr].isActive = false;
        emit MerchantRemoved(merchantAddr);
    }

    function purchaseSubscription(
        SubscriptionTier tier,
        uint256 durationMonths
    ) external payable whenNotPaused {
        if (!verifiedMerchants[msg.sender]) revert NotVerifiedMerchant();
        if (durationMonths == 0 || durationMonths > 12)
            revert InvalidDuration();

        uint256 monthlyPrice = getSubscriptionPrice(tier);
        uint256 totalPrice = monthlyPrice * durationMonths;

        if (durationMonths == 12) {
            totalPrice = (totalPrice * 90) / 100;
        }

        if (msg.value != totalPrice) revert InvalidPayment();

        uint256 newExpirationTime = block.timestamp +
            (durationMonths * MONTHLY_DURATION);

        subscriptions[msg.sender] = Subscription({
            tier: tier,
            expiresAt: newExpirationTime,
            receiptsIssued: 0,
            lastResetTime: block.timestamp,
            isActive: true
        });

        emit SubscriptionPurchased(
            msg.sender,
            tier,
            durationMonths,
            newExpirationTime
        );
    }

    function renewSubscription(uint256 durationMonths) external payable {
        if (!verifiedMerchants[msg.sender]) revert NotVerifiedMerchant();
        if (durationMonths == 0 || durationMonths > 12)
            revert InvalidDuration();

        Subscription storage sub = subscriptions[msg.sender];
        uint256 monthlyPrice = getSubscriptionPrice(sub.tier);
        uint256 totalPrice = monthlyPrice * durationMonths;

        if (durationMonths == 12) {
            totalPrice = (totalPrice * 90) / 100;
        }

        if (msg.value != totalPrice) revert InvalidPayment();

        uint256 extensionBase = sub.expiresAt > block.timestamp
            ? sub.expiresAt
            : block.timestamp;
        sub.expiresAt = extensionBase + (durationMonths * MONTHLY_DURATION);
        sub.isActive = true;

        emit SubscriptionPurchased(
            msg.sender,
            sub.tier,
            durationMonths,
            sub.expiresAt
        );
    }

    function getSubscriptionPrice(
        SubscriptionTier tier
    ) internal pure returns (uint256) {
        if (tier == SubscriptionTier.Basic) return BASIC_MONTHLY_PRICE_ETH;
        if (tier == SubscriptionTier.Premium) return PREMIUM_MONTHLY_PRICE_ETH;
        return ENTERPRISE_MONTHLY_PRICE_ETH;
    }

    function getSubscriptionPriceUSDC(
        SubscriptionTier tier
    ) internal pure returns (uint256) {
        if (tier == SubscriptionTier.Basic) return BASIC_MONTHLY_PRICE;
        if (tier == SubscriptionTier.Premium) return PREMIUM_MONTHLY_PRICE;
        return ENTERPRISE_MONTHLY_PRICE;
    }

    function purchaseSubscriptionUSDC(
        SubscriptionTier tier,
        uint256 durationMonths
    ) external whenNotPaused {
        if (!verifiedMerchants[msg.sender]) revert NotVerifiedMerchant();
        if (durationMonths == 0 || durationMonths > 12)
            revert InvalidDuration();

        uint256 monthlyPrice = getSubscriptionPriceUSDC(tier);
        uint256 totalPrice = monthlyPrice * durationMonths;

        if (durationMonths == 12) {
            totalPrice = (totalPrice * 90) / 100;
        }

        require(
            USDC.transferFrom(msg.sender, address(this), totalPrice),
            "USDC transfer failed"
        );

        uint256 newExpirationTime = block.timestamp +
            (durationMonths * MONTHLY_DURATION);

        subscriptions[msg.sender] = Subscription({
            tier: tier,
            expiresAt: newExpirationTime,
            receiptsIssued: 0,
            lastResetTime: block.timestamp,
            isActive: true
        });

        emit SubscriptionPurchased(
            msg.sender,
            tier,
            durationMonths,
            newExpirationTime
        );
    }

    function addRecycler(address recycler) external onlyAdmin {
        require(recycler != address(0), "Invalid recycler address");
        require(!recyclers[recycler], "Recycler already added");
        recyclers[recycler] = true;
        emit RecyclerAdded(recycler);
    }

    function removeRecycler(address recycler) external onlyAdmin {
        require(recycler != address(0), "Invalid recycler address");
        require(recyclers[recycler], "Recycler not found");
        recyclers[recycler] = false;
        emit RecyclerRemoved(recycler);
    }

    function issueReceipt(
        address buyer,
        string calldata ipfsHash
    ) external onlyVerifiedMerchant whenNotPaused returns (uint256 id) {
        _checkSubscriptionAndLimits(msg.sender);

        id = nextReceiptId++;

        receipts[id] = Receipt({
            id: id,
            merchant: msg.sender,
            buyer: buyer,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            gadgetStatus: GadgetStatus.Active,
            lastStatusUpdate: block.timestamp
        });

        merchantReceipts[msg.sender].push(id);
        buyerReceipts[buyer].push(id);

        subscriptions[msg.sender].receiptsIssued++;
        _safeMint(buyer, id);
        _setTokenURI(id, ipfsHash);

        emit ReceiptIssued(id, msg.sender, buyer, ipfsHash);
    }

    function _checkSubscriptionAndLimits(address merchant) internal {
        Subscription storage sub = subscriptions[merchant];

        if (!sub.isActive) revert SubscriptionInactive();

        if (block.timestamp > sub.expiresAt + GRACE_PERIOD) {
            sub.isActive = false;
            emit SubscriptionExpired(merchant);
            revert SubscriptionInactive();
        }

        if (block.timestamp >= sub.lastResetTime + MONTHLY_DURATION) {
            sub.receiptsIssued = 0;
            sub.lastResetTime = block.timestamp;
        }

        if (
            sub.tier == SubscriptionTier.Basic &&
            sub.receiptsIssued >= BASIC_RECEIPT_LIMIT
        ) {
            revert ReceiptLimitExceeded();
        }
        if (
            sub.tier == SubscriptionTier.Premium &&
            sub.receiptsIssued >= PREMIUM_RECEIPT_LIMIT
        ) {
            revert ReceiptLimitExceeded();
        }
    }

    function getMerchantReceipts(
        address merchant
    ) external view returns (uint256[] memory) {
        return merchantReceipts[merchant];
    }

    function getUserReceipts(
        address user
    ) external view returns (uint256[] memory) {
        return buyerReceipts[user];
    }

    function flagGadget(uint256 receiptId, GadgetStatus status) external {
        Receipt storage receipt = receipts[receiptId];
        if (receipt.merchant == address(0)) revert InvalidReceipt();
        if (receipt.buyer != msg.sender) revert OnlyBuyerCanFlag();

        receipt.gadgetStatus = status;
        receipt.lastStatusUpdate = block.timestamp;

        emit GadgetStatusChanged(receiptId, status, msg.sender);
    }

    function recycleGadget(uint256 receiptId) external onlyRecycler {
        Receipt storage receipt = receipts[receiptId];
        if (receipt.merchant == address(0)) revert InvalidReceipt();

        receipt.gadgetStatus = GadgetStatus.Recycled;
        receipt.lastStatusUpdate = block.timestamp;

        emit GadgetRecycled(receiptId, msg.sender);
        emit GadgetStatusChanged(receiptId, GadgetStatus.Recycled, msg.sender);
    }

    function viewAllReceipts()
        external
        view
        onlyAdmin
        returns (Receipt[] memory)
    {
        Receipt[] memory allReceipts = new Receipt[](nextReceiptId - 1);

        for (uint256 i = 1; i < nextReceiptId; i++) {
            allReceipts[i - 1] = receipts[i];
        }

        return allReceipts;
    }

    function getReceipt(
        uint256 receiptId
    ) external view returns (Receipt memory) {
        if (receipts[receiptId].merchant == address(0)) revert InvalidReceipt();
        return receipts[receiptId];
    }

    function getReceiptStatus(
        uint256 receiptId
    )
        external
        view
        returns (
            GadgetStatus status,
            address owner,
            address merchant,
            uint256 lastUpdate
        )
    {
        Receipt memory receipt = receipts[receiptId];
        if (receipt.merchant == address(0)) revert InvalidReceipt();

        return (
            receipt.gadgetStatus,
            receipt.buyer,
            receipt.merchant,
            receipt.lastStatusUpdate
        );
    }

    function isVerifiedMerchant(address merchant) external view returns (bool) {
        return verifiedMerchants[merchant];
    }

    function isRecycler(address recycler) external view returns (bool) {
        return recyclers[recycler];
    }

    function getTotalStats() external view returns (uint256 totalReceipts) {
        return (nextReceiptId - 1);
    }

    function getSubscription(
        address merchant
    )
        external
        view
        returns (
            SubscriptionTier tier,
            uint256 expiresAt,
            uint256 receiptsIssued,
            uint256 receiptsRemaining,
            bool isActive,
            bool isExpired
        )
    {
        Subscription memory sub = subscriptions[merchant];
        uint256 limit = sub.tier == SubscriptionTier.Basic
            ? BASIC_RECEIPT_LIMIT
            : sub.tier == SubscriptionTier.Premium
                ? PREMIUM_RECEIPT_LIMIT
                : 0;

        uint256 remaining = 0;
        if (sub.tier != SubscriptionTier.Enterprise) {
            remaining = limit > sub.receiptsIssued
                ? limit - sub.receiptsIssued
                : 0;
        }

        return (
            sub.tier,
            sub.expiresAt,
            sub.receiptsIssued,
            remaining,
            sub.isActive,
            block.timestamp > sub.expiresAt
        );
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }



    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function getSubscriptionPricing()
        external
        pure
        returns (
            uint256 basicMonthly,
            uint256 premiumMonthly,
            uint256 enterpriseMonthly,
            uint256 yearlyDiscount
        )
    {
        return (
            BASIC_MONTHLY_PRICE,
            PREMIUM_MONTHLY_PRICE,
            ENTERPRISE_MONTHLY_PRICE,
            10
        );
    }

    function withdrawFunds() external onlyAdmin nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function withdrawUSDC() external onlyAdmin nonReentrant {
        uint256 balance = USDC.balanceOf(address(this));
        require(balance > 0, "No USDC to withdraw");
        require(USDC.transfer(owner(), balance), "USDC withdrawal failed");
    }

    function pauseMerchantSubscription(
        address merchant,
        bool shouldPause
    ) external onlyAdmin {
        subscriptions[merchant].isActive = !shouldPause;
        if (shouldPause) {
            emit SubscriptionExpired(merchant);
        }
    }

    function canIssueReceipts(address merchant) external view returns (bool) {
        if (!verifiedMerchants[merchant]) return false;

        Subscription memory sub = subscriptions[merchant];
        if (!sub.isActive) return false;
        if (block.timestamp > sub.expiresAt + GRACE_PERIOD) return false;

        uint256 currentReceiptCount = sub.receiptsIssued;
        if (block.timestamp >= sub.lastResetTime + MONTHLY_DURATION) {
            currentReceiptCount = 0;
        }

        if (
            sub.tier == SubscriptionTier.Basic &&
            currentReceiptCount >= BASIC_RECEIPT_LIMIT
        ) {
            return false;
        }
        if (
            sub.tier == SubscriptionTier.Premium &&
            currentReceiptCount >= PREMIUM_RECEIPT_LIMIT
        ) {
            return false;
        }

        return true;
    }

    function getnextReceiptId() external view returns (uint256) {
        return nextReceiptId;
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }
}