// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Counter
/// @notice A single shared counter that anyone may move up or down.
/// @dev The counter is deliberately global rather than per-address: it is the
///      smallest contract in this set and exists as a baseline for gas
///      comparisons against the per-address contracts.
contract Counter {
    /// @notice Current value of the counter.
    uint256 public count;

    /// @notice Emitted after every successful change.
    /// @param by The address that moved the counter.
    /// @param newCount The value after the change.
    event Counted(address indexed by, uint256 newCount);

    /// @notice Increases the counter by one.
    /// @dev Wrapped in unchecked because reaching 2**256-1 by single
    ///      increments is not reachable in practice.
    function increment() external {
        unchecked {
            count++;
        }
        emit Counted(msg.sender, count);
    }

    /// @notice Decreases the counter by one.
    /// @dev Reverts rather than wrapping around when the counter is zero.
    function decrement() external {
        require(count > 0, "Counter: underflow");
        unchecked {
            count--;
        }
        emit Counted(msg.sender, count);
    }
}
