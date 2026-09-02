// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Guestbook {
    struct Entry {
        address author;
        uint64 timestamp;
        string message;
    }

    Entry[] private _entries;

    event Signed(address indexed author, uint256 indexed index, string message);

    function sign(string calldata message) external {
        require(bytes(message).length <= 280, "Guestbook: too long");
        _entries.push(Entry(msg.sender, uint64(block.timestamp), message));
        emit Signed(msg.sender, _entries.length - 1, message);
    }

    function total() external view returns (uint256) {
        return _entries.length;
    }

    function entryAt(uint256 index) external view returns (Entry memory) {
        return _entries[index];
    }
}
