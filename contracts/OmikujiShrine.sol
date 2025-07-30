// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OmikujiShrine is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _currentTokenId;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public omikujiPrice = 0.01 ether;
    bool public developmentMode;
    
    enum OmikujiResult { 
        DAI_DAI_DAI_KICHI,  // Super Ultra Great Blessing (大大大吉)
        DAI_DAI_KICHI,      // Ultra Great Blessing (大大吉)
        DAI_KICHI,          // Great Blessing (大吉)
        CHU_KICHI,          // Middle Blessing (中吉)
        SHO_KICHI,          // Small Blessing (小吉)
        KICHI,              // Blessing (吉)
        SUE_KICHI           // Minor Blessing (末吉)
    }
    
    struct Omikuji {
        OmikujiResult result;
        string message;
        uint256 timestamp;
        address drawer;
    }
    
    mapping(uint256 => Omikuji) public omikujis;
    mapping(address => uint256[]) public userOmikujis;
    mapping(address => uint256) public lastDrawTime;
    
    string[7] private fortunes = [
        "Super Ultra Great Blessing (Dai-Dai-Dai-Kichi)",
        "Ultra Great Blessing (Dai-Dai-Kichi)",
        "Great Blessing (Dai-Kichi)",
        "Middle Blessing (Chu-Kichi)",
        "Small Blessing (Sho-Kichi)",
        "Blessing (Kichi)",
        "Minor Blessing (Sue-Kichi)"
    ];
    
    string[7] private messages = [
        "Extraordinary fortune! Everything you touch turns to gold!",
        "Incredible luck awaits! Your dreams will exceed expectations!",
        "Your wishes will come true magnificently!",
        "Steady progress brings great success!",
        "Small steps lead to wonderful achievements!",
        "Good things are coming your way!",
        "Patience will be rewarded with future blessings!"
    ];

    event OmikujiDrawn(address indexed drawer, uint256 indexed tokenId, OmikujiResult result, string message);

    constructor() ERC721("Omikuji Shrine NFT", "OMIKUJI") Ownable(msg.sender) {
        // Enable development mode for local testing (chain ID 31337)
        developmentMode = (block.chainid == 31337);
    }

    function drawOmikuji() external payable returns (uint256) {
        require(msg.value >= omikujiPrice, "Insufficient payment for omikuji");
        require(canDrawOmikuji(msg.sender), "Must wait 24 hours before drawing again");
        require(_currentTokenId < MAX_SUPPLY, "Maximum supply reached");
        
        lastDrawTime[msg.sender] = block.timestamp;
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        
        OmikujiResult result;
        string memory message;
        
        // Special lucky numbers
        if (newTokenId == 777) {
            result = OmikujiResult.DAI_KICHI;
            message = "Lucky #777! The spirits have blessed you with great fortune!";
        } else if (newTokenId == 7777) {
            result = OmikujiResult.DAI_DAI_KICHI;
            message = "Incredible #7777! Ultra rare blessing from the divine spirits!";
        } else {
            // Normal probability distribution
            uint256 randomValue = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                newTokenId
            ))) % 1000;
            
            if (randomValue < 1) {
                // 0.1% (1/1000)
                result = OmikujiResult.DAI_DAI_DAI_KICHI;
            } else if (randomValue < 20) {
                // 1.9% (19/1000)
                result = OmikujiResult.DAI_DAI_KICHI;
            } else if (randomValue < 100) {
                // 8% (80/1000)
                result = OmikujiResult.DAI_KICHI;
            } else if (randomValue < 250) {
                // 15% (150/1000)
                result = OmikujiResult.CHU_KICHI;
            } else if (randomValue < 500) {
                // 25% (250/1000)
                result = OmikujiResult.SHO_KICHI;
            } else if (randomValue < 800) {
                // 30% (300/1000)
                result = OmikujiResult.KICHI;
            } else {
                // 20% (200/1000)
                result = OmikujiResult.SUE_KICHI;
            }
            
            message = messages[uint256(result)];
        }
        
        omikujis[newTokenId] = Omikuji({
            result: result,
            message: message,
            timestamp: block.timestamp,
            drawer: msg.sender
        });
        
        userOmikujis[msg.sender].push(newTokenId);
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, generateTokenURI(newTokenId));
        
        emit OmikujiDrawn(msg.sender, newTokenId, result, message);
        
        return newTokenId;
    }
    
    function generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Omikuji memory omikuji = omikujis[tokenId];
        string memory fortune = fortunes[uint256(omikuji.result)];
        
        string memory json = string(abi.encodePacked(
            '{"name": "Omikuji #', tokenId.toString(), '",',
            '"description": "A traditional Japanese fortune from the digital shrine",',
            '"attributes": [',
                '{"trait_type": "Fortune", "value": "', fortune, '"},',
                '{"trait_type": "Message", "value": "', omikuji.message, '"},',
                '{"trait_type": "Timestamp", "value": ', omikuji.timestamp.toString(), '}',
            '],',
            '"image": "data:image/svg+xml;base64,', generateSVG(omikuji), '"}'
        ));
        
        return string(abi.encodePacked("data:application/json;base64,", base64Encode(bytes(json))));
    }
    
    function generateSVG(Omikuji memory omikuji) internal view returns (string memory) {
        string memory fortune = fortunes[uint256(omikuji.result)];
        string memory color = getColorByResult(omikuji.result);
        
        string memory svg = string(abi.encodePacked(
            '<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="400" height="600" fill="#f5f5dc"/>',
            '<rect x="20" y="20" width="360" height="560" fill="white" stroke="#8b4513" stroke-width="3"/>',
            '<text x="200" y="80" text-anchor="middle" font-family="serif" font-size="24" fill="#8b4513">', unicode"おみくじ", '</text>',
            '<rect x="50" y="120" width="300" height="100" fill="', color, '" rx="10"/>',
            '<text x="200" y="180" text-anchor="middle" font-family="serif" font-size="18" fill="white">', fortune, '</text>',
            '<text x="200" y="250" text-anchor="middle" font-family="serif" font-size="14" fill="#333">', omikuji.message, '</text>',
            '<text x="200" y="500" text-anchor="middle" font-family="serif" font-size="12" fill="#666">Digital Shrine</text>',
            '</svg>'
        ));
        
        return base64Encode(bytes(svg));
    }
    
    function getColorByResult(OmikujiResult result) internal pure returns (string memory) {
        if (result == OmikujiResult.DAI_DAI_DAI_KICHI) return "#ffd700"; // Gold
        if (result == OmikujiResult.DAI_DAI_KICHI) return "#ff6b6b";      // Red
        if (result == OmikujiResult.DAI_KICHI) return "#ff8c42";          // Orange
        if (result == OmikujiResult.CHU_KICHI) return "#4ecdc4";          // Teal
        if (result == OmikujiResult.SHO_KICHI) return "#45b7d1";          // Blue
        if (result == OmikujiResult.KICHI) return "#96ceb4";              // Green
        return "#feca57"; // Yellow for SUE_KICHI
    }
    
    function getUserOmikujis(address user) external view returns (uint256[] memory) {
        return userOmikujis[user];
    }
    
    function canDrawOmikuji(address user) public view returns (bool) {
        if (developmentMode) {
            return true; // Skip cooldown in development mode
        }
        return block.timestamp >= lastDrawTime[user] + 24 hours;
    }
    
    function getTimeUntilNextDraw(address user) external view returns (uint256) {
        if (canDrawOmikuji(user)) {
            return 0;
        }
        return (lastDrawTime[user] + 24 hours) - block.timestamp;
    }
    
    function setOmikujiPrice(uint256 _price) external onlyOwner {
        omikujiPrice = _price;
    }
    
    function setDevelopmentMode(bool _developmentMode) external onlyOwner {
        developmentMode = _developmentMode;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function base64Encode(bytes memory data) internal pure returns (string memory) {
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        if (data.length == 0) return "";
        
        string memory result = new string(4 * ((data.length + 2) / 3));
        bytes memory resultBytes = bytes(result);
        
        uint256 i = 0;
        uint256 j = 0;
        
        for (; i + 3 <= data.length; i += 3) {
            uint256 a = uint256(uint8(data[i]));
            uint256 b = uint256(uint8(data[i + 1]));
            uint256 c = uint256(uint8(data[i + 2]));
            
            uint256 combined = (a << 16) | (b << 8) | c;
            
            resultBytes[j++] = bytes1(uint8(bytes(table)[combined >> 18]));
            resultBytes[j++] = bytes1(uint8(bytes(table)[(combined >> 12) & 63]));
            resultBytes[j++] = bytes1(uint8(bytes(table)[(combined >> 6) & 63]));
            resultBytes[j++] = bytes1(uint8(bytes(table)[combined & 63]));
        }
        
        if (i < data.length) {
            uint256 a = uint256(uint8(data[i]));
            uint256 b = i + 1 < data.length ? uint256(uint8(data[i + 1])) : 0;
            
            uint256 combined = (a << 16) | (b << 8);
            
            resultBytes[j++] = bytes1(uint8(bytes(table)[combined >> 18]));
            resultBytes[j++] = bytes1(uint8(bytes(table)[(combined >> 12) & 63]));
            resultBytes[j++] = i + 1 < data.length ? bytes1(uint8(bytes(table)[(combined >> 6) & 63])) : bytes1("=");
            resultBytes[j++] = bytes1("=");
        }
        
        return result;
    }
}