// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {ProofMint} from "../src/ProofMint.sol";

contract ProofMintTest is Test {
    ProofMint public proofMint;
    address public admin = makeAddr("admin");
    address public merchant = makeAddr("merchant");
    address public buyer = makeAddr("buyer");
    address public recycler = makeAddr("recycler");

    function setUp() public {
        vm.prank(admin);
        proofMint = new ProofMint();
        
        vm.prank(admin);
        proofMint.addMerchant(merchant);
        
        vm.prank(admin);
        proofMint.addRecycler(recycler);
    }

    function testAddMerchant() public {
        address newMerchant = makeAddr("newMerchant");
        
        vm.prank(admin);
        proofMint.addMerchant(newMerchant);
        
        assertTrue(proofMint.isVerifiedMerchant(newMerchant));
    }

    function testRemoveMerchant() public {
        vm.prank(admin);
        proofMint.removeMerchant(merchant);
        
        assertFalse(proofMint.isVerifiedMerchant(merchant));
    }

    function testPurchaseSubscription() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        (
            ProofMint.SubscriptionTier tier,
            uint256 expiresAt,
            uint256 receiptsIssued,
            uint256 receiptsRemaining,
            bool isActive,
            bool isExpired
        ) = proofMint.getSubscription(merchant);
        
        assertEq(uint8(tier), uint8(ProofMint.SubscriptionTier.Basic));
        assertTrue(isActive);
        assertFalse(isExpired);
        assertEq(receiptsIssued, 0);
    }

    function testIssueReceipt() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "QmTestHash");
        
        assertEq(receiptId, 1);
        assertEq(proofMint.ownerOf(receiptId), buyer);
        
        ProofMint.Receipt memory receipt = proofMint.getReceipt(receiptId);
        assertEq(receipt.merchant, merchant);
        assertEq(receipt.buyer, buyer);
        assertEq(receipt.ipfsHash, "QmTestHash");
        assertEq(uint8(receipt.gadgetStatus), uint8(ProofMint.GadgetStatus.Active));
    }

    function testFlagGadget() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "QmTestHash");
        
        vm.prank(buyer);
        proofMint.flagGadget(receiptId, ProofMint.GadgetStatus.Stolen);
        
        ProofMint.Receipt memory receipt = proofMint.getReceipt(receiptId);
        assertEq(uint8(receipt.gadgetStatus), uint8(ProofMint.GadgetStatus.Stolen));
    }

    function testRecycleGadget() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "QmTestHash");
        
        vm.prank(recycler);
        proofMint.recycleGadget(receiptId);
        
        ProofMint.Receipt memory receipt = proofMint.getReceipt(receiptId);
        assertEq(uint8(receipt.gadgetStatus), uint8(ProofMint.GadgetStatus.Recycled));
    }

    function testGetMerchantReceipts() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.prank(merchant);
        proofMint.issueReceipt(buyer, "QmTestHash1");
        
        vm.prank(merchant);
        proofMint.issueReceipt(buyer, "QmTestHash2");
        
        uint256[] memory receipts = proofMint.getMerchantReceipts(merchant);
        assertEq(receipts.length, 2);
        assertEq(receipts[0], 1);
        assertEq(receipts[1], 2);
    }

    function testGetUserReceipts() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.prank(merchant);
        proofMint.issueReceipt(buyer, "QmTestHash1");
        
        vm.prank(merchant);
        proofMint.issueReceipt(buyer, "QmTestHash2");
        
        uint256[] memory receipts = proofMint.getUserReceipts(buyer);
        assertEq(receipts.length, 2);
        assertEq(receipts[0], 1);
        assertEq(receipts[1], 2);
    }

    function testSubscriptionLimits() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.startPrank(merchant);
        for (uint256 i = 0; i < proofMint.BASIC_RECEIPT_LIMIT(); i++) {
            proofMint.issueReceipt(buyer, string(abi.encodePacked("QmTestHash", i)));
        }
        
        vm.expectRevert(ProofMint.ReceiptLimitExceeded.selector);
        proofMint.issueReceipt(buyer, "QmTestHashExtra");
        vm.stopPrank();
    }

    function testWithdrawFunds() public {
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        uint256 balanceBefore = admin.balance;
        
        vm.prank(admin);
        proofMint.withdrawFunds();
        
        uint256 balanceAfter = admin.balance;
        assertEq(balanceAfter - balanceBefore, price);
    }

    function testCanIssueReceipts() public {
        assertFalse(proofMint.canIssueReceipts(merchant));
        
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        
        vm.deal(merchant, price);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        assertTrue(proofMint.canIssueReceipts(merchant));
    }

    function testPauseAndUnpause() public {
        vm.prank(admin);
        proofMint.pause();
        
        uint256 price = proofMint.BASIC_MONTHLY_PRICE_ETH();
        vm.deal(merchant, price);
        
        vm.expectRevert();
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
        
        vm.prank(admin);
        proofMint.unpause();
        
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: price}(ProofMint.SubscriptionTier.Basic, 1);
    }
}
