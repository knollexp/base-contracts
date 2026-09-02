// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VersionLog
/// @notice An append-only release log whose versions must strictly increase.
/// @dev The ordering check is lexicographic across (major, minor, patch),
///      not a field-by-field comparison: a lower major is rejected even when
///      its minor or patch is higher. Anyone may publish; the contract
///      orders releases, it does not authorise them.
contract VersionLog {
    /// @notice One published release.
    /// @param major Major version component.
    /// @param minor Minor version component.
    /// @param patch Patch version component.
    /// @param timestamp Block time at which it was published.
    /// @param notes Free-form release notes.
    struct Release {
        uint32 major;
        uint32 minor;
        uint32 patch;
        uint64 timestamp;
        string notes;
    }

    Release[] private _releases;

    /// @notice Emitted for every accepted release.
    /// @param index Position in the log, starting at zero.
    /// @param major Major version component.
    /// @param minor Minor version component.
    /// @param patch Patch version component.
    event ReleasePublished(uint256 indexed index, uint32 major, uint32 minor, uint32 patch);

    /// @notice Appends a release, if it is newer than the current latest.
    /// @dev The first release is accepted at any version, so the log can
    ///      start partway through an existing project's history.
    /// @param major Major version component.
    /// @param minor Minor version component.
    /// @param patch Patch version component.
    /// @param notes Free-form release notes.
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

    /// @notice The most recently published release.
    /// @dev Reverts while the log is empty rather than returning a zeroed
    ///      struct, which would be indistinguishable from a real 0.0.0
    ///      release.
    /// @return The latest release.
    function latest() external view returns (Release memory) {
        require(_releases.length > 0, "VersionLog: empty");
        return _releases[_releases.length - 1];
    }

    /// @notice How many releases the log holds.
    /// @return The release count.
    function total() external view returns (uint256) {
        return _releases.length;
    }
}
