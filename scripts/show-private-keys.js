// Hardhat default test accounts private keys
const accounts = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
  }
];

console.log("Hardhat Test Account Private Keys:");
console.log("==================================");
accounts.forEach((account, index) => {
  console.log(`Account #${index}:`);
  console.log(`Address: ${account.address}`);
  console.log(`Private Key: ${account.privateKey}`);
  console.log("---");
});

console.log("\nTo use these accounts in MetaMask:");
console.log("1. Open MetaMask");
console.log("2. Click 'Import Account'");  
console.log("3. Select 'Private Key'");
console.log("4. Paste one of the private keys above");
console.log("5. The account will have 10,000 MON for testing");