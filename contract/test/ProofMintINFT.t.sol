// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/ProofMint.sol";

contract ProofMintINFTTest is Test {
    ProofMint public proofMint;
    address public admin;
    address public merchant;
    address public buyer;
    address public recycler;

    event INFTTraitsInitialized(
        uint256 indexed receiptId,
        string aiAgentCID,
        uint256 recyclabilityScore,
        uint256 sustainabilityScore
    );

    event INFTTraitsUpdated(
        uint256 indexed receiptId,
        uint256 newRecyclabilityScore,
        uint256 carbonCredits,
        uint256 deviceAge
    );

    event AIAgentUpdated(
        uint256 indexed receiptId,
        string newAIAgentCID,
        uint256 timestamp
    );

    event CarbonCreditsEarned(
        uint256 indexed receiptId,
        uint256 creditsEarned,
        uint256 totalCredits
    );

    function setUp() public {
        admin = address(this);
        merchant = address(0x1);
        buyer = address(0x2);
        recycler = address(0x3);

        proofMint = new ProofMint();
        
        // Setup merchant
        proofMint.addMerchant(merchant);
        
        // Setup recycler
        proofMint.addRecycler(recycler);
        
        // Purchase subscription for merchant
        vm.deal(merchant, 1 ether);
        vm.prank(merchant);
        proofMint.purchaseSubscription{value: 0.001 ether}(
            ProofMint.SubscriptionTier.Basic,
            1
        );
    }

    function testInitializeINFTTraits() public {
        // Issue receipt
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Initialize INFT traits
        string memory aiAgentCID = "QmABCDEF1234567890";
        uint256 recyclabilityScore = 75;
        uint256 sustainabilityScore = 80;
        uint256 warrantyDays = 365;

        vm.expectEmit(true, false, false, true);
        emit INFTTraitsInitialized(receiptId, aiAgentCID, recyclabilityScore, sustainabilityScore);

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, aiAgentCID, recyclabilityScore, sustainabilityScore, warrantyDays);

        // Verify traits
        (
            string memory returnedCID,
            uint256 returnedRecyclability,
            uint256 carbonCredits,
            uint256 returnedSustainability,
            uint256 deviceAge,
            uint256 warrantyLeft,
            bool isEligible
        ) = proofMint.getINFTTraits(receiptId);

        assertEq(returnedCID, aiAgentCID, "AI Agent CID mismatch");
        assertEq(returnedRecyclability, recyclabilityScore, "Recyclability score mismatch");
        assertEq(returnedSustainability, sustainabilityScore, "Sustainability score mismatch");
        assertEq(carbonCredits, 0, "Initial carbon credits should be 0");
        assertEq(deviceAge, 0, "Initial device age should be 0");
        assertEq(warrantyLeft, warrantyDays, "Warranty days mismatch");
        assertFalse(isEligible, "Should not be recycling eligible initially");
    }

    function testUpdateINFTTraitsDynamic() public {
        // Issue receipt and initialize traits
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 365);

        // Fast forward time by 400 days
        vm.warp(block.timestamp + 400 days);

        // Update traits
        vm.expectEmit(true, false, false, false);
        emit INFTTraitsUpdated(receiptId, 75, 0, 400);

        proofMint.updateINFTTraits(receiptId);

        // Verify updated traits
        (
            ,
            uint256 recyclability,
            ,
            ,
            uint256 deviceAge,
            uint256 warrantyLeft,
            bool isEligible
        ) = proofMint.getINFTTraits(receiptId);

        assertEq(deviceAge, 400, "Device age should be 400 days");
        assertEq(warrantyLeft, 0, "Warranty should have expired");
        assertTrue(isEligible, "Should be recycling eligible after warranty expiry");
        assertEq(recyclability, 75, "Recyclability should increase after 1 year");
    }

    function testAwardCarbonCredits() public {
        // Issue receipt and initialize traits
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 365);

        // Award carbon credits as recycler
        uint256 creditsToAward = 100 ether;

        vm.expectEmit(true, false, false, true);
        emit CarbonCreditsEarned(receiptId, creditsToAward, creditsToAward);

        vm.prank(recycler);
        proofMint.awardCarbonCredits(receiptId, creditsToAward);

        // Verify carbon credits
        (, , uint256 carbonCredits, , , , ) = proofMint.getINFTTraits(receiptId);
        assertEq(carbonCredits, creditsToAward, "Carbon credits not awarded correctly");

        // Award more credits
        vm.prank(recycler);
        proofMint.awardCarbonCredits(receiptId, creditsToAward);

        (, , uint256 totalCredits, , , , ) = proofMint.getINFTTraits(receiptId);
        assertEq(totalCredits, creditsToAward * 2, "Total carbon credits incorrect");
    }

    function testUpdateAIAgent() public {
        // Issue receipt and initialize traits
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmOLD", 70, 75, 365);

        // Update AI agent as buyer (NFT owner)
        string memory newCID = "QmNEWAGENT123";

        vm.expectEmit(true, false, false, true);
        emit AIAgentUpdated(receiptId, newCID, block.timestamp);

        vm.prank(buyer);
        proofMint.updateAIAgent(receiptId, newCID);

        // Verify new CID
        string memory returnedCID = proofMint.getAgentCID(receiptId);
        assertEq(returnedCID, newCID, "AI agent CID not updated");
    }

    function testGetAgentCIDERC7857() public {
        // Issue receipt and initialize traits
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        string memory aiAgentCID = "QmABC123";
        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, aiAgentCID, 70, 75, 365);

        // Test ERC-7857 getAgentCID function
        string memory returnedCID = proofMint.getAgentCID(receiptId);
        assertEq(returnedCID, aiAgentCID, "getAgentCID should return correct CID");
    }

    function testHasINFTTraits() public {
        // Issue receipt
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Should not have traits initially
        assertFalse(proofMint.hasINFTTraits(receiptId), "Should not have traits initially");

        // Initialize traits
        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 365);

        // Should have traits now
        assertTrue(proofMint.hasINFTTraits(receiptId), "Should have traits after initialization");
    }

    function testRecyclingEligibilityAfter2Years() public {
        // Issue receipt and initialize traits
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 730); // 2 year warranty

        // Fast forward 2 years
        vm.warp(block.timestamp + 730 days);

        // Update traits
        proofMint.updateINFTTraits(receiptId);

        // Verify recycling eligibility
        (, , , , , , bool isEligible) = proofMint.getINFTTraits(receiptId);
        assertTrue(isEligible, "Should be recycling eligible after 2 years");
    }

    function testOnlyMerchantOrAdminCanInitialize() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Try to initialize as buyer (should fail)
        vm.prank(buyer);
        vm.expectRevert("Only merchant or admin can initialize INFT traits");
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 365);

        // Merchant can initialize
        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 365);

        // Admin can also initialize (for another receipt)
        vm.prank(merchant);
        uint256 receiptId2 = proofMint.issueReceipt(buyer, "ipfs://test2");

        vm.prank(admin);
        proofMint.initializeINFTTraits(receiptId2, "QmDEF", 80, 85, 365);
    }

    function testOnlyOwnerOrAdminCanUpdateAIAgent() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmOLD", 70, 75, 365);

        // Try to update as merchant (not owner, should fail)
        vm.prank(merchant);
        vm.expectRevert("Only NFT owner or admin can update AI agent");
        proofMint.updateAIAgent(receiptId, "QmNEW");

        // Buyer (owner) can update
        vm.prank(buyer);
        proofMint.updateAIAgent(receiptId, "QmNEW");

        // Admin can also update
        vm.prank(admin);
        proofMint.updateAIAgent(receiptId, "QmADMIN");
    }

    function testOnlyRecyclerCanAwardCredits() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        vm.prank(merchant);
        proofMint.initializeINFTTraits(receiptId, "QmABC", 70, 75, 365);

        // Try to award as buyer (should fail)
        vm.prank(buyer);
        vm.expectRevert(ProofMint.NotRecycler.selector);
        proofMint.awardCarbonCredits(receiptId, 100 ether);

        // Recycler can award
        vm.prank(recycler);
        proofMint.awardCarbonCredits(receiptId, 100 ether);
    }

    function testInvalidRecyclabilityScore() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Try to initialize with score > 100
        vm.prank(merchant);
        vm.expectRevert("Recyclability score must be 0-100");
        proofMint.initializeINFTTraits(receiptId, "QmABC", 101, 75, 365);
    }

    function testInvalidSustainabilityScore() public {
        vm.prank(merchant);
        uint256 receiptId = proofMint.issueReceipt(buyer, "ipfs://test");

        // Try to initialize with score > 100
        vm.prank(merchant);
        vm.expectRevert("Sustainability score must be 0-100");
        proofMint.initializeINFTTraits(receiptId, "QmABC", 75, 101, 365);
    }
}

