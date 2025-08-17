import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fortuneNames = [
  "Super Ultra Great Blessing (大大大吉)",
  "Ultra Great Blessing (大大吉)",
  "Great Blessing (大吉)",
  "Middle Blessing (中吉)",
  "Small Blessing (小吉)",
  "Blessing (吉)",
  "Minor Blessing (末吉)"
];

const rarities = [
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
  "Common",
  "Common"
];

const probabilities = ["0.5%", "1.5%", "5.0%", "10.0%", "20.0%", "30.0%", "33.0%"];

const images = [
  "https://gateway.pinata.cloud/ipfs/bafybeid2uda5hamkzb4lse5rc7htcbcjffo7dgukjo4bjqdjuvhe44gg7a",
  "https://gateway.pinata.cloud/ipfs/bafybeihs5auuxwu44f4geqwhgyzdoamdgaqxj6wbtcws47ft64mayaxsce",
  "https://gateway.pinata.cloud/ipfs/bafybeicart4oeg6gxhqgivm5knbooqn4bxa374jpg73aqdehz234zh6qum",
  "https://gateway.pinata.cloud/ipfs/bafybeihmntq3rxhd5j6nxk6j3vblzq6rhloiz2ircmdwg243raczy7qlau",
  "https://gateway.pinata.cloud/ipfs/bafkreigio3u25g2pgbfo3ajohy5qcida74akfln3ttlxh443xgjy33ospm",
  "https://gateway.pinata.cloud/ipfs/bafybeidlyt73ucjmtczrtcvdcfksulgfpx5gdag2j76hqdo3kcpdx2v2ve",
  "https://gateway.pinata.cloud/ipfs/bafybeiee2kczjgzseaqan5ldewlschfwalexzygehewu6joeow2etbkera"
];

// Create metadata directory if it doesn't exist
const metadataDir = path.join(__dirname, '..', 'metadata');
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

for (let i = 0; i < 7; i++) {
  const metadata = {
    name: `Omikuji Shrine on Monad #${i}`,
    description: `A digital fortune telling NFT from Omikuji Shrine on Monad Network featuring traditional Japanese art. Fortune: ${fortuneNames[i]}`,
    image: images[i],
    attributes: [
      { trait_type: "Fortune Type", value: fortuneNames[i] },
      { trait_type: "Rarity", value: rarities[i] },
      { trait_type: "Probability", value: probabilities[i] },
      { trait_type: "Collection", value: "Omikuji Shrine on Monad" },
      { trait_type: "Network", value: "Monad" }
    ]
  };

  const outputPath = path.join(metadataDir, `${i}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Generated metadata for token ${i}`);
}
