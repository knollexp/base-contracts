// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KeyValueStore {
    mapping(address => mapping(bytes32 => string)) private _values;

    event ValueSet(address indexed owner, bytes32 indexed key, string value);

    function set(bytes32 key, string calldata value) external {
        _values[msg.sender][key] = value;
        emit ValueSet(msg.sender, key, value);
    }

    function get(address owner, bytes32 key) external view returns (string memory) {
        return _values[owner][key];
    }
}
