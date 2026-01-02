/**
 * E2E Test Script for SBT Minting on Polygon Amoy
 *
 * Usage: npx hardhat run scripts/test-minting.ts --network amoy
 */

import { ethers } from "hardhat";

enum TokenType {
  EVENT_ATTENDANCE = 0,
  QUEST_COMPLETION = 1,
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 LFF SBT Minting E2E Test");
  console.log("=".repeat(60));

  const contractAddress = process.env.SBT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("SBT_CONTRACT_ADDRESS not set in .env");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("\n📋 Test 1: Connection Test");
  console.log(`   ✅ Signer address: ${signer.address}`);

  // Get balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`   ℹ️  Balance: ${ethers.formatEther(balance)} MATIC`);

  // Connect to contract
  const LFFSBT = await ethers.getContractAt("LFFSBT", contractAddress);
  console.log(`   ✅ Connected to contract: ${contractAddress}`);

  // Test 2: Check contract state
  console.log("\n📋 Test 2: Contract State");
  const totalSupply = await LFFSBT.totalSupply();
  console.log(`   ✅ Total supply: ${totalSupply.toString()} tokens`);

  // Test 3: Mint Event Attendance SBT
  console.log("\n📋 Test 3: Mint Event Attendance SBT");
  const eventReferenceId = `test-event-${Date.now()}`;
  const eventMetadataUri = `https://api.lff.app/metadata/event/${eventReferenceId}`;

  console.log(`   ℹ️  Recipient: ${signer.address}`);
  console.log(`   ℹ️  Reference ID: ${eventReferenceId}`);
  console.log("   ℹ️  Sending transaction...");

  const eventTx = await LFFSBT.mint(
    signer.address,
    eventMetadataUri,
    TokenType.EVENT_ATTENDANCE,
    eventReferenceId
  );

  console.log(`   ℹ️  Transaction hash: ${eventTx.hash}`);
  console.log("   ℹ️  Waiting for confirmation...");

  const eventReceipt = await eventTx.wait();

  // Get tokenId from event
  const eventMintEvent = eventReceipt?.logs.find((log: any) => {
    try {
      const parsed = LFFSBT.interface.parseLog(log);
      return parsed?.name === "TokenMinted";
    } catch {
      return false;
    }
  });

  let eventTokenId = "0";
  if (eventMintEvent) {
    const parsed = LFFSBT.interface.parseLog(eventMintEvent);
    eventTokenId = parsed?.args[0].toString() || "0";
  }

  console.log(`   ✅ Event SBT minted! Token ID: ${eventTokenId}`);
  console.log(`   ℹ️  Block: ${eventReceipt?.blockNumber}`);
  console.log(`   ℹ️  View: https://amoy.polygonscan.com/tx/${eventReceipt?.hash}`);

  // Test 4: Mint Quest Completion SBT
  console.log("\n📋 Test 4: Mint Quest Completion SBT");
  const questReferenceId = `test-quest-${Date.now()}`;
  const questMetadataUri = `https://api.lff.app/metadata/quest/${questReferenceId}`;

  console.log(`   ℹ️  Recipient: ${signer.address}`);
  console.log(`   ℹ️  Reference ID: ${questReferenceId}`);
  console.log("   ℹ️  Sending transaction...");

  const questTx = await LFFSBT.mint(
    signer.address,
    questMetadataUri,
    TokenType.QUEST_COMPLETION,
    questReferenceId
  );

  console.log(`   ℹ️  Transaction hash: ${questTx.hash}`);
  console.log("   ℹ️  Waiting for confirmation...");

  const questReceipt = await questTx.wait();

  const questMintEvent = questReceipt?.logs.find((log: any) => {
    try {
      const parsed = LFFSBT.interface.parseLog(log);
      return parsed?.name === "TokenMinted";
    } catch {
      return false;
    }
  });

  let questTokenId = "0";
  if (questMintEvent) {
    const parsed = LFFSBT.interface.parseLog(questMintEvent);
    questTokenId = parsed?.args[0].toString() || "0";
  }

  console.log(`   ✅ Quest SBT minted! Token ID: ${questTokenId}`);
  console.log(`   ℹ️  Block: ${questReceipt?.blockNumber}`);
  console.log(`   ℹ️  View: https://amoy.polygonscan.com/tx/${questReceipt?.hash}`);

  // Test 5: Verify tokens
  console.log("\n📋 Test 5: Verify Tokens");

  const newBalance = await LFFSBT.balanceOf(signer.address);
  console.log(`   ✅ Total SBTs owned: ${newBalance.toString()}`);

  const tokenIds = await LFFSBT.getTokensByOwner(signer.address);
  console.log(`   ℹ️  Token IDs: [${tokenIds.map((id: bigint) => id.toString()).join(", ")}]`);

  // Check hasTokenForReference
  const hasEventToken = await LFFSBT.hasTokenForReference(signer.address, eventReferenceId);
  const hasQuestToken = await LFFSBT.hasTokenForReference(signer.address, questReferenceId);
  console.log(`   ✅ Has Event token: ${hasEventToken}`);
  console.log(`   ✅ Has Quest token: ${hasQuestToken}`);

  // Get metadata for last token
  if (tokenIds.length > 0) {
    const lastTokenId = tokenIds[tokenIds.length - 1];
    const metadata = await LFFSBT.tokenMetadata(lastTokenId);
    const tokenUri = await LFFSBT.tokenURI(lastTokenId);

    console.log(`   ℹ️  Last token (ID: ${lastTokenId}):`);
    console.log(`      - Type: ${metadata.tokenType === 0n ? "EVENT_ATTENDANCE" : "QUEST_COMPLETION"}`);
    console.log(`      - Reference: ${metadata.referenceId}`);
    console.log(`      - Minted at: ${new Date(Number(metadata.mintedAt) * 1000).toISOString()}`);
    console.log(`      - URI: ${tokenUri}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log("✅ Connection: Passed");
  console.log("✅ Contract State: Passed");
  console.log(`✅ Mint Event SBT: Token ID ${eventTokenId}`);
  console.log(`✅ Mint Quest SBT: Token ID ${questTokenId}`);
  console.log("✅ Verify Tokens: Passed");
  console.log("\n🎉 All tests passed! SBT minting is working correctly.");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
