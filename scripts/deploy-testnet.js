import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🌐 Monad Testnetにデプロイ中...");
    console.log("📋 仕様:");
    console.log("   ✅ ミント価格: 0.1 MON");
    console.log("   ✅ 最大供給: 5,000個");
    console.log("   ✅ IPFS画像統合済み");
    console.log("   ✅ 確率分布改良済み");
    
    const [deployer] = await ethers.getSigners();
    console.log("\nデプロイアカウント:", deployer.address);
    
    // テストネット残高確認
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("アカウント残高:", ethers.formatEther(balance), "MON");
    
    if (balance < ethers.parseEther("1.0")) {
        console.log("⚠️  警告: 残高が少ないです。Monad Testnet Faucetから MON を取得してください");
        console.log("🚰 Faucet: https://faucet.monad.xyz");
    }

    console.log("\nコントラクトデプロイ中...");
    const UpdatedIPFSOmikujiNFT = await ethers.getContractFactory("UpdatedIPFSOmikujiNFT");
    const contract = await UpdatedIPFSOmikujiNFT.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const omikujiPrice = await contract.omikujiPrice();
    const maxSupply = await contract.MAX_SUPPLY();
    const totalSupply = await contract.totalSupply();

    console.log("✅ UpdatedIPFSOmikujiNFT Testnetデプロイ完了!");
    console.log("📍 コントラクトアドレス:", contractAddress);
    console.log("🎋 ミント価格:", ethers.formatEther(omikujiPrice), "MON");
    console.log("📦 最大供給:", Number(maxSupply).toLocaleString(), "個");
    console.log("🎨 現在ミント数:", Number(totalSupply).toLocaleString(), "個");

    console.log("\n🔗 Monad Explorer:");
    console.log(`https://explorer.monad.xyz/address/${contractAddress}`);

    console.log("\n📋 テストネットデプロイ情報:");
    const deployInfo = {
        "network": "Monad Testnet",
        "contractAddress": contractAddress,
        "deployer": deployer.address,
        "timestamp": new Date().toISOString(),
        "mintPrice": "0.1 MON",
        "maxSupply": Number(maxSupply),
        "currentSupply": Number(totalSupply),
        "explorerUrl": `https://explorer.monad.xyz/address/${contractAddress}`
    };
    console.log(deployInfo);

    console.log("\n🔧 フロントエンド設定:");
    console.log(`CONTRACT_ADDRESS = "${contractAddress}";`);
    console.log("// wagmi.tsでmonadTestnetに切り替えてください");

    console.log("\n🎯 テストネット使用手順:");
    console.log("1. MetaMaskにMonad Testnetを追加");
    console.log("2. Faucetから MON を取得: https://faucet.monad.xyz");
    console.log("3. src/App.tsx の CONTRACT_ADDRESS を更新");
    console.log("4. フロントエンドでMonad Testnetに接続");
    console.log("5. 0.1 MONでおみくじをテスト");

    console.log("\n🚀 本番環境準備完了！");
}

main().catch(console.error);