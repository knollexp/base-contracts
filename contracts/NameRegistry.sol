// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NameRegistry {
    mapping(bytes32 => address) public ownerOf;
    mapping(address => bytes32) public nameOf;

    event Registered(bytes32 indexed name, address indexed owner);
    event Released(bytes32 indexed name, address indexed owner);

    function register(bytes32 name) external {
        require(name != bytes32(0), "Registry: empty name");
        require(ownerOf[name] == address(0), "Registry: taken");
        require(nameOf[msg.sender] == bytes32(0), "Registry: already named");
        ownerOf[name] = msg.sender;
        nameOf[msg.sender] = name;
        emit Registered(name, msg.sender);
    }

    function release() external {
        bytes32 name = nameOf[msg.sender];
        require(name != bytes32(0), "Registry: no name");
        delete ownerOf[name];
        delete nameOf[msg.sender];
        emit Released(name, msg.sender);
    }
}
