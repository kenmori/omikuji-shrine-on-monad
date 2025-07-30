import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import './App.css';

// Test Configuration
  const TEST_CONFIG = {
  DISABLE_COOLDOWN: true, // Set to false for production
  ANIMATION_DURATION: 3000, // Animation duration in ms
} as const;

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
    "inputs": [],
    "name": "MAX_SUPPLY",
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

const CONTRACT_ADDRESS = '0x4A679253410272dd5232B3Ff7cF5dbB88f295319';

const fortuneNames = [
  "Super Ultra Great Blessing (大大大吉)",
  "Ultra Great Blessing (大大吉)",
  "Great Blessing (大吉)",
  "Middle Blessing (中吉)",
  "Small Blessing (小吉)",
  "Blessing (吉)",
  "Minor Blessing (末吉)"
];

interface OmikujiResult {
  tokenId: string;
  result: number;
  message: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
  txHash?: string;
}

function App() {
  const { address, isConnected } = useAccount();
  const [lastResult, setLastResult] = useState<OmikujiResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Read the omikuji price
  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'omikujiPrice',
  });

  // Check if user can draw omikuji
  const { data: canDrawFromContract } = useReadContract({
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

  // Get max supply
  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'MAX_SUPPLY',
  });

  // For now, we'll show max supply info (total minted will be available after contract update)
  const [estimatedMinted, setEstimatedMinted] = useState(0);

  // Apply test configuration for cooldown
  const canDraw = TEST_CONFIG.DISABLE_COOLDOWN ? true : canDrawFromContract;

  // Notification management
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 10000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Write contract hook for drawing omikuji
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  // Debug: Monitor writeContract states
  useEffect(() => {
    console.log('WriteContract state changed:', {
      hash,
      isPending,
      writeError: writeError?.message
    });
  }, [hash, isPending, writeError]);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && hash) {
      addNotification({
        type: 'success',
        message: 'Transaction successful! Your omikuji is being prepared...',
        txHash: hash,
      });
    }
  }, [isConfirmed, hash]);

  // Handle transaction error
  useEffect(() => {
    if (isTxError && hash) {
      addNotification({
        type: 'error',
        message: 'Transaction failed. Please try again.',
        txHash: hash,
      });
    }
  }, [isTxError, hash]);

  // Handle write contract error
  useEffect(() => {
    if (writeError) {
      console.log('Write contract error:', writeError);
      addNotification({
        type: 'error',
        message: writeError.message || 'Failed to submit transaction. Please try again.',
      });
    }
  }, [writeError]);

  const drawOmikuji = async () => {
    console.log('drawOmikuji function called');
    console.log('Price:', price);
    console.log('Can draw:', canDraw);
    console.log('Is connected:', isConnected);
    
    if (!price) {
      console.log('No price available, returning');
      return;
    }

    try {
      console.log('Attempting to write contract...');
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Value to send:', price?.toString());
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: OMIKUJI_ABI,
        functionName: 'drawOmikuji',
        value: price,
      });
      
      console.log('writeContract call completed');
    } catch (error: any) {
      console.error('Error drawing omikuji:', error);
      addNotification({
        type: 'error',
        message: error?.message || 'Failed to submit transaction. Please try again.',
      });
    }
  };

  // Handle draw completion when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && !lastResult && !showAnimation) {
      console.log('Starting omikuji animation...');
      debugger; // Debug point when animation starts
      
      // Update estimated minted count
      setEstimatedMinted(prev => prev + 1);
      
      // Show animation first
      setShowAnimation(true);
      
      // After animation, show result
      setTimeout(() => {
        const tokenId = estimatedMinted;
        let fortuneResult = Math.floor(Math.random() * 7); // Default random result
        let fortuneMessage = "Today will be a wonderful day filled with opportunities!";
        
        // Special lucky numbers
        if (tokenId === 777) {
          fortuneResult = 2; // DAI_KICHI (Great Blessing)
          fortuneMessage = "🎉 Lucky #777! The spirits have blessed you with great fortune!";
        } else if (tokenId === 7777) {
          fortuneResult = 1; // DAI_DAI_KICHI (Ultra Great Blessing)
          fortuneMessage = "✨ Incredible #7777! Ultra rare blessing from the divine spirits!";
        }
        
        const mockResult: OmikujiResult = {
          tokenId: tokenId.toString(),
          result: fortuneResult,
          message: fortuneMessage
        };
        setLastResult(mockResult);
        setShowAnimation(false);
      }, TEST_CONFIG.ANIMATION_DURATION);
    }
  }, [isConfirmed, lastResult, showAnimation]);

  // Update countdown timer
  useEffect(() => {
    if (!TEST_CONFIG.DISABLE_COOLDOWN && timeUntilNext && Number(timeUntilNext) > 0) {
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
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };


  return (
    <div className="app">
      <div className="logo-container">
        <img src="/asset/logo.svg" alt="Omikuji Shrine Logo" className="app-logo" />
      </div>
      <div className="wallet-section">
        <ConnectButton />
      </div>
      <div className="shrine-container">
        <h1 className="shrine-title">🏮 Omikuji Shrine 🏮</h1>
        <p className="shrine-subtitle">Digital Fortune Telling on Monad Network</p>
        
        {/* Supply Information */}
        <div className="supply-info">
          <div className="supply-stats">
            <div className="supply-item">
              <span className="supply-label">Max Supply:</span>
              <span className="supply-value">{maxSupply ? Number(maxSupply).toLocaleString() : '10,000'}</span>
            </div>
            <div className="supply-item">
              <span className="supply-label">Minted:</span>
              <span className="supply-value">{estimatedMinted.toLocaleString()}</span>
            </div>
            <div className="supply-item">
              <span className="supply-label">Remaining:</span>
              <span className="supply-value remaining">{maxSupply ? (Number(maxSupply) - estimatedMinted).toLocaleString() : '10,000'}</span>
            </div>
          </div>
          <div className="supply-progress">
            <div 
              className="supply-progress-bar" 
              style={{ 
                width: maxSupply ? `${(estimatedMinted / Number(maxSupply)) * 100}%` : '0%' 
              }}
            ></div>
          </div>
        </div>

        {isConnected && (
          <>
            {!lastResult && !showAnimation && (
              <div className="omikuji-section">
              {!TEST_CONFIG.DISABLE_COOLDOWN && canDrawFromContract === false && timeLeft > 0 && (
                <div className="cooldown-info">
                  <p>⏰ Next draw in: {formatTimeLeft(timeLeft)}</p>
                  <small>You can draw once every 24 hours</small>
                </div>
              )}
              
              <div className="omikuji-container">
                <img src="/asset/omikuji.png" alt="Omikuji" className="omikuji-image" />
                <button 
                  className="omikuji-button" 
                  onClick={drawOmikuji}
                  disabled={isPending || isConfirming || canDraw === false || showAnimation}
                >
                  {isPending ? '⏳ Sending...' :
                   isConfirming ? '🔄 Confirming...' :
                   showAnimation ? '✨ Drawing...' :
                   canDraw === false ? '⏳ Waiting...' :
                   'Draw Omikuji'}
                </button>
              </div>
              <div className="price-display">
                Price: {price ? formatEther(price) : '0.01'} MON
              </div>
              </div>
            )}

            {showAnimation && (
              <div className="omikuji-animation">
                <div className="animation-container">
                  <div className="falling-petals">
                    <div className="petal">🌸</div>
                    <div className="petal">🌸</div>
                    <div className="petal">🌸</div>
                    <div className="petal">🌸</div>
                    <div className="petal">🌸</div>
                    <div className="petal">🌸</div>
                  </div>
                  <div className="fortune-reveal">
                    <div className="torii-animation">⛩️</div>
                    <div className="drawing-text">Drawing your fortune...</div>
                    <div className="omikuji-paper">
                      <img src="/asset/drawing-omikuji.png" alt="Drawing Omikuji" className="paper-shake" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lastResult && !showAnimation && (
              <div className={`result-card ${(lastResult.tokenId === '777' || lastResult.tokenId === '7777') ? 'lucky-number' : ''}`}>
                <div className="nft-header">
                  <div className={`nft-number ${(lastResult.tokenId === '777' || lastResult.tokenId === '7777') ? 'lucky-number-glow' : ''}`}>
                    #{lastResult.tokenId}
                    {(lastResult.tokenId === '777' || lastResult.tokenId === '7777') && <span className="lucky-sparkle">✨</span>}
                  </div>
                  <div className="nft-collection">Omikuji Shrine NFT</div>
                </div>
                <div className="fortune-result">{fortuneNames[lastResult.result]}</div>
                <div className="fortune-message">"{lastResult.message}"</div>
                <div className="nft-info">
                  <strong>🎨 NFT has been minted to your wallet!</strong><br />
                  <small>Check your wallet to view your fortune NFT</small>
                </div>
              </div>
            )}
          </>
        )}

        {!isConnected && (
          <div className="connect-prompt">
            <p>⛩️ Connect Wallet to Draw Omikuji ⛩️</p>
          </div>
        )}
      </div>
      
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification ${notification.type}`}
              onClick={() => removeNotification(notification.id)}
            >
              <div className="notification-content">
                <div className="notification-message">{notification.message}</div>
                {notification.txHash && (
                  <a 
                    href={`https://testnet.monadexplorer.com/tx/${notification.txHash}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="notification-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Transaction →
                  </a>
                )}
              </div>
              <button 
                className="notification-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
