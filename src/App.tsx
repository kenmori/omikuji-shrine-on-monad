import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';
import './App.css';

// Contract ABI - simplified for the main functions
const OMIKUJI_ABI = [
  {
    "inputs": [],
    "name": "drawOmikuji",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "omikujiPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "omikujis",
    "outputs": [
      {"internalType": "enum OmikujiShrine.FortuneType", "name": "result", "type": "uint8"},
      {"internalType": "string", "name": "message", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "address", "name": "drawer", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "drawer", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "result", "type": "uint8"},
      {"indexed": false, "internalType": "string", "name": "message", "type": "string"}
    ],
    "name": "OmikujiDrawn",
    "type": "event"
  }
] as const;

const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const fortuneNames = [
  "大吉 (Daikichi)",
  "吉 (Kichi)", 
  "中吉 (Chukichi)",
  "小吉 (Shokichi)",
  "末吉 (Sue-kichi)",
  "凶 (Kyo)"
];

interface OmikujiResult {
  tokenId: string;
  result: number;
  message: string;
}

function App() {
  const { address, isConnected } = useAccount();
  const [lastResult, setLastResult] = useState<OmikujiResult | null>(null);

  // Read the omikuji price
  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'omikujiPrice',
  });

  // Write contract hook for drawing omikuji
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const drawOmikuji = async () => {
    if (!price) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: OMIKUJI_ABI,
        functionName: 'drawOmikuji',
        value: price,
      });
    } catch (error) {
      console.error('Error drawing omikuji:', error);
    }
  };

  // Mock result for demo (in real app, you'd read this from contract events)
  const handleDrawComplete = () => {
    if (isConfirmed && !lastResult) {
      // This is a simplified demo - in a real app you'd read the event logs
      const mockResult: OmikujiResult = {
        tokenId: Math.floor(Math.random() * 1000).toString(),
        result: Math.floor(Math.random() * 6),
        message: "今日は良い一日になりそうです"
      };
      setLastResult(mockResult);
    }
  };

  // Call when transaction is confirmed
  if (isConfirmed && !lastResult) {
    handleDrawComplete();
  }

  return (
    <div className="app">
      <div className="shrine-container">
        <h1 className="shrine-title">🏮 おみくじ神社 🏮</h1>
        <p className="shrine-subtitle">Digital Omikuji Shrine on Monad</p>
        
        <div className="torii">⛩️</div>
        
        <div className="wallet-section">
          <ConnectButton />
        </div>

        {isConnected && (
          <>
            <div className="price-info">
              <strong>🎋 おみくじ料金: {price ? formatEther(price) : '0.001'} MON</strong><br />
              <small>結果はNFTとしてmintされます</small>
            </div>

            <div className="omikuji-section">
              <button 
                className="omikuji-button" 
                onClick={drawOmikuji}
                disabled={isPending || isConfirming}
              >
                {isPending ? '⏳ 送信中...' : 
                 isConfirming ? '🔄 確認中...' : 
                 '🎋 おみくじを引く 🎋'}
              </button>
            </div>

            {lastResult && (
              <div className="result-card">
                <div className="fortune-result">{fortuneNames[lastResult.result]}</div>
                <div className="fortune-message">"{lastResult.message}"</div>
                <div className="nft-info">
                  <strong>🎨 NFT #{lastResult.tokenId} がmintされました！</strong><br />
                  <small>あなたのウォレットで確認できます</small>
                </div>
              </div>
            )}
          </>
        )}

        {!isConnected && (
          <div className="connect-prompt">
            <p>ウォレットを接続してください</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;