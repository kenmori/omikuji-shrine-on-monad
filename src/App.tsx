import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
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
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "canDrawOmikuji",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getTimeUntilNextDraw",
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

const CONTRACT_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';

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
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Read the omikuji price
  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'omikujiPrice',
  });

  // Check if user can draw omikuji
  const { data: canDraw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'canDrawOmikuji',
    args: address ? [address] : undefined,
  });

  // Get time until next draw
  const { data: timeUntilNext } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'getTimeUntilNextDraw',
    args: address ? [address] : undefined,
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

  // Update countdown timer
  useEffect(() => {
    if (timeUntilNext && Number(timeUntilNext) > 0) {
      setTimeLeft(Number(timeUntilNext));
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setTimeLeft(0);
    }
  }, [timeUntilNext]);

  // Format time remaining
  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}時間${minutes}分${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

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
              {canDraw === false && timeLeft > 0 && (
                <div className="cooldown-info">
                  <p>⏰ 次のおみくじまで: {formatTimeLeft(timeLeft)}</p>
                  <small>24時間に1回まで引くことができます</small>
                </div>
              )}
              
              <button 
                className="omikuji-button" 
                onClick={drawOmikuji}
                disabled={isPending || isConfirming || canDraw === false}
              >
                {isPending ? '⏳ 送信中...' : 
                 isConfirming ? '🔄 確認中...' :
                 canDraw === false ? '⏳ 待機中...' :
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