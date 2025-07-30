import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  // あなたのMetaMaskアドレスを入力してください
  const YOUR_METAMASK_ADDRESS = "YOUR_ADDRESS_HERE";
  
  if (YOUR_METAMASK_ADDRESS === "YOUR_ADDRESS_HERE") {
    console.log("Please edit this script and replace YOUR_ADDRESS_HERE with your MetaMask address");
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Sending MON from:", deployer.address);
  console.log("To:", YOUR_METAMASK_ADDRESS);
  
  const tx = await deployer.sendTransaction({
    to: YOUR_METAMASK_ADDRESS,
    value: ethers.parseEther("100") // 100 MON
  });
  
  await tx.wait();
  
  console.log("Transaction hash:", tx.hash);
  console.log("Sent 100 MON to your MetaMask account!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });