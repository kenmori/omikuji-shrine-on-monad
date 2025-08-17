import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { formatEther, parseAbiItem } from 'viem';
import { useState, useEffect } from 'react';
import './App.css';
import { localhost, monadTestnet } from './wagmi';
import { usePublicClient } from 'wagmi';

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
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getSelfMintProgress",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getSelfMintedFortunes",
    "outputs": [{"internalType": "uint8[]", "name": "", "type": "uint8[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "checkSelfMintCompletion",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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

// Environment-based configuration
const NETWORK = import.meta.env.VITE_NETWORK || 'localhost';
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '0x1fA02b2d6A771842690194Cf62D91bdd92BfE28d') as `0x${string}`;
const CURRENT_NETWORK = NETWORK === 'localhost' ? localhost : monadTestnet;

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

// Artwork information for each fortune type with detailed descriptions
const artworkInfo = [
  {
    title: "Fine Wind, Clear Morning (from Thirty-six Views of Mount Fuji)",
    artist: "Katsushika Hokusai (葛飾北斎)",
    period: "c. 1830-1832",
    description: "One of Hokusai's most famous works, depicting Mount Fuji in brilliant red at sunrise. Also known as 'Red Fuji', this iconic ukiyo-e print symbolizes good fortune and divine blessing, making it perfect for the rarest omikuji result.",
    overview: "This is one of Hokusai's most celebrated masterpieces from the Thirty-six Views of Mount Fuji series. The print captures Mount Fuji bathed in brilliant red light during sunrise, creating a scene of divine majesty and spiritual significance. Known as 'Red Fuji' or 'South Wind, Clear Sky,' this work represents the mountain at its most auspicious moment.",
    style: "Hokusai's mastery is evident in his use of bold, simplified forms and dramatic color contrasts. The mountain dominates the composition with its perfect triangular silhouette, while subtle gradations in the sky create depth and atmosphere. His technique demonstrates the mature ukiyo-e style at its pinnacle.",
    significance: "This work has become an international symbol of Japanese art and culture. It represents the spiritual connection between humanity and nature in Japanese aesthetics, embodying concepts of mono no aware (the pathos of things) and the eternal beauty of the natural world."
  },
  {
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai (葛飾北斎)",
    period: "c. 1831",
    description: "Perhaps the most recognizable Japanese artwork worldwide, this masterpiece shows a towering wave threatening boats while Mount Fuji stands serene in the background. It represents the power of nature and perseverance.",
    overview: "The most famous ukiyo-e print in the world, depicting a massive wave about to crash down on three boats while Mount Fuji sits calmly in the background. This dynamic composition captures a moment of extreme tension between human vulnerability and nature's overwhelming power.",
    style: "Hokusai's revolutionary composition uses dramatic perspective and movement to create unprecedented dynamism in printmaking. The wave's foam creates claw-like fingers reaching toward the boats, while the geometric stability of Mount Fuji provides visual anchor to the composition.",
    significance: "This work transcended its original medium to become a global icon, influencing Western artists like Debussy and countless contemporary creators. It represents the Japanese understanding of life's fragility and the sublime power of nature."
  },
  {
    title: "Minamoto no Yoshitsune on Horseback",
    artist: "Isoda Koryūsai (磯田湖龍齋)",
    period: "c. 1770s",
    description: "A dynamic ukiyo-e depicting the legendary warrior Minamoto no Yoshitsune mounted in full armor. This artwork embodies strength, courage, and the samurai spirit of medieval Japan.",
    overview: "This powerful print depicts Minamoto no Yoshitsune, one of Japan's most legendary military commanders, in full battle regalia. Yoshitsune was a key figure in the Genpei War and is celebrated in Japanese literature and theater as an ideal of samurai valor and tragic heroism.",
    style: "Koryūsai's distinctive style combines bold outlines with intricate detail work, particularly evident in the elaborate armor decoration and horse's dynamic pose. His use of color and pattern creates visual richness while maintaining clarity of form.",
    significance: "This work exemplifies the Edo period's romanticization of the warrior class and represents the cultural idealization of bushido (the way of the warrior). Yoshitsune remains a beloved figure in Japanese culture, symbolizing loyalty, skill, and tragic destiny."
  },
  {
    title: "The actor Matsumoto Yonesaburo in the Role of Shinobu Disguised as Courtesan Kewaizaka no Shoushō",
    artist: "Tōshūsai Sharaku (東洲斎写楽)",
    period: "1794",
    description: "One of Sharaku's psychologically penetrating actor portraits from the golden age of kabuki theater. Known for capturing the essence and emotion of performers with remarkable realism and intensity.",
    overview: "This portrait captures the kabuki actor Matsumoto Yonesaburo performing as Shinobu disguised as the courtesan Kewaizaka no Shoushō. Sharaku's genius lies in revealing both the actor's physical features and the character's psychological complexity, creating a multi-layered artistic statement.",
    style: "Sharaku's distinctive approach rejected idealized beauty in favor of psychological truth. His bold use of exaggerated features, dramatic expressions, and unconventional poses captured the intensity of live theatrical performance, allowing viewers to experience the actor's transformation.",
    significance: "Sharaku's brief but extraordinary career (just 10 months) produced some of the most psychologically penetrating portraits in art history. His work documents the golden age of kabuki while challenging conventional notions of beauty and representation."
  },
  {
    title: "The Third Otani Oniji as Edo Hyoe (三代目大谷鬼次の江戸兵衛)",
    artist: "Tōshūsai Sharaku (東洲斎写楽)",
    period: "1794",
    description: "Another masterful actor portrait by Sharaku, showing the dramatic expression and character of kabuki performance. Sharaku's brief but brilliant career produced some of the most psychologically complex portraits in Japanese art.",
    overview: "This is one of Toshusai Sharaku's most famous and striking kabuki actor portraits, created around 1794. The print depicts Sandaime Otani Oniji (Third-generation Otani Oniji), a renowned kabuki actor known for his powerful performances in villain roles (katakiyaku), performing as 'Edo Hyoe.' This character was typically portrayed as a rough, intimidating townsman or ruffian from Edo (modern-day Tokyo). Oniji was particularly celebrated for his ability to embody menacing, antagonistic characters with intense physical presence and dramatic facial expressions.",
    style: "Sharaku was famous for his bold, exaggerated portrayals that captured both the actor's physical features and the character's psychological depth. Rather than flattering portraits, he created dramatically stylized images that conveyed the intensity and emotion of live theatrical performance, allowing viewers to experience the stage atmosphere.",
    significance: "This work showcases Sharaku's genius for capturing villain characters' fierce intensity, demonstrating how kabuki actors completely transformed into their roles. Sharaku remains one of art history's greatest mysteries, producing approximately 140 works during just 10 months before vanishing completely. His works serve as invaluable documentation of 18th-century Japanese theater culture and gained international acclaim, representing the pinnacle of ukiyo-e portraiture."
  },
  {
    title: "Chinese Lions (Karajishi)",
    artist: "Kanō Eitoku (狩野永徳)",
    period: "1543-1590",
    description: "A powerful painting of karajishi (Chinese lions) by the master of the Kanō school. These mythical creatures were believed to ward off evil spirits and bring protection, often found guarding temples and shrines.",
    overview: "This magnificent painting depicts karajishi (Chinese lions), mythical protective creatures that originated in Chinese Buddhist art and were adopted into Japanese culture. These lion-dogs were believed to ward off evil spirits and bring divine protection, making them popular subjects for temple and palace decoration.",
    style: "Eitoku's mastery of the Kanō school style is evident in his bold brushwork, dynamic composition, and masterful use of gold backgrounds. His lions possess both fierce power and decorative elegance, demonstrating the synthesis of Chinese influences with native Japanese aesthetic sensibilities.",
    significance: "As the leading artist of the Kanō school during Japan's unification period, Eitoku's works decorated the palaces of military rulers and established the visual language of power in early modern Japan. His karajishi represent the protective spirit that guards sacred spaces and noble households."
  },
  {
    title: "Wind God and Thunder God (風神雷神図)",
    artist: "Tawaraya Sōtatsu (俵屋宗達)",
    period: "c. 1615",
    description: "This iconic folding screen depicts Raijin (Thunder God) and Fūjin (Wind God) amid swirling clouds. A masterpiece of the Rinpa school, it has inspired countless artists and remains one of Japan's most beloved artworks.",
    overview: "This legendary folding screen painting depicts Fūjin (Wind God) and Raijin (Thunder God), two of the most important deities in Japanese Buddhism and Shinto. Set against gold clouds, these powerful figures control the forces of nature, representing the awesome power of wind and thunder in Japanese cosmology.",
    style: "Sōtatsu's revolutionary style combines bold, simplified forms with rich decorative effects. His use of gold backgrounds, dynamic poses, and expressive brushwork established the aesthetic foundation of the Rinpa school, emphasizing decorative beauty and natural motifs.",
    significance: "This masterpiece has inspired generations of Japanese artists, including Ogata Kōrin and modern creators. It represents the Japanese artistic tradition of finding beauty in natural forces and spiritual themes, becoming an enduring symbol of Japanese cultural identity."
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

interface OmikujiHistory {
  id: string;
  tokenId: string;
  result: number;
  message: string;
  date: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
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
  const [omikujiHistory, setOmikujiHistory] = useState<OmikujiHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<number | null>(null);
  
  const publicClient = usePublicClient();

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

  // Get self-mint progress
  const { data: selfMintProgress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'getSelfMintProgress',
    args: address ? [address] : undefined,
  });

  // Get self-minted fortunes
  const { data: selfMintedFortunes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'getSelfMintedFortunes',
    args: address ? [address] : undefined,
  });

  // Check if self-mint completion
  const { data: isCompleted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: OMIKUJI_ABI,
    functionName: 'checkSelfMintCompletion',
    args: address ? [address] : undefined,
  });

  // Debug: Log self-mint data
  useEffect(() => {
    console.log('Self-mint debug:', {
      address,
      selfMintProgress: selfMintProgress ? Number(selfMintProgress) : 0,
      selfMintedFortunes: selfMintedFortunes ? Array.from(selfMintedFortunes).map(n => Number(n)) : [],
      isCompleted
    });
  }, [address, selfMintProgress, selfMintedFortunes, isCompleted]);

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
    
    if (chain?.id !== CURRENT_NETWORK.id) {
      console.log('Wrong network, current chain ID:', chain?.id, 'expected:', CURRENT_NETWORK.id);
      addNotification({
        type: 'error',
        message: `Please switch to ${CURRENT_NETWORK.name} in MetaMask.`,
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
        
        if (randomValue < 50) {
          // 0.5% - Super Ultra Great Blessing
          fortuneResult = 0;
        } else if (randomValue < 200) {
          // 1.5% - Ultra Great Blessing  
          fortuneResult = 1;
        } else if (randomValue < 700) {
          // 5.0% - Great Blessing
          fortuneResult = 2;
        } else if (randomValue < 1700) {
          // 10.0% - Middle Blessing
          fortuneResult = 3;
        } else if (randomValue < 3700) {
          // 20.0% - Small Blessing
          fortuneResult = 4;
        } else if (randomValue < 6700) {
          // 30.0% - Blessing
          fortuneResult = 5;
        } else {
          // 33.0% - Minor Blessing
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
        
        // Reload history after new mint (with delay to allow blockchain to update)
        setTimeout(() => {
          loadOmikujiHistory();
        }, 3000);
        
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

  // Load history from blockchain events
  const loadOmikujiHistory = async () => {
    if (!address || !publicClient) return;
    
    setIsLoadingHistory(true);
    try {
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event OmikujiDrawn(address indexed drawer, uint256 indexed tokenId, uint8 result, string message)'),
        args: {
          drawer: address
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });
      
      const historyItems: OmikujiHistory[] = await Promise.all(
        logs.map(async (log) => {
          const block = await publicClient.getBlock({ blockHash: log.blockHash! });
          return {
            id: log.transactionHash!,
            tokenId: log.args.tokenId!.toString(),
            result: Number(log.args.result!),
            message: log.args.message!,
            date: new Date(Number(block.timestamp) * 1000).toLocaleDateString('ja-JP'),
            timestamp: Number(block.timestamp) * 1000,
            txHash: log.transactionHash!,
            blockNumber: log.blockNumber!
          };
        })
      );
      
      // Sort by timestamp (newest first)
      historyItems.sort((a, b) => b.timestamp - a.timestamp);
      setOmikujiHistory(historyItems.slice(0, 10)); // Keep latest 10
    } catch (error) {
      console.error('Error loading history from blockchain:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history when address changes or on mount
  useEffect(() => {
    if (address && publicClient) {
      loadOmikujiHistory();
    } else {
      setOmikujiHistory([]);
    }
  }, [address, publicClient]);

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
      
      {/* History Control */}
      {(omikujiHistory.length > 0 || isLoadingHistory) && isConnected && (
        <div className="history-control">
          <button 
            className="history-button"
            onClick={() => setShowHistory(!showHistory)}
            title="Omikuji History"
            disabled={isLoadingHistory}
          >
            {isLoadingHistory ? '⏳' : '📜'}
          </button>
          {showHistory && (
            <div className="history-dropdown">
              <div className="history-header">History</div>
              <div className="history-list">
                {isLoadingHistory ? (
                  <div className="history-item">
                    <div className="history-loading">読み込み中...</div>
                  </div>
                ) : omikujiHistory.length === 0 ? (
                  <div className="history-item">
                    <div className="history-empty">履歴がありません</div>
                  </div>
                ) : (
                  omikujiHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-date">{item.date}</div>
                      <div className="history-result">{fortuneNames[item.result]}</div>
                      <div className="history-token">#{item.tokenId}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
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

      {/* Self-Mint Progress Gallery */}
      {isConnected && (
        <div className="gallery-container">
          <div className="gallery-header">
            <div className="gallery-summary">
              <span className="progress-label">Gallery</span>
              {isCompleted && <span className="completion-badge">🏆 COMPLETED!</span>}
            </div>
          </div>
          <div className="fortune-gallery">
            {fortuneNames.map((name, index) => {
              // Convert selfMintedFortunes to numbers and count occurrences
              const selfMintedArray = selfMintedFortunes ? Array.from(selfMintedFortunes).map(n => Number(n)) : [];
              const fortuneCount = selfMintedArray.filter(f => f === index).length;
              const hasFortune = fortuneCount > 0;
              const artworkInfo = getArtworkInfo(index);
              
              // Debug individual fortune check
              console.log(`Fortune ${index} (${name}):`, {
                selfMintedArray,
                fortuneCount,
                hasFortune
              });
              
              return (
                <div key={index} className={`gallery-card ${hasFortune ? 'collected' : 'uncollected'}`}>
                  <div className="gallery-image">
                    <img 
                      src={`https://gateway.pinata.cloud/ipfs/${getIPFSHashForResult(index)}`}
                      alt={name}
                      className="artwork-preview"
                      onClick={() => hasFortune && setSelectedArtwork(index)}
                      style={{ cursor: hasFortune ? 'pointer' : 'default' }}
                    />
                  </div>
                  <div className="gallery-info">
                    <div className="artwork-title">"{artworkInfo.title}"</div>
                    <div className="artwork-artist">by {artworkInfo.artist}</div>
                    {hasFortune && (
                      <div className="fortune-count-text">
                        Amount: {fortuneCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Special NFT Mint Section */}
          <div className="special-mint-section">
            <div className="special-mint-info">
              <h3>🏆 Special Completion NFT</h3>
              <p>Complete your collection by self-minting all 7 fortune types to unlock a special commemorative NFT!</p>
              <p className="self-mint-note">
                <strong>Note:</strong> Special NFT can only be minted through self-mint completion (not purchasable from others)
              </p>
            </div>
            <div className="special-mint-button-container">
              <button 
                className="special-mint-button"
                disabled={true}
                title="Coming Soon"
              >
                🚀 Mint Special NFT - Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                    href={`${CURRENT_NETWORK.blockExplorers?.default?.url || '#'}/tx/${notification.txHash}`}
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
      
      {/* Artwork Detail Modal */}
      {selectedArtwork !== null && (
        <div className="artwork-modal-overlay" onClick={() => setSelectedArtwork(null)}>
          <div className="artwork-modal" onClick={(e) => e.stopPropagation()}>
            <div className="artwork-modal-header">
              <h3>{getArtworkInfo(selectedArtwork).title}</h3>
              <button 
                className="artwork-modal-close"
                onClick={() => setSelectedArtwork(null)}
              >
                ×
              </button>
            </div>
            <div className="artwork-modal-content">
              <div className="artwork-modal-image">
                <img 
                  src={`https://gateway.pinata.cloud/ipfs/${getIPFSHashForResult(selectedArtwork)}`}
                  alt={getArtworkInfo(selectedArtwork).title}
                  className="expanded-artwork"
                />
              </div>
              <div className="artwork-modal-info">
                <div className="artwork-meta">
                  <div className="artwork-title-large">{getArtworkInfo(selectedArtwork).title}</div>
                  <div className="artwork-artist-large">{getArtworkInfo(selectedArtwork).artist}</div>
                  <div className="artwork-period-large">{getArtworkInfo(selectedArtwork).period}</div>
                </div>
                
                <div className="artwork-section">
                  <h4>Overview</h4>
                  <p>{getArtworkInfo(selectedArtwork).overview}</p>
                </div>
                
                <div className="artwork-section">
                  <h4>{selectedArtwork === 2 ? "Koryūsai's Distinctive Style" : selectedArtwork === 3 || selectedArtwork === 4 ? "Sharaku's Distinctive Style" : "Distinctive Style"}</h4>
                  <p>{getArtworkInfo(selectedArtwork).style}</p>
                </div>
                
                <div className="artwork-section">
                  <h4>Historical Significance</h4>
                  <p>{getArtworkInfo(selectedArtwork).significance}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
