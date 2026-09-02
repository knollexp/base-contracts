// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BuilderBadge {
    string public constant name = "Base Builder Badge";
    string public constant symbol = "BBB";

    mapping(address => bool) public claimed;
    mapping(address => uint64) public claimedAt;
    uint256 public totalClaimed;

    event Claimed(address indexed builder, uint256 indexed number, uint64 timestamp);

    function claim() external {
        require(!claimed[msg.sender], "Badge: already claimed");
        claimed[msg.sender] = true;
        claimedAt[msg.sender] = uint64(block.timestamp);
        totalClaimed++;
        emit Claimed(msg.sender, totalClaimed, uint64(block.timestamp));
    }
}
