// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Attestation {
    mapping(bytes32 => mapping(address => uint64)) public attestedAt;

    event Attested(bytes32 indexed digest, address indexed attester, uint64 timestamp);

    function attest(bytes32 digest) external {
        require(attestedAt[digest][msg.sender] == 0, "Attestation: duplicate");
        uint64 ts = uint64(block.timestamp);
        attestedAt[digest][msg.sender] = ts;
        emit Attested(digest, msg.sender, ts);
    }

    function hasAttested(bytes32 digest, address attester) external view returns (bool) {
        return attestedAt[digest][attester] != 0;
    }
}
