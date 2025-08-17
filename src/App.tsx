import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import './App.css';
import { localhost } from './wagmi';

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
    "name": "totalSupply",
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

const CONTRACT_ADDRESS = '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f' as `0x${string}`;

const fortuneNames = [
  "Super Ultra Great Blessing (大大大吉)",
  "Ultra Great Blessing (大大吉)",
  "Great Blessing (大吉)",
  "Middle Blessing (中吉)",
  "Small Blessing (小吉)",
  "Blessing (吉)",
  "Minor Blessing (末吉)"
];

// IPFS hashes for each fortune type
const fortuneIPFSHashes = [
  "bafybeid2uda5hamkzb4lse5rc7htcbcjffo7dgukjo4bjqdjuvhe44gg7a", // fortune-0
  "bafybeihs5auuxwu44f4geqwhgyzdoamdgaqxj6wbtcws47ft64mayaxsce", // fortune-1
  "bafybeicart4oeg6gxhqgivm5knbooqn4bxa374jpg73aqdehz234zh6qum", // fortune-2
  "bafybeihmntq3rxhd5j6nxk6j3vblzq6rhloiz2ircmdwg243raczy7qlau", // fortune-3
  "bafkreigio3u25g2pgbfo3ajohy5qcida74akfln3ttlxh443xgjy33ospm", // fortune-4
  "bafybeidlyt73ucjmtczrtcvdcfksulgfpx5gdag2j76hqdo3kcpdx2v2ve", // fortune-5
  "bafybeiee2kczjgzseaqan5ldewlschfwalexzygehewu6joeow2etbkera"  // fortune-6
];

// Helper function to get IPFS hash for a specific result
const getIPFSHashForResult = (result: number): string => {
  return fortuneIPFSHashes[result] || fortuneIPFSHashes[6]; // fallback to minor blessing
};

// Artwork information for each fortune type
const artworkInfo = [
  {
    title: "Fine Wind, Clear Morning (from Thirty-six Views of Mount Fuji)",
    artist: "Katsushika Hokusai (葛飾北斎)",
    period: "c. 1830-1832",
    description: "One of Hokusai's most famous works, depicting Mount Fuji in brilliant red at sunrise. Also known as 'Red Fuji', this iconic ukiyo-e print symbolizes good fortune and divine blessing, making it perfect for the rarest omikuji result."
  },
  {
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai (葛飾北斎)",
    period: "c. 1831",
    description: "Perhaps the most recognizable Japanese artwork worldwide, this masterpiece shows a towering wave threatening boats while Mount Fuji stands serene in the background. It represents the power of nature and perseverance."
  },
  {
    title: "Minamoto no Yoshitsune on Horseback",
    artist: "Isoda Koryūsai (磯田湖龍齋)",
    period: "c. 1770s",
    description: "A dynamic ukiyo-e depicting the legendary warrior Minamoto no Yoshitsune mounted in full armor. This artwork embodies strength, courage, and the samurai spirit of medieval Japan."
  },
  {
    title: "The actor Matsumoto Yonesaburo in the Role of Shinobu Disguised as Courtesan Kewaizaka no Shoushō",
    artist: "Tōshūsai Sharaku (東洲斎写楽)",
    period: "1794",
    description: "One of Sharaku's psychologically penetrating actor portraits from the golden age of kabuki theater. Known for capturing the essence and emotion of performers with remarkable realism and intensity."
  },
  {
    title: "Kabuki Actor Ōtani Oniji III as Yakko Edobei",
    artist: "Tōshūsai Sharaku (東洲斎写楽)",
    period: "1794",
    description: "Another masterful actor portrait by Sharaku, showing the dramatic expression and character of kabuki performance. Sharaku's brief but brilliant career produced some of the most psychologically complex portraits in Japanese art."
  },
  {
    title: "Chinese Lions (Karajishi)",
    artist: "Kanō Eitoku (狩野永徳)",
    period: "1543-1590",
    description: "A powerful painting of karajishi (Chinese lions) by the master of the Kanō school. These mythical creatures were believed to ward off evil spirits and bring protection, often found guarding temples and shrines."
  },
  {
    title: "Wind God and Thunder God (風神雷神図)",
    artist: "Tawaraya Sōtatsu (俵屋宗達)",
    period: "c. 1615",
    description: "This iconic folding screen depicts Raijin (Thunder God) and Fūjin (Wind God) amid swirling clouds. A masterpiece of the Rinpa school, it has inspired countless artists and remains one of Japan's most beloved artworks."
  }
];

// Helper function to get artwork info for a specific result
const getArtworkInfo = (result: number) => {
  return artworkInfo[result] || artworkInfo[6]; // fallback to minor blessing
};

// Helper function to get artist name for sharing
const getArtistName = (result: number): string => {
  const artists = [
    "Katsushika Hokusai", // Fine Wind, Clear Morning
    "Katsushika Hokusai", // The Great Wave off Kanagawa
    "Isoda Koryūsai", // Minamoto no Yoshitsune on Horseback
    "Tōshūsai Sharaku", // The actor Matsumoto Yonesaburo...
    "Tōshūsai Sharaku", // Kabuki Actor Ōtani Oniji III...
    "Kanō Eitoku", // Chinese Lions (Karajishi)
    "Tawaraya Sōtatsu" // Wind God and Thunder God
  ];
  return artists[result] || artists[6];
};

// Helper function to get artwork short name for sharing
const getArtworkShortName = (result: number): string => {
  const artworkNames = [
    "Hokusai's Fine Wind, Clear Morning",
    "Hokusai's Great Wave",
    "Koryūsai's Minamoto no Yoshitsune",
    "Sharaku's Matsumoto Yonesaburo",
    "Sharaku's Ōtani Oniji III",
    "Kanō Eitoku's Chinese Lions",
    "Sōtatsu's Wind God and Thunder God"
  ];
  return artworkNames[result] || artworkNames[6];
};

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
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [lastResult, setLastResult] = useState<OmikujiResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCredits, setShowCredits] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

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


  // Get total supply (minted count)
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'totalSupply',
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

  // Function to switch to Localhost network
  const switchToLocalhost = async () => {
    try {
      await switchChain({ chainId: localhost.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      addNotification({
        type: 'error',
        message: 'Failed to switch to Localhost network. Please switch manually in MetaMask.',
      });
    }
  };

  const drawOmikuji = async () => {
    console.log('drawOmikuji function called');
    console.log('Price:', price);
    console.log('Price type:', typeof price);
    console.log('Can draw:', canDraw);
    console.log('Is connected:', isConnected);
    console.log('Chain:', chain);
    console.log('Address:', address);
    console.log('Contract address:', CONTRACT_ADDRESS);
    console.log('isPending:', isPending);
    console.log('isConfirming:', isConfirming);
    
    // Check if price is a valid BigInt
    if (price) {
      console.log('Price as string:', price.toString());
      console.log('Price as hex:', '0x' + price.toString(16));
      console.log('Price in ETH:', (Number(price) / 1e18).toFixed(4));
    }
    
    if (!isConnected) {
      console.log('Not connected, returning');
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first.',
      });
      return;
    }
    
    if (chain?.id !== localhost.id) {
      console.log('Wrong network, current chain ID:', chain?.id, 'expected:', localhost.id);
      addNotification({
        type: 'error',
        message: 'Please switch to Localhost network.',
      });
      return;
    }
    
    if (!price) {
      console.log('No price available, returning');
      addNotification({
        type: 'error',
        message: 'Unable to fetch contract price. Please check connection.',
      });
      return;
    }

    try {
      console.log('Attempting to write contract...');
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Value to send:', price?.toString());
      console.log('ABI function:', OMIKUJI_ABI.find(f => f.name === 'drawOmikuji'));
      
      const result = writeContract({
        address: CONTRACT_ADDRESS,
        abi: OMIKUJI_ABI,
        functionName: 'drawOmikuji',
        value: price,
        gas: 500000n,  // Add explicit gas limit
      });
      
      console.log('writeContract call completed, result:', result);
    } catch (error: any) {
      console.error('Error drawing omikuji:', error);
      console.error('Error details:', error.cause);
      console.error('Error data:', error.data);
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
      
      // Show animation first
      setShowAnimation(true);
      
      // After animation, show result
      setTimeout(() => {
        // Use current totalSupply + 1 as the new token ID
        const currentSupply = totalSupply ? Number(totalSupply) : 0;
        const tokenId = currentSupply + 1;
        
        // Use the same probability distribution as the contract
        const randomValue = Math.floor(Math.random() * 10000); // 0-9999
        let fortuneResult: number;
        
        if (randomValue < 10) {
          // 0.1% - Super Ultra Great Blessing
          fortuneResult = 0;
        } else if (randomValue < 110) {
          // 1.0% - Ultra Great Blessing  
          fortuneResult = 1;
        } else if (randomValue < 610) {
          // 5.0% - Great Blessing
          fortuneResult = 2;
        } else if (randomValue < 1610) {
          // 10.0% - Middle Blessing
          fortuneResult = 3;
        } else if (randomValue < 3610) {
          // 20.0% - Small Blessing
          fortuneResult = 4;
        } else if (randomValue < 6610) {
          // 30.0% - Blessing
          fortuneResult = 5;
        } else {
          // 33.9% - Minor Blessing
          fortuneResult = 6;
        }
        
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
        setShowResult(true);
        
        // Update estimated minted count to match the new token ID
        setEstimatedMinted(tokenId);
      }, TEST_CONFIG.ANIMATION_DURATION);
    }
  }, [isConfirmed, lastResult, showAnimation, totalSupply]);

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

  // Share to X function
  const shareToX = (result: OmikujiResult) => {
    const fortuneName = fortuneNames[result.result];
    const artworkName = getArtworkShortName(result.result);
    const currentUrl = window.location.href;
    
    const shareText = `🎋 Drew my fortune on Monad Testnet!
Result: "${fortuneName}" 🏮
${artworkName} appeared ✨
Token ID: #${result.tokenId}
by @d_omajime
@monad @monad_dev

${currentUrl}`;

    const encodedText = encodeURIComponent(shareText);
    const xUrl = `https://x.com/intent/tweet?text=${encodedText}`;
    
    window.open(xUrl, '_blank');
  };

  // Initialize BGM
  useEffect(() => {
    const bgmAudio = new Audio('/audio/Hurusato.mp3');
    bgmAudio.loop = true;
    bgmAudio.volume = 0.3; // Set volume to 30%
    setAudio(bgmAudio);

    return () => {
      bgmAudio.pause();
      bgmAudio.src = '';
    };
  }, []);

  // Toggle BGM
  const toggleBGM = async () => {
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('BGM playback error:', error);
    }
  };

  return (
    <div className="app">
      <div className="logo-container">
        <img src="/asset/monad-logo.png" alt="Omikuji Shrine on Monad Logo" className="app-logo" />
      </div>
      <div className="wallet-section">
        <ConnectButton showBalance={false} />
        {isConnected && chain?.id !== localhost.id && (
          <button 
            className="network-switch-button"
            onClick={switchToLocalhost}
          >
            Switch to Localhost
          </button>
        )}
        {isConnected && chain && (
          <div className="network-info">
            Current Network: {chain.name || 'Unknown'}
          </div>
        )}
      </div>
      
      {/* BGM Control */}
      <div className="bgm-control">
        <button 
          className="bgm-button"
          onClick={toggleBGM}
          title={isPlaying ? 'Pause BGM' : 'Play BGM'}
        >
          {isPlaying ? '🔊' : '🔇'}
        </button>
      </div>
      <div className="shrine-container">
        <h1 className="shrine-title">🏮 Omikuji Shrine on Monad 🏮</h1>
        <p className="shrine-subtitle">Digital Fortune Telling on Monad Network</p>
        
        {/* Supply Information */}
        <div className="supply-info">
          <div className="supply-stats">
            <div className="supply-item">
              <span className="supply-label">Total Minted:</span>
              <span className="supply-value">{totalSupply ? Number(totalSupply).toLocaleString() : '0'}</span>
            </div>
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
                Price: {price ? formatEther(price) : '0.1'} MON
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
                      <img src="/asset/monad-logo.png" alt="Monad Logo" className="paper-shake-logo" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lastResult && !showAnimation && (
              <div className="result-notification">
                <div className="result-summary">
                  <div className="result-icon">🎋</div>
                  <div className="result-text">
                    <div className="result-title">Fortune Drawn!</div>
                    <div className="result-subtitle">#{lastResult.tokenId} - {fortuneNames[lastResult.result]}</div>
                  </div>
                  <button 
                    className="view-result-button"
                    onClick={() => setShowResult(true)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isConnected && (
          <div className="connect-prompt">
            <p>⛩️ Connect Wallet to Draw Omikuji ⛩️</p>
            <div className="connect-buttons">
              <ConnectButton />
            </div>
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
      
      {/* Creator Attribution */}
      <div className="creator-attribution">
        <a 
          href="https://x.com/d_omajime" 
          target="_blank" 
          rel="noopener noreferrer"
          className="creator-link"
        >
          Created by @d_omajime
        </a>
      </div>
      
      {/* Art Credits Modal Toggle */}
      <div className="art-credits-toggle">
        <button 
          className="credits-button"
          onClick={() => setShowCredits(!showCredits)}
        >
          Credits
        </button>
      </div>
      
      {/* Art Credits Modal */}
      {showCredits && (
        <div className="credits-modal-overlay" onClick={() => setShowCredits(false)}>
          <div className="credits-modal" onClick={(e) => e.stopPropagation()}>
            <div className="credits-header">
              <h3>Credits</h3>
              <button 
                className="credits-close"
                onClick={() => setShowCredits(false)}
              >
                ×
              </button>
            </div>
            <div className="credits-content">
              <div className="credit-item">
                <strong>Super Ultra Great Blessing:</strong><br />
                Inspired by "<a href="https://en.wikipedia.org/wiki/Fine_Wind,_Clear_Morning" target="_blank" rel="noopener noreferrer" className="artwork-link">Fine Wind, Clear Morning</a>" from Thirty-six Views of Mount Fuji by Katsushika Hokusai (葛飾北斎)
              </div>
              <div className="credit-item">
                <strong>Ultra Great Blessing:</strong><br />
                Inspired by "<a href="https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji#:~:text=Thirty%2Dsix%20Views%20of%20Mount%20Fuji%20(Japanese:%20%E5%AF%8C%E5%B6%BD%E4%B8%89,various%20seasons%20and%20weather%20conditions." target="_blank" rel="noopener noreferrer" className="artwork-link">The Great Wave off Kanagawa</a>" by Katsushika Hokusai (葛飾北斎)
              </div>
              <div className="credit-item">
                <strong>Great Blessing:</strong><br />
                Inspired by "<a href="https://collections.mfa.org/objects/211766" target="_blank" rel="noopener noreferrer" className="artwork-link">Minamoto no Yoshitsune on Horseback</a>" by Isoda Koryūsai (磯田湖龍齋)
              </div>
              <div className="credit-item">
                <strong>Middle Blessing:</strong><br />
                Inspired by "<a href="https://www.metmuseum.org/art/collection/search/36674" target="_blank" rel="noopener noreferrer" className="artwork-link">The actor Matsumoto Yonesaburo in the Role of Shinobu Disguised as Courtesan Kewaizaka no Shoushō</a>" by Tōshūsai Sharaku (東洲斎写楽)
              </div>
              <div className="credit-item">
                <strong>Small Blessing:</strong><br />
                Inspired by "<a href="https://www.metmuseum.org/art/collection/search/37358" target="_blank" rel="noopener noreferrer" className="artwork-link">Kabuki Actor Ōtani Oniji III as Yakko Edobei</a>" by Tōshūsai Sharaku (東洲斎写楽)
              </div>
              <div className="credit-item">
                <strong>Blessing:</strong><br />
                Inspired by "<a href="https://commons.wikimedia.org/wiki/File:Kano_Eitoku_002.jpg" target="_blank" rel="noopener noreferrer" className="artwork-link">Chinese Lions (Karajishi)</a>" by Kanō Eitoku (狩野永徳, 1543-1590)
              </div>
              <div className="credit-item">
                <strong>Minor Blessing:</strong><br />
                Inspired by "<a href="https://en.wikipedia.org/wiki/Wind_God_and_Thunder_God_(K%C5%8Drin)" target="_blank" rel="noopener noreferrer" className="artwork-link">Wind God and Thunder God</a>" (風神雷神図) by Tawaraya Sōtatsu (俵屋宗達)
              </div>
              <div className="credit-item">
                <strong>BGM:</strong><br />
                "<a href="https://original-bgm.booth.pm/items/3784404" target="_blank" rel="noopener noreferrer" className="artwork-link">Hurusato</a>" by <a href="https://x.com/hiroseyuki113" target="_blank" rel="noopener noreferrer" className="artwork-link">@hiroseyuki113</a> - Thanks!
              </div>
              <div className="credits-note">
                <small>All original artworks are in the public domain. These NFTs are original interpretations inspired by these masterpieces of Japanese art.</small>
                <br /><br />
                <small><strong>Important Note:</strong> The fortune results are randomly assigned and are not related to the value or rarity of the original artworks depicted in the NFTs.</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Details Modal */}
      {showResult && lastResult && (
        <div className="credits-modal-overlay" onClick={() => setShowResult(false)}>
          <div className="credits-modal" onClick={(e) => e.stopPropagation()}>
            <div className="credits-header">
              <h3>Your Fortune Result</h3>
              <button 
                className="credits-close"
                onClick={() => setShowResult(false)}
              >
                ×
              </button>
            </div>
            <div className="credits-content result-content">
              <div className={`nft-header ${(lastResult.tokenId === '777' || lastResult.tokenId === '7777') ? 'lucky-number' : ''}`}>
                <div className={`nft-number ${(lastResult.tokenId === '777' || lastResult.tokenId === '7777') ? 'lucky-number-glow' : ''}`}>
                  #{lastResult.tokenId}
                  {(lastResult.tokenId === '777' || lastResult.tokenId === '7777') && <span className="lucky-sparkle">✨</span>}
                </div>
                <div className="nft-collection">Omikuji Shrine on Monad NFT</div>
              </div>
              <div className="fortune-result">"{getArtworkInfo(lastResult.result).title}"</div>
              <div className="fortune-type">{fortuneNames[lastResult.result]}</div>
              <div className="nft-image-display">
                <img 
                  src={`https://gateway.pinata.cloud/ipfs/${getIPFSHashForResult(lastResult.result)}`} 
                  alt={fortuneNames[lastResult.result]} 
                  className="nft-image"
                />
              </div>
              
              {/* Share to X Button */}
              <div className="share-section">
                <button 
                  className="share-x-button"
                  onClick={() => shareToX(lastResult)}
                >
                  𝕏 Share on X
                </button>
              </div>
              
              <div className="artwork-info">
                <div className="artwork-title">"{getArtworkInfo(lastResult.result).title}"</div>
                <div className="artwork-artist">by {getArtworkInfo(lastResult.result).artist}</div>
                <div className="artwork-period">{getArtworkInfo(lastResult.result).period}</div>
                <div className="artwork-description">{getArtworkInfo(lastResult.result).description}</div>
              </div>
              <div className="fortune-message">"{lastResult.message}"</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
