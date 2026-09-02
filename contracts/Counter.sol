// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    event Counted(address indexed by, uint256 newCount);

    function increment() external {
        unchecked { count++; }
        emit Counted(msg.sender, count);
    }

    function decrement() external {
        require(count > 0, "Counter: underflow");
        unchecked { count--; }
        emit Counted(msg.sender, count);
    }
}
