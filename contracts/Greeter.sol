// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Greeter
/// @notice Holds a single greeting string that anyone may replace.
/// @dev There is no access control by design; the contract is a minimal
///      example of mutable string storage and of an immutable set at
///      construction time.
contract Greeter {
    /// @notice The current greeting.
    string public greeting;

    /// @notice The address that deployed this contract.
    /// @dev Immutable, so it costs no storage slot and cannot be changed.
    address public immutable deployer;

    /// @notice Emitted whenever the greeting is replaced.
    /// @param by The address that set the new greeting.
    /// @param greeting The greeting that is now stored.
    event GreetingChanged(address indexed by, string greeting);

    /// @notice Records the deployer and seeds the default greeting.
    constructor() {
        deployer = msg.sender;
        greeting = "gm base";
    }

    /// @notice Replaces the stored greeting.
    /// @param newGreeting The greeting to store. May be empty and has no
    ///        length limit beyond what the caller is willing to pay for.
    function setGreeting(string calldata newGreeting) external {
        greeting = newGreeting;
        emit GreetingChanged(msg.sender, newGreeting);
    }
}
