const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OmikujiShrine", function () {
  let omikujiShrine;
  let owner;
  let user1;
  let user2;
  
  const OMIKUJI_PRICE = ethers.utils.parseEther("0.001");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const OmikujiShrine = await ethers.getContractFactory("OmikujiShrine");
    omikujiShrine = await OmikujiShrine.deploy();
    await omikujiShrine.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await omikujiShrine.owner()).to.equal(owner.address);
    });

    it("Should set the correct omikuji price", async function () {
      expect(await omikujiShrine.omikujiPrice()).to.equal(OMIKUJI_PRICE);
    });

    it("Should have correct name and symbol", async function () {
      expect(await omikujiShrine.name()).to.equal("Omikuji Shrine NFT");
      expect(await omikujiShrine.symbol()).to.equal("OMIKUJI");
    });
  });

  describe("Drawing Omikuji", function () {
    it("Should allow drawing omikuji with correct payment", async function () {
      const tx = await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
      const receipt = await tx.wait();
      
      // Check event emission
      const event = receipt.events.find(e => e.event === 'OmikujiDrawn');
      expect(event).to.not.be.undefined;
      expect(event.args.drawer).to.equal(user1.address);
      expect(event.args.tokenId).to.equal(1);
      
      // Check NFT was minted
      expect(await omikujiShrine.ownerOf(1)).to.equal(user1.address);
      expect(await omikujiShrine.balanceOf(user1.address)).to.equal(1);
    });

    it("Should reject insufficient payment", async function () {
      const insufficientPayment = ethers.utils.parseEther("0.0005");
      
      await expect(
        omikujiShrine.connect(user1).drawOmikuji({ value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment for omikuji");
    });

    it("Should allow multiple omikuji draws", async function () {
      await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
      await omikujiShrine.connect(user2).drawOmikuji({ value: OMIKUJI_PRICE });
      await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
      
      expect(await omikujiShrine.balanceOf(user1.address)).to.equal(2);
      expect(await omikujiShrine.balanceOf(user2.address)).to.equal(1);
      
      const user1Omikujis = await omikujiShrine.getUserOmikujis(user1.address);
      expect(user1Omikujis.length).to.equal(2);
      expect(user1Omikujis[0]).to.equal(1);
      expect(user1Omikujis[1]).to.equal(3);
    });

    it("Should store omikuji data correctly", async function () {
      await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
      
      const omikuji = await omikujiShrine.omikujis(1);
      expect(omikuji.drawer).to.equal(user1.address);
      expect(omikuji.result).to.be.at.least(0).and.at.most(5); // 0-5 for different fortune types
      expect(omikuji.message).to.not.be.empty;
      expect(omikuji.timestamp).to.be.gt(0);
    });

    it("Should generate valid token URI", async function () {
      await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
      
      const tokenURI = await omikujiShrine.tokenURI(1);
      expect(tokenURI).to.include("data:application/json;base64,");
    });
  });

  describe("Owner functions", function () {
    it("Should allow owner to set omikuji price", async function () {
      const newPrice = ethers.utils.parseEther("0.002");
      await omikujiShrine.connect(owner).setOmikujiPrice(newPrice);
      
      expect(await omikujiShrine.omikujiPrice()).to.equal(newPrice);
    });

    it("Should reject non-owner setting price", async function () {
      const newPrice = ethers.utils.parseEther("0.002");
      
      await expect(
        omikujiShrine.connect(user1).setOmikujiPrice(newPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to withdraw funds", async function () {
      // User draws omikuji to add funds to contract
      await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
      
      const initialBalance = await owner.getBalance();
      const contractBalance = await ethers.provider.getBalance(omikujiShrine.address);
      
      const tx = await omikujiShrine.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalBalance = await owner.getBalance();
      expect(finalBalance).to.equal(initialBalance.add(contractBalance).sub(gasUsed));
      
      // Contract should have 0 balance after withdrawal
      expect(await ethers.provider.getBalance(omikujiShrine.address)).to.equal(0);
    });

    it("Should reject non-owner withdrawal", async function () {
      await expect(
        omikujiShrine.connect(user1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Random fortune distribution", function () {
    it("Should generate different fortune types", async function () {
      const results = new Set();
      
      // Draw multiple omikuji to test randomness
      for (let i = 0; i < 20; i++) {
        await omikujiShrine.connect(user1).drawOmikuji({ value: OMIKUJI_PRICE });
        const omikuji = await omikujiShrine.omikujis(i + 1);
        results.add(omikuji.result.toString());
      }
      
      // Should have at least 2 different fortune types in 20 draws
      expect(results.size).to.be.at.least(2);
    });
  });
});