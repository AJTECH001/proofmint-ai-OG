// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/ProofMint.sol";

contract ProofMintDATest is Test {
    ProofMint public proofMint;
    address public admin;
    address public merchant;
    address public buyer;

    event DACommitmentLinked(
        uint256 indexed receiptId,
        string daCommitment,
        string storageRootHash,
        uint256 timestamp
    );

    event DACommitmentUpdated(
        uint256 indexed receiptId,
        string newCommitment,
        uint256 timestamp
    );

    function setUp() public {
        admin = address(this);
        merchant = address(0x1);
        buyer = address(0x2);

        proofMint = new ProofMint();
        
        // Setup merchant
        proofMint.addMerchant(merchant);
        
        // Purchase subscription for merchant
        vm.deal(merchant, 1 ether);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: 0.001 ether}(
            ProofMint.SubscriptionTier.Basic,
            1
        );
    }

    function testIssueReceiptAndLinkDA() public {
        // Issue receipt
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Link DA commitment
        string memory daCommitment = "0x1234567890abcdef";
        string memory storageHash = "0xabcdef1234567890";

        vm.expectEmit(true, false, false, true);
        emit DACommitmentLinked(receiptId, daCommitment, storageHash, block.timestamp);

        vm.prank(merchant);
        proofMint.linkDACommitment(receiptId, daCommitment, storageHash);

        // Verify DA info
        (string memory retrievedCommitment, string memory retrievedStorageHash, bool hasBackup) = 
            proofMint.getReceiptDAInfo(receiptId);

        assertEq(retrievedCommitment, daCommitment, "DA commitment mismatch");
        assertEq(retrievedStorageHash, storageHash, "Storage hash mismatch");
        assertTrue(hasBackup, "Should have DA backup");
        assertTrue(proofMint.hasDABackup(receiptId), "hasDABackup should return true");
    }

    function testUpdateDACommitment() public {
        // Issue receipt and link initial DA
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.linkDACommitment(receiptId, "0xold", "0xoldstorage");

        // Update DA commitment
        string memory newCommitment = "0xnewcommitment";
        
        vm.expectEmit(true, false, false, true);
        emit DACommitmentUpdated(receiptId, newCommitment, block.timestamp);

        vm.prank(merchant);
        proofMint.updateDACommitment(receiptId, newCommitment);

        // Verify updated commitment
        (string memory retrievedCommitment, , bool hasBackup) = 
            proofMint.getReceiptDAInfo(receiptId);

        assertEq(retrievedCommitment, newCommitment, "Updated commitment mismatch");
        assertTrue(hasBackup, "Should still have DA backup");
    }

    function testOnlyMerchantOrAdminCanLinkDA() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Try to link as buyer (should fail)
        vm.prank(buyer);
        vm.expectRevert("Only merchant or admin can link DA commitment");
        proofMint.linkDACommitment(receiptId, "0xcommitment", "0xstorage");

        // Merchant can link
        vm.prank(merchant);
        proofMint.linkDACommitment(receiptId, "0xcommitment", "0xstorage");

        // Admin can also link/update
        vm.prank(admin);
        proofMint.updateDACommitment(receiptId, "0xnewcommitment");
    }

    function testGetMerchantReceiptsWithDA() public {
        // Issue 3 receipts
        vm.startPrank(merchant);
        uint256 receipt1 = proofMint.issueReceipt(buyer, "ipfs://1");
        proofMint.issueReceipt(buyer, "ipfs://2"); // receipt2 - no DA link
        uint256 receipt3 = proofMint.issueReceipt(buyer, "ipfs://3");

        // Link DA to receipt 1 and 3 only
        proofMint.linkDACommitment(receipt1, "0xcommitment1", "0xstorage1");
        proofMint.linkDACommitment(receipt3, "0xcommitment3", "0xstorage3");
        vm.stopPrank();

        // Get receipts with DA
        uint256[] memory receiptsWithDA = proofMint.getMerchantReceiptsWithDA(merchant);

        assertEq(receiptsWithDA.length, 2, "Should have 2 receipts with DA");
        assertEq(receiptsWithDA[0], receipt1, "First receipt should be receipt1");
        assertEq(receiptsWithDA[1], receipt3, "Second receipt should be receipt3");
    }

    function testReceiptWithoutDABackup() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Check DA info before linking
        (string memory commitment, string memory storageHash, bool hasBackup) = 
            proofMint.getReceiptDAInfo(receiptId);

        assertEq(commitment, "", "Commitment should be empty");
        assertEq(storageHash, "", "Storage should be empty");
        assertFalse(hasBackup, "Should not have DA backup");
        assertFalse(proofMint.hasDABackup(receiptId), "hasDABackup should return false");
    }

    function testRevertOnInvalidReceiptId() public {
        vm.expectRevert(ProofMint.InvalidReceipt.selector);
        proofMint.getReceiptDAInfo(999);

        vm.expectRevert(ProofMint.InvalidReceipt.selector);
        proofMint.hasDABackup(999);
    }
}

