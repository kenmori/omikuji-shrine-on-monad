// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UpdatedIPFSOmikujiNFT is ERC721, Ownable {
    
    uint256 private _currentTokenId;
    uint256 public omikujiPrice = 0.1 ether; // 0.1 MON
    
    // IPFS基本URL (メタデータ用)
    string private _baseTokenURI = "https://gateway.pinata.cloud/ipfs/bafybeiheroulmr3bs5sxyllk4xpikceu7soquqg4ipvhmkdtpmpujrgtky/";
    
    // 各運勢タイプのIPFSハッシュ（表示用、メタデータには含まれない）
    mapping(uint8 => string) public fortuneImages;
    
    // Pack fortune data into single storage slot for gas efficiency
    struct Fortune {
        uint8 result;      // 0-6 fortune types
        uint32 timestamp;  // Reduced from uint256 to save gas
        address drawer;    // 20 bytes
    }
    
    // Events
    event OmikujiDrawn(
        address indexed drawer,
        uint256 indexed tokenId,
        uint8 result,
        string message
    );
    
    event TokensBurned(
        address indexed burner,
        uint256[] tokenIds,
        uint8 fortuneType,
        uint256 freeMintGranted
    );
    
    // Mappings
    mapping(uint256 => Fortune) public fortunes;
    
    // Self-mint tracking for completion rewards
    mapping(address => uint8[]) public selfMintedFortunes;
    mapping(address => bool) public hasCompletedSelfMint;
    
    // Burn system for rerolling
    mapping(address => uint256) public freeMints; // Track free mints from burning
    
    // Predefined messages to save gas
    string[7] private messages = [
        "Extraordinary fortune awaits! Everything turns to gold!",
        "Incredible luck! Your dreams exceed expectations!",
        "Great fortune smiles upon you today!",
        "Balanced luck brings steady progress!",
        "Small blessings lead to bigger opportunities!",
        "Good things come to those who wait!",
        "Patience brings the sweetest rewards!"
    ];
    
    string[7] private fortuneNames = [
        "Super Ultra Great Blessing",
        "Ultra Great Blessing", 
        "Great Blessing",
        "Middle Blessing",
        "Small Blessing",
        "Blessing",
        "Minor Blessing"
    ];
    
    constructor() ERC721("Omikuji Shrine on Monad NFT", "OMIKUJI") Ownable(msg.sender) {
        // デフォルトのサンプルIPFSハッシュを設定
        _setDefaultImageHashes();
    }
    
    function drawOmikuji() external payable returns (uint256) {
        // Check cooldown period (24 hours)
        require(block.timestamp >= lastDrawTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown period not met");
        
        // Check if user has free mints from burning
        if (freeMints[msg.sender] > 0) {
            freeMints[msg.sender]--;
        } else {
            require(msg.value >= omikujiPrice, "Insufficient payment");
        }
        
        // Update last draw time
        lastDrawTime[msg.sender] = block.timestamp;
        
        unchecked {
            _currentTokenId++;
        }
        uint256 newTokenId = _currentTokenId;
        
        // 確率ベースのランダム生成（より現実的な確率分布）
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            newTokenId
        ))) % 10000; // 0-9999の範囲
        
        uint8 result;
        
        // 確率分布（合計10000）
        if (randomValue < 50) {
            // 0.5% (50/10000) - Super Ultra Great Blessing
            result = 0;
        } else if (randomValue < 200) {
            // 1.5% (150/10000) - Ultra Great Blessing  
            result = 1;
        } else if (randomValue < 700) {
            // 5.0% (500/10000) - Great Blessing
            result = 2;
        } else if (randomValue < 1700) {
            // 10.0% (1000/10000) - Middle Blessing
            result = 3;
        } else if (randomValue < 3700) {
            // 20.0% (2000/10000) - Small Blessing
            result = 4;
        } else if (randomValue < 6700) {
            // 30.0% (3000/10000) - Blessing
            result = 5;
        } else {
            // 33.0% (3300/10000) - Minor Blessing
            result = 6;
        }
        
        // Store fortune data in packed struct
        fortunes[newTokenId] = Fortune({
            result: result,
            timestamp: uint32(block.timestamp),
            drawer: msg.sender
        });
        
        // Record self-mint for completion tracking
        selfMintedFortunes[msg.sender].push(result);
        
        // Check if user completed all 7 types
        if (!hasCompletedSelfMint[msg.sender] && _checkSelfMintCompletion(msg.sender)) {
            hasCompletedSelfMint[msg.sender] = true;
        }
        
        // Mint NFT to sender
        _mint(msg.sender, newTokenId);
        
        emit OmikujiDrawn(msg.sender, newTokenId, result, messages[result]);
        
        return newTokenId;
    }
    
    // ミント済み数を取得
    function totalSupply() external view returns (uint256) {
        return _currentTokenId;
    }
    
    // 無制限供給のため、常に大きな数値を返す
    function remainingSupply() external view returns (uint256) {
        return type(uint256).max - _currentTokenId;
    }
    
    // IPFS画像ハッシュを設定（オーナーのみ）
    function setFortuneImageHash(uint8 fortuneType, string memory ipfsHash) external onlyOwner {
        require(fortuneType < 7, "Invalid fortune type");
        fortuneImages[fortuneType] = ipfsHash;
    }
    
    // 複数の画像ハッシュを一括設定
    function setAllFortuneImageHashes(string[7] memory ipfsHashes) external onlyOwner {
        for (uint8 i = 0; i < 7; i++) {
            fortuneImages[i] = ipfsHashes[i];
        }
    }
    
    // ベースURIを設定
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    // トークンURIを生成（静的IPFSメタデータ）
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        Fortune memory fortune = fortunes[tokenId];
        
        // 各運勢タイプに基づいて静的メタデータファイルを参照
        return string(abi.encodePacked(_baseTokenURI, _toString(fortune.result), ".json"));
    }
    
    // Cooldown mapping - 24 hours
    mapping(address => uint256) public lastDrawTime;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;
    
    // View functions
    function canDrawOmikuji(address user) external view returns (bool) {
        return block.timestamp >= lastDrawTime[user] + COOLDOWN_PERIOD;
    }
    
    function getTimeUntilNextDraw(address user) external view returns (uint256) {
        uint256 nextDrawTime = lastDrawTime[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= nextDrawTime) {
            return 0;
        }
        return nextDrawTime - block.timestamp;
    }
    
    function getFortuneMessage(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return messages[fortunes[tokenId].result];
    }
    
    function getFortuneData(uint256 tokenId) external view returns (uint8 result, uint32 timestamp, address drawer) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Fortune memory fortune = fortunes[tokenId];
        return (fortune.result, fortune.timestamp, fortune.drawer);
    }
    
    function getFortuneImageUrl(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Fortune memory fortune = fortunes[tokenId];
        return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", fortuneImages[fortune.result]));
    }
    
    // 確率情報を取得
    function getProbabilities() external pure returns (uint16[7] memory) {
        return [50, 150, 500, 1000, 2000, 3000, 3300]; // 0.5%, 1.5%, 5%, 10%, 20%, 30%, 33%
    }
    
    // Check if user has completed self-mint of all 7 fortune types
    function checkSelfMintCompletion(address user) external view returns (bool) {
        return _checkSelfMintCompletion(user);
    }
    
    // Get user's self-minted fortune types
    function getSelfMintedFortunes(address user) external view returns (uint8[] memory) {
        return selfMintedFortunes[user];
    }
    
    // Get progress of self-mint completion (0-7)
    function getSelfMintProgress(address user) external view returns (uint8) {
        bool[7] memory hasFortune;
        uint8[] memory minted = selfMintedFortunes[user];
        
        for(uint i = 0; i < minted.length; i++) {
            if(minted[i] < 7) {
                hasFortune[minted[i]] = true;
            }
        }
        
        uint8 count = 0;
        for(uint i = 0; i < 7; i++) {
            if(hasFortune[i]) count++;
        }
        
        return count;
    }
    
    // Burn 3 tokens of the same type (Blessing or Minor Blessing) for 1 free mint
    function burnForReroll(uint256[] calldata tokenIds) external {
        require(tokenIds.length == 3, "Must burn exactly 3 tokens");
        
        uint8 fortuneType = fortunes[tokenIds[0]].result;
        require(fortuneType == 5 || fortuneType == 6, "Can only burn Blessing or Minor Blessing");
        
        // Verify all tokens are the same type and owned by sender
        for (uint i = 0; i < 3; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
            require(fortunes[tokenIds[i]].result == fortuneType, "All tokens must be same fortune type");
            _burn(tokenIds[i]);
        }
        
        // Remove 3 entries of this fortune type from selfMintedFortunes
        _removeSelfMintedFortunes(msg.sender, fortuneType, 3);
        
        // Grant 1 free mint
        freeMints[msg.sender]++;
        
        emit TokensBurned(msg.sender, tokenIds, fortuneType, 1);
    }
    
    // Burn 3 tokens and immediately mint a new one (atomic operation)
    function burnAndMint(uint256[] calldata tokenIds) external returns (uint256) {
        require(tokenIds.length == 3, "Must burn exactly 3 tokens");
        
        uint8 fortuneType = fortunes[tokenIds[0]].result;
        require(fortuneType == 5 || fortuneType == 6, "Can only burn Blessing or Minor Blessing");
        
        // Verify all tokens are the same type and owned by sender
        for (uint i = 0; i < 3; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
            require(fortunes[tokenIds[i]].result == fortuneType, "All tokens must be same fortune type");
            _burn(tokenIds[i]);
        }
        
        // Remove 3 entries of this fortune type from selfMintedFortunes
        _removeSelfMintedFortunes(msg.sender, fortuneType, 3);
        
        // Emit burn event
        emit TokensBurned(msg.sender, tokenIds, fortuneType, 0); // 0 free mints since we mint immediately
        
        // Immediately mint new omikuji (same logic as drawOmikuji but without payment)
        unchecked {
            _currentTokenId++;
        }
        uint256 newTokenId = _currentTokenId;
        
        // Generate random result using same probability distribution
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            newTokenId,
            tokenIds[0] // Add burned token as additional entropy
        ))) % 10000; // 0-9999の範囲
        
        uint8 result;
        
        // Same probability distribution as drawOmikuji
        if (randomValue < 50) {
            result = 0; // 0.5% - Super Ultra Great Blessing
        } else if (randomValue < 200) {
            result = 1; // 1.5% - Ultra Great Blessing  
        } else if (randomValue < 700) {
            result = 2; // 5.0% - Great Blessing
        } else if (randomValue < 1700) {
            result = 3; // 10.0% - Middle Blessing
        } else if (randomValue < 3700) {
            result = 4; // 20.0% - Small Blessing
        } else if (randomValue < 6700) {
            result = 5; // 30.0% - Blessing
        } else {
            result = 6; // 33.0% - Minor Blessing
        }
        
        // Store fortune data
        fortunes[newTokenId] = Fortune({
            result: result,
            timestamp: uint32(block.timestamp),
            drawer: msg.sender
        });
        
        // Record self-mint for completion tracking
        selfMintedFortunes[msg.sender].push(result);
        
        // Check if user completed all 7 types
        if (!hasCompletedSelfMint[msg.sender] && _checkSelfMintCompletion(msg.sender)) {
            hasCompletedSelfMint[msg.sender] = true;
        }
        
        // Mint NFT to sender
        _mint(msg.sender, newTokenId);
        
        emit OmikujiDrawn(msg.sender, newTokenId, result, messages[result]);
        
        return newTokenId;
    }
    
    // Check how many tokens of specific type user owns
    function getOwnedTokensByType(address owner, uint8 fortuneType) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tempTokens = new uint256[](balance);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (_ownerOf(i) == owner && fortunes[i].result == fortuneType) {
                tempTokens[count] = i;
                count++;
            }
        }
        
        // Create array with exact size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempTokens[i];
        }
        
        return result;
    }
    
    // Check if user can burn for reroll
    function canBurnForReroll(address user) external view returns (bool, uint8, uint256) {
        // Check Blessing (5)
        uint256 blessingCount = 0;
        // Check Minor Blessing (6)  
        uint256 minorBlessingCount = 0;
        
        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (_ownerOf(i) == user) {
                if (fortunes[i].result == 5) blessingCount++;
                if (fortunes[i].result == 6) minorBlessingCount++;
            }
        }
        
        if (blessingCount >= 3) return (true, 5, blessingCount);
        if (minorBlessingCount >= 3) return (true, 6, minorBlessingCount);
        
        return (false, 0, 0);
    }
    
    // Internal function to check completion
    function _checkSelfMintCompletion(address user) internal view returns (bool) {
        bool[7] memory hasFortune;
        uint8[] memory minted = selfMintedFortunes[user];
        
        for(uint i = 0; i < minted.length; i++) {
            if(minted[i] < 7) {
                hasFortune[minted[i]] = true;
            }
        }
        
        for(uint i = 0; i < 7; i++) {
            if(!hasFortune[i]) return false;
        }
        
        return true;
    }
    
    // Internal function to remove specific fortune types from selfMintedFortunes
    function _removeSelfMintedFortunes(address user, uint8 fortuneType, uint256 count) internal {
        uint8[] storage userFortunes = selfMintedFortunes[user];
        uint256 removed = 0;
        
        // Remove from the end to avoid index shifting issues
        for (int i = int(userFortunes.length) - 1; i >= 0 && removed < count; i--) {
            if (userFortunes[uint(i)] == fortuneType) {
                // Remove this element by moving the last element here and popping
                userFortunes[uint(i)] = userFortunes[userFortunes.length - 1];
                userFortunes.pop();
                removed++;
            }
        }
    }
    

    // Owner functions
    function setPrice(uint256 _price) external onlyOwner {
        omikujiPrice = _price;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // デフォルト画像ハッシュを設定
    function _setDefaultImageHashes() private {
        // 実際のIPFSハッシュ
        fortuneImages[0] = "bafybeid2uda5hamkzb4lse5rc7htcbcjffo7dgukjo4bjqdjuvhe44gg7a"; // Super Ultra Great
        fortuneImages[1] = "bafybeihs5auuxwu44f4geqwhgyzdoamdgaqxj6wbtcws47ft64mayaxsce"; // Ultra Great
        fortuneImages[2] = "bafybeicart4oeg6gxhqgivm5knbooqn4bxa374jpg73aqdehz234zh6qum"; // Great
        fortuneImages[3] = "bafybeihmntq3rxhd5j6nxk6j3vblzq6rhloiz2ircmdwg243raczy7qlau"; // Middle
        fortuneImages[4] = "bafkreigio3u25g2pgbfo3ajohy5qcida74akfln3ttlxh443xgjy33ospm"; // Small
        fortuneImages[5] = "bafybeidlyt73ucjmtczrtcvdcfksulgfpx5gdag2j76hqdo3kcpdx2v2ve"; // Blessing
        fortuneImages[6] = "bafybeiee2kczjgzseaqan5ldewlschfwalexzygehewu6joeow2etbkera"; // Minor
    }
    
    // レア度文字列を取得
    function _getRarityString(uint8 result) private pure returns (string memory) {
        if (result == 0) return "Legendary (0.1%)";
        if (result == 1) return "Epic (1.0%)";
        if (result == 2) return "Rare (5.0%)";
        if (result == 3) return "Uncommon (10.0%)";
        if (result == 4) return "Common (20.0%)";
        if (result == 5) return "Common (30.0%)";
        return "Common (33.9%)";
    }
    
    // Helper functions
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
    
    function _base64encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            let tablePtr := add(table, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 32)
            
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr( 6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(        input,  0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
            
            mstore(result, encodedLen)
        }
        
        return result;
    }
}