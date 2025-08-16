import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("💰 コントラクトからMONを引き出し中...");
    
    const [deployer] = await ethers.getSigners();
    console.log("引き出しアカウント:", deployer.address);
    console.log("引き出し前残高:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON");

    // コントラクトアドレス（最新のものを使用）
    const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
    
    // コントラクトに接続
    const UpdatedIPFSOmikujiNFT = await ethers.getContractFactory("UpdatedIPFSOmikujiNFT");
    const contract = UpdatedIPFSOmikujiNFT.attach(contractAddress);
    
    // コントラクトの現在残高を確認
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log("コントラクト残高:", ethers.formatEther(contractBalance), "MON");
    
    if (contractBalance > 0) {
        console.log("引き出し実行中...");
        const tx = await contract.withdraw();
        await tx.wait();
        console.log("✅ 引き出し完了!");
        
        // 引き出し後の残高確認
        const newBalance = await ethers.provider.getBalance(deployer.address);
        const newContractBalance = await ethers.provider.getBalance(contractAddress);
        
        console.log("引き出し後残高:", ethers.formatEther(newBalance), "MON");
        console.log("コントラクト残高:", ethers.formatEther(newContractBalance), "MON");
        console.log("引き出し額:", ethers.formatEther(contractBalance), "MON");
    } else {
        console.log("⚠️ コントラクトに引き出せる残高がありません");
    }
}

main().catch(console.error);