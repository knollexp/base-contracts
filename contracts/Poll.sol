// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Poll
/// @notice A one-question, one-vote-per-address yes/no poll.
/// @dev The question is fixed at construction and the poll never closes.
///      Sybil resistance is out of scope: one address is one vote, and
///      addresses are free.
contract Poll {
    /// @notice The question being voted on.
    string public question;

    /// @notice Number of votes in favour.
    /// @dev Packed alongside noVotes into a single slot.
    uint128 public yesVotes;

    /// @notice Number of votes against.
    uint128 public noVotes;

    /// @notice Whether an address has already cast its vote.
    mapping(address => bool) public hasVoted;

    /// @notice Emitted once per address, on its only accepted vote.
    /// @param voter The address that voted.
    /// @param support True for yes, false for no.
    event Voted(address indexed voter, bool support);

    /// @notice Seeds the fixed question.
    constructor() {
        question = "Are you building on Base?";
    }

    /// @notice Casts a vote.
    /// @dev Reverts on a second call from the same address, so a rejected
    ///      vote cannot disturb the tally.
    /// @param support True to vote yes, false to vote no.
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
