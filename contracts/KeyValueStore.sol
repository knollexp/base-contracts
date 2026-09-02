// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title KeyValueStore
/// @notice Per-address string storage under caller-chosen keys.
/// @dev Every address gets its own namespace, so two owners can use the same
///      key without colliding and no owner can overwrite another's value.
///      Values are public on-chain data despite the private mapping; the
///      modifier only hides the automatic getter.
contract KeyValueStore {
    mapping(address => mapping(bytes32 => string)) private _values;

    /// @notice Emitted whenever a value is written.
    /// @param owner The address whose namespace was written to.
    /// @param key The key that was set.
    /// @param value The value that is now stored.
    event ValueSet(address indexed owner, bytes32 indexed key, string value);

    /// @notice Stores a value under a key in the caller's namespace.
    /// @dev Overwrites silently; there is no create-versus-update
    ///      distinction.
    /// @param key The key to write.
    /// @param value The value to store. May be empty, which is
    ///        indistinguishable from never having been set.
    function set(bytes32 key, string calldata value) external {
        _values[msg.sender][key] = value;
        emit ValueSet(msg.sender, key, value);
    }

    /// @notice Reads a value from an owner's namespace.
    /// @param owner The namespace to read from.
    /// @param key The key to read.
    /// @return The stored value, or an empty string if unset.
    function get(address owner, bytes32 key) external view returns (string memory) {
        return _values[owner][key];
    }
}
