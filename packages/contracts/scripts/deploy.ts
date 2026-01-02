import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy LFFSBT contract
  const LFFSBT = await ethers.getContractFactory("LFFSBT");
  const sbt = await LFFSBT.deploy(deployer.address);

  await sbt.waitForDeployment();

  const contractAddress = await sbt.getAddress();
  console.log("LFFSBT deployed to:", contractAddress);

  // Log deployment info for backend configuration
  console.log("\n=== Backend Configuration ===");
  console.log(`SBT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`DEPLOYER_ADDRESS=${deployer.address}`);

  return { sbt, contractAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
