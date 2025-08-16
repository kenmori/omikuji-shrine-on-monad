import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🎨 更新版NFTコントラクトをデプロイ中...");
    console.log("📋 新機能:");
    console.log("   ✅ ミント価格: 0.1 MON");
    console.log("   ✅ 無制限供給（制限なし）");
    console.log("   ✅ 改良された確率分布");
    console.log("   ✅ ミント数表示機能");
    
    const [deployer] = await ethers.getSigners();
    console.log("\nデプロイアカウント:", deployer.address);
    console.log("アカウント残高:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    console.log("\nコントラクトデプロイ中...");
    const UpdatedIPFSOmikujiNFT = await ethers.getContractFactory("UpdatedIPFSOmikujiNFT");
    const contract = await UpdatedIPFSOmikujiNFT.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const omikujiPrice = await contract.omikujiPrice();
    const totalSupply = await contract.totalSupply();

    console.log("✅ UpdatedIPFSOmikujiNFT デプロイ完了!");
    console.log("📍 コントラクトアドレス:", contractAddress);
    console.log("🎋 ミント価格:", ethers.formatEther(omikujiPrice), "MON");
    console.log("📦 供給制限: 無制限");
    console.log("🎨 現在ミント数:", Number(totalSupply).toLocaleString(), "個");

    console.log("\n📊 確率分布:");
    console.log("   🌟 Super Ultra Great: 0.1% (超レア)");
    console.log("   ⭐ Ultra Great: 1.0% (レア)");
    console.log("   🔸 Great: 5.0% (アンコモン)");
    console.log("   🔹 Middle: 10.0% (普通)");
    console.log("   🔸 Small: 20.0% (よくある)");
    console.log("   🔹 Blessing: 30.0% (一般的)");
    console.log("   🔸 Minor: 33.9% (最も一般的)");

    console.log("\n📋 デプロイ情報:");
    const deployInfo = {
        "contractAddress": contractAddress,
        "deployer": deployer.address,
        "network": "localhost",
        "timestamp": new Date().toISOString(),
        "mintPrice": "0.1 MON",
        "maxSupply": "unlimited",
        "currentSupply": Number(totalSupply),
        "ipfsEnabled": true,
        "probabilityImproved": true
    };
    console.log(deployInfo);

    console.log("\n🔧 フロントエンド設定:");
    console.log(`CONTRACT_ADDRESS = "${contractAddress}";`);

    console.log("\n🎯 テスト手順:");
    console.log("1. src/App.tsx の CONTRACT_ADDRESS を更新");
    console.log("2. ブラウザをリフレッシュ");
    console.log("3. 0.1 MONでおみくじを引く");
    console.log("4. リアルタイムでミント数を確認");
    console.log("5. MetaMaskでNFTと画像を確認");

    console.log("\n🔓 重要: 供給制限を撤廃しました（無制限ミント可能）");
}

main().catch(console.error);