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

interface IERC165 { function supportsInterface(bytes4 interfaceId) external view returns (bool); }
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}
interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}
interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}
library Address {
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
contract ERC721 is Context, ERC165, IERC721 {
    using Address for address;
    string private _name;
    string private _symbol;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId || super.supportsInterface(interfaceId);
    }
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: balance query for zero");
        return _balances[owner];
    }
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent");
        return owner;
    }
    function name() public view virtual returns (string memory) { return _name; }
    function symbol() public view virtual returns (string memory) { return _symbol; }
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()), "ERC721: approve caller not owner nor approved for all");
        _approve(to, tokenId);
    }
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_exists(tokenId), "ERC721: approved query for nonexistent");
        return _tokenApprovals[tokenId];
    }
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != _msgSender(), "ERC721: approve to caller");
        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller not owner nor approved");
        _transfer(from, to, tokenId);
    }
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non receiver");
    }
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "ERC721: operator query for nonexistent");
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }
    function _safeMint(address to, uint256 tokenId, bytes memory _data) internal virtual {
        _mint(to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, _data), "ERC721: transfer to non receiver");
    }
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to zero");
        require(!_exists(tokenId), "ERC721: token already minted");
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }
    function _burn(uint256 tokenId) internal virtual {
        address owner = ownerOf(tokenId);
        _approve(address(0), tokenId);
        _balances[owner] -= 1;
        delete _owners[tokenId];
        emit Transfer(owner, address(0), tokenId);
    }
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect");
        require(to != address(0), "ERC721: transfer to zero");
        _approve(address(0), tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non receiver");
                } else {
                    assembly { revert(add(32, reason), mload(reason)) }
                }
            }
        } else {
            return true;
        }
    }
}

contract VerifiedPropertyNFT is ERC721, Ownable {
    uint256 public nextTokenId;

    struct Property {
        string ipfsHash;
        uint256 valuation;
        bool verified;
    }
    mapping(uint256 => Property) public properties;
    event PropertyMinted(address indexed to, uint256 indexed tokenId, string ipfsHash, uint256 valuation);
    event PropertyVerified(uint256 indexed tokenId, bool verified);

    constructor(address initialOwner)
        ERC721("VerifiedPropertyNFT", "vPROP")
        Ownable(initialOwner)
    {}

    function mint(address to, string calldata ipfsHash, uint256 valuation) external onlyOwner {
        require(to != address(0), "ERR: mint to zero");
        require(bytes(ipfsHash).length > 0, "ERR: empty IPFS hash");
        require(valuation > 0, "ERR: valuation must be > 0");
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        properties[tokenId] = Property(ipfsHash, valuation, false);
        emit PropertyMinted(to, tokenId, ipfsHash, valuation);
    }
    function setVerified(uint256 tokenId, bool status) external onlyOwner {
        require(_exists(tokenId), "ERR: NFT does not exist");
        properties[tokenId].verified = status;
        emit PropertyVerified(tokenId, status);
    }
    function getProperty(uint256 tokenId) external view returns (string memory ipfsHash, uint256 valuation, bool verified) {
        require(_exists(tokenId), "ERR: NFT does not exist");
        Property memory prop = properties[tokenId];
        return (prop.ipfsHash, prop.valuation, prop.verified);
    }
    function updateValuation(uint256 tokenId, uint256 newValuation) external onlyOwner {
        require(_exists(tokenId), "ERR: NFT does not exist");
        require(newValuation > 0, "ERR: valuation must be > 0");
        properties[tokenId].valuation = newValuation;
    }
    function totalSupply() external view returns (uint256) {
        return nextTokenId;
    }

    // NEW FUNCTION: Get all token IDs owned by a specific address
    function getTokenIdsByOwner(address owner) external view returns (uint256[] memory) {
        require(owner != address(0), "ERR: query for zero address");
        
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        
        uint256 index = 0;
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }
}