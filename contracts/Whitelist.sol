// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Whitelist {
    address public owner;
    mapping(address => bool) public allowed;

    event Allowed(address indexed account);
    event Revoked(address indexed account);
    event OwnershipTransferred(address indexed from, address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Whitelist: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function allow(address account) external onlyOwner {
        allowed[account] = true;
        emit Allowed(account);
    }

    function revoke(address account) external onlyOwner {
        allowed[account] = false;
        emit Revoked(account);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Whitelist: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
