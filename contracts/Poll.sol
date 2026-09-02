// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Poll {
    string public question;
    uint128 public yesVotes;
    uint128 public noVotes;
    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, bool support);

    constructor() {
        question = "Are you building on Base?";
    }

    function vote(bool support) external {
        require(!hasVoted[msg.sender], "Poll: already voted");
        hasVoted[msg.sender] = true;
        if (support) {
            yesVotes++;
        } else {
            noVotes++;
        }
        emit Voted(msg.sender, support);
    }
}
