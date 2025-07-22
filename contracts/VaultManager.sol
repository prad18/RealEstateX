// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}
abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "ERR: zero owner");
        _transferOwnership(initialOwner);
    }
    function owner() public view virtual returns (address) {
        return _owner;
    }
    modifier onlyOwner() {
        require(owner() == _msgSender(), "ERR: not owner");
        _;
    }
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "ERR: zero owner");
        _transferOwnership(newOwner);
    }
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// Minimal interfaces
interface IVerifiedPropertyNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getProperty(uint256 tokenId) external view returns (string memory, uint256, bool);
    function transferFrom(address from, address to, uint256 tokenId) external;
}
interface IHOMEDToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

contract VaultManager is Ownable {
    IVerifiedPropertyNFT public propertyNFT;
    IHOMEDToken public homedToken;
    uint256 public constant LTV = 80;
    uint256 public constant DENOM = 100;

    struct Vault {
        address owner;
        uint256 nftId;
        uint256 loanAmount;
        bool active;
    }
    mapping(uint256 => Vault) public vaults;
    mapping(address => uint256[]) public userVaults;

    event VaultOpened(address indexed user, uint256 indexed nftId, uint256 loanAmount);
    event VaultRepaid(address indexed user, uint256 indexed nftId, uint256 repayAmount);
    event VaultLiquidated(address indexed user, uint256 indexed nftId);

    constructor(address initialOwner, address _propertyNFT, address _homedToken)
        Ownable(initialOwner)
    {
        propertyNFT = IVerifiedPropertyNFT(_propertyNFT);
        homedToken = IHOMEDToken(_homedToken);
    }

    function openVault(uint256 nftId) external {
        require(propertyNFT.ownerOf(nftId) == msg.sender, "ERR: Not NFT owner");
        ( , uint256 valuation, bool verified) = propertyNFT.getProperty(nftId);
        require(verified, "ERR: NFT not verified");
        require(!vaults[nftId].active, "ERR: Vault already active");

        propertyNFT.transferFrom(msg.sender, address(this), nftId);

        uint256 loanAmount = (valuation * LTV) / DENOM;
        require(loanAmount > 0, "ERR: Zero loan");
        require(address(homedToken) != address(0), "ERR: HOMED not set");

        vaults[nftId] = Vault(msg.sender, nftId, loanAmount, true);
        userVaults[msg.sender].push(nftId);

        homedToken.mint(msg.sender, loanAmount);

        emit VaultOpened(msg.sender, nftId, loanAmount);
    }

    function repayAndCloseVault(uint256 nftId, uint256 amount) external {
        Vault storage v = vaults[nftId];
        require(v.active, "ERR: No active vault");
        require(v.owner == msg.sender, "ERR: Not vault owner");
        require(amount >= v.loanAmount, "ERR: Repay full loan");

        homedToken.burn(msg.sender, v.loanAmount);

        propertyNFT.transferFrom(address(this), msg.sender, nftId);

        v.active = false;
        emit VaultRepaid(msg.sender, nftId, amount);
    }

    function liquidateVault(uint256 nftId) external onlyOwner {
        Vault storage v = vaults[nftId];
        require(v.active, "ERR: No active vault");
        v.active = false;
        emit VaultLiquidated(v.owner, nftId);
    }

    function getUserVaults(address user) external view returns (uint256[] memory) {
        return userVaults[user];
    }
}