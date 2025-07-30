import pkg from 'hardhat';
const { ethers, hardhatArguments } = pkg;

async function main() {
  console.log("おみくじ神社スマートコントラクトをデプロイ中...");

  const [deployer] = await ethers.getSigners();
  console.log("デプロイアカウント:", deployer.address);
  console.log("アカウント残高:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // OmikujiShrineコントラクトをデプロイ
  const OmikujiShrine = await ethers.getContractFactory("OmikujiShrine");
  console.log("コントラクトデプロイ中...");
  
  const omikujiShrine = await OmikujiShrine.deploy();
  await omikujiShrine.waitForDeployment();

  console.log("✅ OmikujiShrine デプロイ完了!");
  console.log("📍 コントラクトアドレス:", await omikujiShrine.getAddress());
  console.log("🎋 おみくじ料金:", ethers.formatEther(await omikujiShrine.omikujiPrice()), "ETH");

  // デプロイ情報を保存
  const deploymentInfo = {
    contractAddress: await omikujiShrine.getAddress(),
    deployer: deployer.address,
    network: hardhatArguments.network || "localhost",
    timestamp: new Date().toISOString(),
    omikujiPrice: ethers.formatEther(await omikujiShrine.omikujiPrice())
  };

  console.log("\n📋 デプロイ情報:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // フロントエンドで使用するためのコントラクトアドレスを表示
  console.log("\n🔧 フロントエンド設定:");
  console.log(`CONTRACT_ADDRESS = "${await omikujiShrine.getAddress()}";`);
  
  console.log("\n📝 次の手順:");
  console.log("1. public/index.html の CONTRACT_ADDRESS を更新してください");
  console.log("2. npx hardhat node でローカルネットワークを起動 (ローカルテスト用)");
  console.log("3. public/index.html をブラウザで開いてテストしてください");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ デプロイエラー:", error);
    process.exit(1);
  });