import { ethers } from "ethers";

// Generate a new random wallet for testnet deployment
const wallet = ethers.Wallet.createRandom();

console.log("=== New Wallet Generated ===\n");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("\n=== IMPORTANT ===");
console.log("1. Copy the Private Key to packages/contracts/.env");
console.log("2. Go to https://faucet.polygon.technology/");
console.log("3. Select 'Polygon Amoy' network");
console.log("4. Paste your Address and request MATIC");
console.log("5. Wait for transaction confirmation (~1 min)");
console.log("\n=== .env Configuration ===");
console.log(`DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`);
