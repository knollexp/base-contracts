// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Greeter {
    string public greeting;
    address public immutable deployer;

    event GreetingChanged(address indexed by, string greeting);

    constructor() {
        deployer = msg.sender;
        greeting = "gm base";
    }

    function setGreeting(string calldata newGreeting) external {
        greeting = newGreeting;
        emit GreetingChanged(msg.sender, newGreeting);
    }
}
