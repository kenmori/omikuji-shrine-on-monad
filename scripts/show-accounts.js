import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("Hardhat Test Accounts:");
  console.log("======================");
  
  const accounts = await ethers.getSigners();
  
  for (let i = 0; i < Math.min(accounts.length, 10); i++) {
    const account = accounts[i];
    const balance = await ethers.provider.getBalance(account.address);
    console.log(`Account #${i}: ${account.address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} MON`);
    console.log("---");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });