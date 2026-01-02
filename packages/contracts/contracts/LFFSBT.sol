// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LFFSBT - LFF Soulbound Token
 * @dev Non-transferable NFT for proof of activity (events, quests)
 * @notice Soulbound tokens cannot be transferred after minting
 */
contract LFFSBT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    // Mapping to track minters (backend can mint on behalf of users)
    mapping(address => bool) public authorizedMinters;

    // Token type: EVENT_ATTENDANCE, QUEST_COMPLETION
    enum TokenType { EVENT_ATTENDANCE, QUEST_COMPLETION }

    // Token metadata
    struct TokenMetadata {
        TokenType tokenType;
        string referenceId; // eventId or questId
        uint256 mintedAt;
    }

    mapping(uint256 => TokenMetadata) public tokenMetadata;

    // Events
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed to,
        TokenType tokenType,
        string referenceId
    );
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    error SoulboundTransferNotAllowed();
    error NotAuthorizedMinter();

    constructor(
        address initialOwner
    ) ERC721("LFF Soulbound Token", "LFF-SBT") Ownable(initialOwner) {
        authorizedMinters[initialOwner] = true;
    }

    modifier onlyAuthorizedMinter() {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    /**
     * @dev Authorize a new minter (e.g., backend service wallet)
     */
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @dev Revoke minter authorization
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @dev Mint a new SBT to a user
     * @param to The address to receive the token
     * @param uri The metadata URI for the token
     * @param tokenType The type of token (EVENT or QUEST)
     * @param referenceId The event or quest ID
     */
    function mint(
        address to,
        string memory uri,
        TokenType tokenType,
        string memory referenceId
    ) external onlyAuthorizedMinter returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        tokenMetadata[tokenId] = TokenMetadata({
            tokenType: tokenType,
            referenceId: referenceId,
            mintedAt: block.timestamp
        });

        emit TokenMinted(tokenId, to, tokenType, referenceId);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple SBTs (for efficiency)
     */
    function batchMint(
        address[] calldata recipients,
        string[] calldata uris,
        TokenType tokenType,
        string memory referenceId
    ) external onlyAuthorizedMinter returns (uint256[] memory) {
        require(recipients.length == uris.length, "Array length mismatch");

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _nextTokenId++;

            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);

            tokenMetadata[tokenId] = TokenMetadata({
                tokenType: tokenType,
                referenceId: referenceId,
                mintedAt: block.timestamp
            });

            emit TokenMinted(tokenId, recipients[i], tokenType, referenceId);
            tokenIds[i] = tokenId;
        }

        return tokenIds;
    }

    /**
     * @dev Get tokens owned by an address
     */
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokens;
    }

    /**
     * @dev Check if address owns a token for a specific reference (event/quest)
     */
    function hasTokenForReference(
        address owner,
        string memory referenceId
    ) external view returns (bool) {
        uint256 balance = balanceOf(owner);

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (keccak256(bytes(tokenMetadata[tokenId].referenceId)) == keccak256(bytes(referenceId))) {
                return true;
            }
        }

        return false;
    }

    // ============ Soulbound Overrides ============

    /**
     * @dev Override to prevent transfers (soulbound)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override approve to prevent approvals (soulbound)
     */
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert SoulboundTransferNotAllowed();
    }

    /**
     * @dev Override setApprovalForAll to prevent approvals (soulbound)
     */
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert SoulboundTransferNotAllowed();
    }

    // ============ Required Overrides ============

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
