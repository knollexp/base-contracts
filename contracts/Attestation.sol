// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Attestation
/// @notice Records that an address vouched for a digest, and when.
/// @dev Only the digest is stored, never the underlying document, so the
///      content stays private until its holder chooses to reveal it. The
///      timestamp doubles as the existence flag, which is why a zero value
///      means "never attested" and the contract must not be deployed to a
///      chain whose genesis timestamp is zero.
contract Attestation {
    /// @notice Unix time at which an attester vouched for a digest, or zero.
    /// @dev Keyed digest first so all attesters of one digest share a slot
    ///      prefix.
    mapping(bytes32 => mapping(address => uint64)) public attestedAt;

    /// @notice Emitted on each new attestation.
    /// @param digest The digest that was vouched for.
    /// @param attester The address that vouched for it.
    /// @param timestamp Block time of the attestation.
    event Attested(bytes32 indexed digest, address indexed attester, uint64 timestamp);

    /// @notice Vouches for a digest under the caller's address.
    /// @dev Reverts on a repeat so the original timestamp is never
    ///      overwritten by a later one.
    /// @param digest Hash of whatever is being attested to.
    function attest(bytes32 digest) external {
        require(attestedAt[digest][msg.sender] == 0, "Attestation: duplicate");
        uint64 ts = uint64(block.timestamp);
        attestedAt[digest][msg.sender] = ts;
        emit Attested(digest, msg.sender, ts);
    }

    /// @notice Whether an attester has vouched for a digest.
    /// @param digest The digest to look up.
    /// @param attester The address to look up.
    /// @return True if an attestation exists.
    function hasAttested(bytes32 digest, address attester) external view returns (bool) {
        return attestedAt[digest][attester] != 0;
    }
}
