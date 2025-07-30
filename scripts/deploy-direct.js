import { ethers } from 'ethers';
import fs from 'fs';

async function main() {
  console.log("おみくじ神社スマートコントラクトをデプロイ中...");

  // Direct connection to local node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546");
  const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  
  console.log("デプロイアカウント:", wallet.address);
  console.log("アカウント残高:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH");

  // Read contract bytecode and ABI
  const contractJson = JSON.parse(fs.readFileSync('./artifacts/contracts/OmikujiShrine.sol/OmikujiShrine.json', 'utf8'));
  
  // Deploy contract
  const contractFactory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  console.log("コントラクトデプロイ中...");
  
  const omikujiShrine = await contractFactory.deploy();
  await omikujiShrine.waitForDeployment();

  const contractAddress = await omikujiShrine.getAddress();
  console.log("✅ OmikujiShrine デプロイ完了!");
  console.log("📍 コントラクトアドレス:", contractAddress);
  console.log("🎋 おみくじ料金:", ethers.formatEther(await omikujiShrine.omikujiPrice()), "ETH");

  // デプロイ情報を保存
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: wallet.address,
    network: "localhost",
    timestamp: new Date().toISOString(),
    omikujiPrice: ethers.formatEther(await omikujiShrine.omikujiPrice())
  };

  console.log("\n📋 デプロイ情報:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // フロントエンドで使用するためのコントラクトアドレスを表示
  console.log("\n🔧 フロントエンド設定:");
  console.log(`CONTRACT_ADDRESS = "${contractAddress}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ デプロイエラー:", error);
    process.exit(1);
  });