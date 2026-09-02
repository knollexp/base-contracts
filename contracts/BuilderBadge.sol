// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BuilderBadge
/// @notice A one-per-address, non-transferable claim record.
/// @dev Not an ERC-721. There is no tokenId, no approval and no transfer, on
///      purpose: the badge is meant to be bound to the address that earned
///      it. The name and symbol exist only so explorers have something to
///      show.
contract BuilderBadge {
    /// @notice Human-readable name of the badge.
    string public constant name = "Base Builder Badge";

    /// @notice Short symbol of the badge.
    string public constant symbol = "BBB";

    /// @notice Whether an address has claimed its badge.
    mapping(address => bool) public claimed;

    /// @notice Unix time at which an address claimed, or zero.
    mapping(address => uint64) public claimedAt;

    /// @notice How many badges have been claimed in total.
    /// @dev Doubles as the sequence number handed out to the next claimer,
    ///      which is why a rejected claim must not increment it.
    uint256 public totalClaimed;

    /// @notice Emitted on each successful claim.
    /// @param builder The claiming address.
    /// @param number The claim's position in the sequence, starting at one.
    /// @param timestamp Block time of the claim.
    event Claimed(address indexed builder, uint256 indexed number, uint64 timestamp);

    /// @notice Claims the badge for the caller.
    /// @dev Reverts on a second call so the sequence stays dense and every
    ///      number maps to exactly one address.
    function claim() external {
        require(!claimed[msg.sender], "Badge: already claimed");
        claimed[msg.sender] = true;
        claimedAt[msg.sender] = uint64(block.timestamp);
        totalClaimed++;
        emit Claimed(msg.sender, totalClaimed, uint64(block.timestamp));
    }
}
