# 🏮 Omikuji Shrine on Monad

![Omikuji Shrine on Monad](./public/og-image.png)

*Digital Fortune Telling on Monad Network - Draw your fortune and mint unique NFTs inspired by classical Japanese art*

## 🎋 About

Omikuji Shrine on Monad is a Web3 fortune-telling dApp that combines traditional Japanese omikuji (fortune slips) with NFT technology on the Monad network. Draw your fortune and receive a unique NFT featuring masterpieces of classical Japanese art.

## ✨ Features

- 🎭 **Traditional Omikuji Experience**: Seven different fortune types with authentic Japanese meanings
- 🖼️ **Classical Art NFTs**: Each fortune is paired with famous Japanese artworks from master artists
- 🎵 **Atmospheric BGM**: Traditional Japanese music enhances the spiritual experience
- 💰 **Affordable Minting**: Only 0.1 MON per fortune draw
- 🔗 **Seamless Wallet Integration**: RainbowKit-powered wallet connectivity
- 📱 **Mobile Responsive**: Beautiful design across all devices
- 🌐 **Monad Network**: Built on the fast and efficient Monad blockchain

## 🎨 Fortune Types & Artwork Mapping

| Fortune Type | Rarity | Probability | Featured Artwork | Artist |
|--------------|--------|-------------|------------------|---------|
| **Super Ultra Great Blessing (大大大吉)** | 🌟🌟🌟🌟🌟🌟 | 0.5% | Fine Wind, Clear Morning | Katsushika Hokusai |
| **Ultra Great Blessing (大大吉)** | 🌟🌟🌟🌟🌟 | 1.5% | The Great Wave off Kanagawa | Katsushika Hokusai |
| **Great Blessing (大吉)** | 🌟🌟🌟🌟 | 5.0% | Minamoto no Yoshitsune on Horseback | Isoda Koryūsai |
| **Middle Blessing (中吉)** | 🌟🌟🌟 | 10.0% | Matsumoto Yonesaburo as Shinobu | Tōshūsai Sharaku |
| **Small Blessing (小吉)** | 🌟🌟 | 20.0% | Kabuki Actor Ōtani Oniji III | Tōshūsai Sharaku |
| **Blessing (吉)** | 🌟 | 30.0% | Chinese Lions (Karajishi) | Kanō Eitoku |
| **Minor Blessing (末吉)** | ⭐ | 33.0% | Wind God and Thunder God | Tawaraya Sōtatsu |

## 🔥 Burn & Mint System

The innovative Burn & Mint system allows you to exchange unwanted NFTs for new fortune draws:

### 🎯 How It Works
1. **Eligible NFTs**: Only "Blessing (吉)" and "Minor Blessing (末吉)" can be burned
2. **Burn Requirement**: Must have 3+ NFTs of the same type
3. **Exchange Rate**: 3 NFTs → 1 new fortune draw (no payment required)
4. **Atomic Operation**: Burning and minting happen in a single transaction

### ✨ Benefits
- **No Accumulation**: Prevents free mint hoarding - burn immediately creates new NFT
- **Better Odds**: Get another chance at rarer fortunes
- **Cost Efficient**: No additional MON payment required
- **Gallery Refresh**: Automatically updates your collection display

### 🔧 Technical Implementation
- **Smart Contract**: `burnAndMint()` function ensures atomicity
- **Data Consistency**: Gallery counts update immediately after burn
- **Event Tracking**: Full blockchain event logging for transparency

## 🏆 Self-Mint Collection System

A unique feature that tracks **only the NFTs you personally mint**, not purchased from others:

### 🎯 Core Concept
- **Self-Mint Only**: Special NFT completion rewards can **only** be earned through personal minting
- **No Trading Shortcuts**: Purchasing NFTs from others won't count toward completion
- **Authentic Achievement**: Proves you experienced each fortune type firsthand
- **Progress Tracking**: Visual gallery shows your personal minting progress (0-7 types)

### 🎮 How It Works
1. **Draw Omikuji**: Pay 0.1 MON and mint an NFT yourself
2. **Track Progress**: System records which fortune types you've personally minted
3. **Complete Collection**: Mint all 7 different fortune types yourself
4. **Earn Recognition**: Unlock special completion status and future rewards

### 🔓 Special Completion Features
- **Coming Soon Button**: Unlocks when you complete self-mint collection
- **Exclusive Access**: Future special NFTs only available to self-mint completers
- **Achievement Badge**: Visual recognition of your dedication
- **Self-Mint Only Policy**: Clearly stated - cannot be purchased from others

### 📊 Gallery Display
- **Personal Collection**: Shows only your self-minted fortunes
- **Progress Counter**: Visual indication of completion status
- **Type Tracking**: Count of each fortune type you've personally minted

## 🎯 Additional Features

- **🔥 Burn & Mint System**: Exchange 3 low-value NFTs for a new fortune draw
- **Lucky Numbers**: Special animations and enhanced fortunes for tokens #777 and #7777
- **Art Credits**: Complete attribution to museums and Wikipedia sources
- **Social Sharing**: Share your fortune results directly to X/Twitter
- **Unlimited Supply**: No maximum cap on NFT minting
- **Real-time Counter**: See total minted count in real-time
- **Free Mint System**: Earn free draws through burning NFTs

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Wallet Integration**: RainbowKit + Wagmi
- **Blockchain**: Monad Network + Localhost testing
- **Smart Contracts**: Solidity + Hardhat
- **Storage**: IPFS via Pinata
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## 🧪 Testing & Quality Assurance

### Automated Testing
```bash
# Run all tests
npm run test:run

# Watch mode for development
npm run test:watch

# Test coverage
npm run test:coverage
```

### Display Consistency Tests
- ✅ Fortune name mapping validation
- ✅ Artwork information accuracy
- ✅ IPFS hash verification
- ✅ Burn eligibility logic
- ✅ Gallery count calculations
- ✅ Burn&mint data transformations

### Manual Testing Tools
Open browser developer console and use:
```javascript
// Test display consistency
window.testHelper.compareResults(6, 6, 6)

// Test burn eligibility
window.testHelper.testBurnEligibility([6,6,6])

// Extract current display info
window.testHelper.extractDisplayedInfo()
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- MON tokens for minting

### Local Development
```bash
# Clone the repository
git clone https://github.com/kenmori/omikuji-shrine-on-monad.git

# Install dependencies
npm install

# Start local Hardhat node
npm run node

# Deploy contracts (in another terminal)
npm run deploy:local

# Start development server
npm run dev
```

### Network Configuration

#### Localhost Development
1. Import test private key to MetaMask:
   - `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
2. Switch to Localhost network (Chain ID: 31337)
3. You'll have 10,000 MON for testing

#### Monad Testnet
1. Add Monad Testnet to MetaMask:
   - **Network Name**: Monad Testnet
   - **RPC URL**: `https://testnet-rpc.monad.xyz`
   - **Chain ID**: `10143`
   - **Currency Symbol**: `MON`
2. Get test tokens from [Monad Faucet](https://faucet.monad.xyz)

## 🎨 Art Attribution

All artworks featured in this project are inspired by masterpieces in the public domain:
- Museum collections (MFA Boston, Metropolitan Museum)
- Wikipedia Commons
- Traditional Japanese art heritage

**Important**: Fortune results are randomly assigned and not related to the artistic or historical value of the featured artworks.

## 🎵 Credits

- **BGM**: "Hurusato" by [@hiroseyuki113](https://x.com/hiroseyuki113) - [Original Source](https://original-bgm.booth.pm/items/3784404)
- **Artwork**: Classical Japanese masters (Hokusai, Sharaku, Sōtatsu, etc.)
- **Creator**: [@d_omajime](https://x.com/d_omajime)

## 🤝 Contributing

We welcome contributions! Please feel free to:

- 🐛 **Report Issues**: Found a bug? [Open an issue](https://github.com/kenmori/omikuji-shrine-on-monad/issues)
- 💡 **Feature Requests**: Have an idea? [Create a feature request](https://github.com/kenmori/omikuji-shrine-on-monad/issues)
- 🔀 **Pull Requests**: Want to contribute code? [Submit a PR](https://github.com/kenmori/omikuji-shrine-on-monad/pulls)

### Areas for Contribution
- UI/UX improvements
- Additional fortune types
- Mobile optimization
- Performance enhancements
- Documentation improvements
- Localization (multiple languages)

## 📄 License

This project is open source. Please respect the original artists and maintain proper attribution when using the artwork references.

## 🔗 Links

- **Live Demo**: [omikuji-shrine-on-monad.vercel.app](https://omikuji-shrine-on-monad.vercel.app)
- **GitHub**: [omikuji-shrine-on-monad](https://github.com/kenmori/omikuji-shrine-on-monad)
- **Creator**: [@d_omajime](https://x.com/d_omajime)
- **Monad Network**: [monad.xyz](https://monad.xyz)

## 📝 Contract Information

### Production (Monad Testnet)
- **Contract Address**: `0x5d3DEde8ebe694F63B09Fec5D1AB8d9e0974f00d`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Block Explorer**: [explorer.monad.xyz](https://explorer.monad.xyz)

### Development (Localhost)
- **Network**: Localhost (Chain ID: 31337)
- **Contract**: Deployed locally via `npm run deploy:localhost`

---

*May your fortune bring you great blessings! 🙏*