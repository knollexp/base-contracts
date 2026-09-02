// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Guestbook
/// @notice An append-only list of short signed messages.
/// @dev Entries can never be edited or removed. Anything written here is
///      public and permanent, including whatever the author did not mean to
///      publish.
contract Guestbook {
    /// @notice One signed message.
    /// @param author The address that signed.
    /// @param timestamp Block time at which it was signed.
    /// @param message The message text.
    struct Entry {
        address author;
        uint64 timestamp;
        string message;
    }

    Entry[] private _entries;

    /// @notice Emitted for every accepted message.
    /// @param author The address that signed.
    /// @param index Position of the entry, starting at zero.
    /// @param message The message text.
    event Signed(address indexed author, uint256 indexed index, string message);

    /// @notice Appends a message signed by the caller.
    /// @dev The limit counts UTF-8 bytes, not characters, so a message of
    ///      multibyte characters hits it sooner than its visible length
    ///      suggests.
    /// @param message The text to append. At most 280 bytes.
    function sign(string calldata message) external {
        require(bytes(message).length <= 280, "Guestbook: too long");
        _entries.push(Entry(msg.sender, uint64(block.timestamp), message));
        emit Signed(msg.sender, _entries.length - 1, message);
    }

    /// @notice How many entries the guestbook holds.
    /// @return The entry count.
    function total() external view returns (uint256) {
        return _entries.length;
    }

    /// @notice Reads one entry.
    /// @dev Reverts on an out-of-range index via the array bounds check.
    /// @param index Position of the entry.
    /// @return The entry at that position.
    function entryAt(uint256 index) external view returns (Entry memory) {
        return _entries[index];
    }
}
