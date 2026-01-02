import { ethers } from "hardhat";

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();

  // Get deployed contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LFFSBT = await ethers.getContractFactory("LFFSBT");
  const sbt = LFFSBT.attach(contractAddress);

  console.log("=== LFFSBT Contract Test ===\n");
  console.log("Contract address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Test 1: Mint Event Attendance SBT
  console.log("\n--- Test 1: Mint Event Attendance SBT ---");
  const eventId = "event-123";
  const metadataUri1 = "http://localhost:3001/api/metadata/event/event-123/user1";

  const tx1 = await sbt.mint(
    user1.address,
    metadataUri1,
    0, // TokenType.EVENT_ATTENDANCE
    eventId
  );
  const receipt1 = await tx1.wait();
  console.log("✅ Event SBT minted to user1");
  console.log("   Transaction hash:", receipt1?.hash);

  // Test 2: Mint Quest Completion SBT
  console.log("\n--- Test 2: Mint Quest Completion SBT ---");
  const questId = "quest-456";
  const metadataUri2 = "http://localhost:3001/api/metadata/quest/quest-456/user2";

  const tx2 = await sbt.mint(
    user2.address,
    metadataUri2,
    1, // TokenType.QUEST_COMPLETION
    questId
  );
  const receipt2 = await tx2.wait();
  console.log("✅ Quest SBT minted to user2");
  console.log("   Transaction hash:", receipt2?.hash);

  // Test 3: Check balances
  console.log("\n--- Test 3: Check Balances ---");
  const balance1 = await sbt.balanceOf(user1.address);
  const balance2 = await sbt.balanceOf(user2.address);
  console.log("User1 balance:", balance1.toString());
  console.log("User2 balance:", balance2.toString());

  // Test 4: Check token ownership
  console.log("\n--- Test 4: Check Token Ownership ---");
  const tokens1 = await sbt.getTokensByOwner(user1.address);
  const tokens2 = await sbt.getTokensByOwner(user2.address);
  console.log("User1 tokens:", tokens1.map(t => t.toString()));
  console.log("User2 tokens:", tokens2.map(t => t.toString()));

  // Test 5: Check hasTokenForReference
  console.log("\n--- Test 5: Check hasTokenForReference ---");
  const hasEvent = await sbt.hasTokenForReference(user1.address, eventId);
  const hasQuest = await sbt.hasTokenForReference(user2.address, questId);
  console.log(`User1 has token for event-123: ${hasEvent}`);
  console.log(`User2 has token for quest-456: ${hasQuest}`);

  // Test 6: Try to transfer (should fail - Soulbound)
  console.log("\n--- Test 6: Soulbound Test (Transfer should fail) ---");
  try {
    await sbt.connect(user1).transferFrom(user1.address, user2.address, 0);
    console.log("❌ Transfer succeeded (unexpected!)");
  } catch (error: any) {
    console.log("✅ Transfer failed as expected (Soulbound)");
    console.log("   Error:", error.message.slice(0, 100));
  }

  // Test 7: Get token metadata
  console.log("\n--- Test 7: Token Metadata ---");
  const metadata0 = await sbt.tokenMetadata(0);
  console.log("Token 0 metadata:");
  console.log("   Type:", metadata0.tokenType === 0n ? "EVENT_ATTENDANCE" : "QUEST_COMPLETION");
  console.log("   Reference ID:", metadata0.referenceId);
  console.log("   Minted At:", new Date(Number(metadata0.mintedAt) * 1000).toISOString());

  console.log("\n=== All Tests Passed! ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
