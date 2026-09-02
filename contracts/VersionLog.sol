// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VersionLog {
    struct Release {
        uint32 major;
        uint32 minor;
        uint32 patch;
        uint64 timestamp;
        string notes;
    }

    Release[] private _releases;

    event ReleasePublished(uint256 indexed index, uint32 major, uint32 minor, uint32 patch);

    function publish(uint32 major, uint32 minor, uint32 patch, string calldata notes) external {
        if (_releases.length > 0) {
            Release storage last = _releases[_releases.length - 1];
            require(
                major > last.major ||
                (major == last.major && minor > last.minor) ||
                (major == last.major && minor == last.minor && patch > last.patch),
                "VersionLog: not newer"
            );
        }
        _releases.push(Release(major, minor, patch, uint64(block.timestamp), notes));
        emit ReleasePublished(_releases.length - 1, major, minor, patch);
    }

    function latest() external view returns (Release memory) {
        require(_releases.length > 0, "VersionLog: empty");
        return _releases[_releases.length - 1];
    }

    function total() external view returns (uint256) {
        return _releases.length;
    }
}
