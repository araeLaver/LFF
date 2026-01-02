import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  console.log("=== Wallet Balance Check ===\n");
  console.log("Address:", wallet.address);
  console.log("Network:", (await provider.getNetwork()).name);

  const balance = await provider.getBalance(wallet.address);
  const balanceInMatic = ethers.formatEther(balance);

  console.log("Balance:", balanceInMatic, "MATIC");

  if (parseFloat(balanceInMatic) < 0.01) {
    console.log("\n⚠️  Insufficient balance for deployment");
    console.log("\nAlternative Faucets to try:");
    console.log("1. https://www.alchemy.com/faucets/polygon-amoy");
    console.log("2. https://faucet.quicknode.com/polygon/amoy");
    console.log("3. https://thirdweb.com/polygon-amoy-testnet");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
  }
}

main().catch(console.error);
