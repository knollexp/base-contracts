// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Whitelist
/// @notice An owner-managed allowlist of addresses.
/// @dev Ownership transfer is single-step. That is the weaker of the two
///      common designs, since handing ownership to an address that cannot
///      act is irreversible; it is kept here because the contract has no
///      funds and no upgrade path, so the blast radius is one allowlist.
contract Whitelist {
    /// @notice The address permitted to change the allowlist.
    address public owner;

    /// @notice Whether an address is currently allowed.
    mapping(address => bool) public allowed;

    /// @notice Emitted when an address is added.
    /// @param account The address that was allowed.
    event Allowed(address indexed account);

    /// @notice Emitted when an address is removed.
    /// @param account The address that was revoked.
    event Revoked(address indexed account);

    /// @notice Emitted on construction and on every ownership change.
    /// @param from The previous owner, or the zero address on construction.
    /// @param to The new owner.
    event OwnershipTransferred(address indexed from, address indexed to);

    /// @dev Rejects any caller that is not the current owner.
    modifier onlyOwner() {
        require(msg.sender == owner, "Whitelist: not owner");
        _;
    }

    /// @notice Makes the deployer the initial owner.
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice Adds an address to the allowlist.
    /// @param account The address to allow.
    function allow(address account) external onlyOwner {
        allowed[account] = true;
        emit Allowed(account);
    }

    /// @notice Removes an address from the allowlist.
    /// @param account The address to revoke.
    function revoke(address account) external onlyOwner {
        allowed[account] = false;
        emit Revoked(account);
    }

    /// @notice Hands ownership to another address.
    /// @dev Guards against the zero address, which would leave the allowlist
    ///      permanently frozen. It cannot guard against a wrong but non-zero
    ///      address.
    /// @param newOwner The address that will own the allowlist.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Whitelist: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
