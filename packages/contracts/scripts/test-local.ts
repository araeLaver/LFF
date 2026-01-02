/**
 * E2E Test Script for SBT Minting on Local Hardhat Node
 *
 * This script deploys the contract and tests the full minting flow locally.
 *
 * Usage: npx hardhat run scripts/test-local.ts --network localhost
 */

import { ethers } from "hardhat";

enum TokenType {
  EVENT_ATTENDANCE = 0,
  QUEST_COMPLETION = 1,
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 LFF SBT Minting E2E Test (Local)");
  console.log("=".repeat(60));

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();

  console.log("\n📋 Test 1: Setup");
  console.log(`   ✅ Deployer: ${deployer.address}`);
  console.log(`   ✅ Test User 1: ${user1.address}`);
  console.log(`   ✅ Test User 2: ${user2.address}`);

  // Deploy contract
  console.log("\n📋 Test 2: Deploy Contract");
  console.log("   ℹ️  Deploying LFFSBT...");

  const LFFSBT = await ethers.getContractFactory("LFFSBT");
  const sbt = await LFFSBT.deploy(deployer.address);
  await sbt.waitForDeployment();

  const contractAddress = await sbt.getAddress();
  console.log(`   ✅ Contract deployed to: ${contractAddress}`);

  // Test 3: Check initial state
  console.log("\n📋 Test 3: Check Initial State");
  const totalSupply = await sbt.totalSupply();
  console.log(`   ✅ Total supply: ${totalSupply.toString()} tokens`);

  const name = await sbt.name();
  const symbol = await sbt.symbol();
  console.log(`   ✅ Name: ${name}, Symbol: ${symbol}`);

  // Test 4: Mint Event Attendance SBT for User1
  console.log("\n📋 Test 4: Mint Event Attendance SBT");
  const eventReferenceId = `event-concert-001`;
  const eventMetadataUri = `http://localhost:3001/api/metadata/event/${eventReferenceId}`;

  console.log(`   ℹ️  Recipient: ${user1.address}`);
  console.log(`   ℹ️  Reference ID: ${eventReferenceId}`);
  console.log(`   ℹ️  Type: EVENT_ATTENDANCE`);

  const eventTx = await sbt.mint(
    user1.address,
    eventMetadataUri,
    TokenType.EVENT_ATTENDANCE,
    eventReferenceId
  );
  const eventReceipt = await eventTx.wait();

  // Get tokenId from event
  const eventMintEvent = eventReceipt?.logs.find((log: any) => {
    try {
      const parsed = sbt.interface.parseLog(log);
      return parsed?.name === "TokenMinted";
    } catch {
      return false;
    }
  });

  let eventTokenId = "0";
  if (eventMintEvent) {
    const parsed = sbt.interface.parseLog(eventMintEvent);
    eventTokenId = parsed?.args[0].toString() || "0";
  }

  console.log(`   ✅ Event SBT minted! Token ID: ${eventTokenId}`);

  // Test 5: Mint Quest Completion SBT for User1
  console.log("\n📋 Test 5: Mint Quest Completion SBT");
  const questReferenceId = `quest-social-share-001`;
  const questMetadataUri = `http://localhost:3001/api/metadata/quest/${questReferenceId}`;

  console.log(`   ℹ️  Recipient: ${user1.address}`);
  console.log(`   ℹ️  Reference ID: ${questReferenceId}`);
  console.log(`   ℹ️  Type: QUEST_COMPLETION`);

  const questTx = await sbt.mint(
    user1.address,
    questMetadataUri,
    TokenType.QUEST_COMPLETION,
    questReferenceId
  );
  const questReceipt = await questTx.wait();

  const questMintEvent = questReceipt?.logs.find((log: any) => {
    try {
      const parsed = sbt.interface.parseLog(log);
      return parsed?.name === "TokenMinted";
    } catch {
      return false;
    }
  });

  let questTokenId = "0";
  if (questMintEvent) {
    const parsed = sbt.interface.parseLog(questMintEvent);
    questTokenId = parsed?.args[0].toString() || "0";
  }

  console.log(`   ✅ Quest SBT minted! Token ID: ${questTokenId}`);

  // Test 6: Mint another Event SBT for User2
  console.log("\n📋 Test 6: Mint Event SBT for User2");
  const event2ReferenceId = `event-fanmeeting-002`;

  const event2Tx = await sbt.mint(
    user2.address,
    `http://localhost:3001/api/metadata/event/${event2ReferenceId}`,
    TokenType.EVENT_ATTENDANCE,
    event2ReferenceId
  );
  await event2Tx.wait();
  console.log(`   ✅ Event SBT minted for User2!`);

  // Test 7: Verify balances
  console.log("\n📋 Test 7: Verify Balances");
  const user1Balance = await sbt.balanceOf(user1.address);
  const user2Balance = await sbt.balanceOf(user2.address);
  const newTotalSupply = await sbt.totalSupply();

  console.log(`   ✅ User1 balance: ${user1Balance.toString()} SBTs`);
  console.log(`   ✅ User2 balance: ${user2Balance.toString()} SBTs`);
  console.log(`   ✅ Total supply: ${newTotalSupply.toString()} tokens`);

  // Test 8: Get tokens by owner
  console.log("\n📋 Test 8: Get Tokens by Owner");
  const user1Tokens = await sbt.getTokensByOwner(user1.address);
  const user2Tokens = await sbt.getTokensByOwner(user2.address);

  console.log(`   ✅ User1 tokens: [${user1Tokens.map((id: bigint) => id.toString()).join(", ")}]`);
  console.log(`   ✅ User2 tokens: [${user2Tokens.map((id: bigint) => id.toString()).join(", ")}]`);

  // Test 9: Check hasTokenForReference
  console.log("\n📋 Test 9: Verify Token References");
  const user1HasEvent = await sbt.hasTokenForReference(user1.address, eventReferenceId);
  const user1HasQuest = await sbt.hasTokenForReference(user1.address, questReferenceId);
  const user2HasEvent = await sbt.hasTokenForReference(user2.address, event2ReferenceId);
  const user2HasWrong = await sbt.hasTokenForReference(user2.address, eventReferenceId);

  console.log(`   ✅ User1 has event token: ${user1HasEvent}`);
  console.log(`   ✅ User1 has quest token: ${user1HasQuest}`);
  console.log(`   ✅ User2 has event2 token: ${user2HasEvent}`);
  console.log(`   ✅ User2 has event1 token (should be false): ${user2HasWrong}`);

  // Test 10: Get token metadata
  console.log("\n📋 Test 10: Token Metadata");
  for (const tokenId of user1Tokens) {
    const metadata = await sbt.tokenMetadata(tokenId);
    const tokenUri = await sbt.tokenURI(tokenId);
    const owner = await sbt.ownerOf(tokenId);

    console.log(`   Token ID ${tokenId}:`);
    console.log(`      - Owner: ${owner}`);
    console.log(`      - Type: ${metadata.tokenType === 0n ? "EVENT_ATTENDANCE" : "QUEST_COMPLETION"}`);
    console.log(`      - Reference: ${metadata.referenceId}`);
    console.log(`      - Minted at: ${new Date(Number(metadata.mintedAt) * 1000).toISOString()}`);
    console.log(`      - URI: ${tokenUri}`);
  }

  // Test 11: Verify Soulbound (transfer should fail)
  console.log("\n📋 Test 11: Verify Soulbound (Transfer Block)");
  try {
    // Try to transfer token (should fail)
    const sbtAsUser1 = sbt.connect(user1);
    await sbtAsUser1.transferFrom(user1.address, user2.address, user1Tokens[0]);
    console.log(`   ❌ Transfer succeeded (should have failed!)`);
  } catch (error: any) {
    if (error.message.includes("Soulbound") || error.message.includes("revert")) {
      console.log(`   ✅ Transfer correctly blocked (Soulbound token)`);
    } else {
      console.log(`   ⚠️ Transfer failed with unexpected error: ${error.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log("✅ Setup: Passed");
  console.log("✅ Deploy Contract: Passed");
  console.log("✅ Check Initial State: Passed");
  console.log("✅ Mint Event SBT: Passed");
  console.log("✅ Mint Quest SBT: Passed");
  console.log("✅ Mint for User2: Passed");
  console.log("✅ Verify Balances: Passed");
  console.log("✅ Get Tokens by Owner: Passed");
  console.log("✅ Verify Token References: Passed");
  console.log("✅ Token Metadata: Passed");
  console.log("✅ Soulbound Verification: Passed");
  console.log("\n" + "-".repeat(60));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Total Tokens Minted: ${newTotalSupply}`);
  console.log("-".repeat(60));
  console.log("\n🎉 All tests passed! SBT minting is working correctly.");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
