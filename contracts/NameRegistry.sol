// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title NameRegistry
/// @notice A first-come, first-served registry binding one name to one
///         address.
/// @dev The two mappings are inverses of each other and must be kept in
///      step: releasing clears both, and registering writes both. A name is
///      a raw bytes32, so callers decide the encoding and no normalisation
///      happens here - "Alice" and "alice" are different names.
///
///      Registration is not front-running resistant. A pending register call
///      is visible in the mempool and can be taken by a higher-paying
///      transaction; a commit-reveal scheme would be needed to prevent that.
contract NameRegistry {
    /// @notice The address holding a name, or the zero address.
    mapping(bytes32 => address) public ownerOf;

    /// @notice The name held by an address, or zero.
    mapping(address => bytes32) public nameOf;

    /// @notice Emitted when a name is claimed.
    /// @param name The claimed name.
    /// @param owner The address that claimed it.
    event Registered(bytes32 indexed name, address indexed owner);

    /// @notice Emitted when a name is given up.
    /// @param name The released name.
    /// @param owner The address that released it.
    event Released(bytes32 indexed name, address indexed owner);

    /// @notice Claims a free name for the caller.
    /// @dev Rejects the zero name because zero is the sentinel for "no name"
    ///      in nameOf, and allowing it would make the two mappings
    ///      inconsistent.
    /// @param name The name to claim.
    function register(bytes32 name) external {
        require(name != bytes32(0), "Registry: empty name");
        require(ownerOf[name] == address(0), "Registry: taken");
        require(nameOf[msg.sender] == bytes32(0), "Registry: already named");
        ownerOf[name] = msg.sender;
        nameOf[msg.sender] = name;
        emit Registered(name, msg.sender);
    }

    /// @notice Gives up the caller's name, making it claimable again.
    function release() external {
        bytes32 name = nameOf[msg.sender];
        require(name != bytes32(0), "Registry: no name");
        delete ownerOf[name];
        delete nameOf[msg.sender];
        emit Released(name, msg.sender);
    }
}
