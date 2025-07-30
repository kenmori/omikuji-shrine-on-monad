import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const contractAddress = '0x4A679253410272dd5232B3Ff7cF5dbB88f295319';
  const [signer] = await ethers.getSigners();
  
  console.log('Testing contract at:', contractAddress);
  console.log('Using account:', signer.address);
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)));

  // Get contract instance
  const OmikujiShrine = await ethers.getContractFactory("OmikujiShrine");
  const contract = OmikujiShrine.attach(contractAddress);

  try {
    // Check omikuji price
    const price = await contract.omikujiPrice();
    console.log('Omikuji price:', ethers.formatEther(price), 'ETH');

    // Check if user can draw
    const canDraw = await contract.canDrawOmikuji(signer.address);
    console.log('Can draw omikuji:', canDraw);

    // Check last draw time
    const lastDrawTime = await contract.lastDrawTime(signer.address);
    console.log('Last draw time:', lastDrawTime.toString());

    // Check time until next draw
    const timeUntilNext = await contract.getTimeUntilNextDraw(signer.address);
    console.log('Time until next draw:', timeUntilNext.toString(), 'seconds');

    // Try to draw omikuji
    console.log('Attempting to draw omikuji...');
    const tx = await contract.drawOmikuji({ value: price });
    console.log('Transaction hash:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.reason) {
      console.error('Revert reason:', error.reason);
    }
  }
}

main().catch(console.error);