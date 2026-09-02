// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TodoList
/// @notice A per-address task list with one-way completion.
/// @dev Access control falls out of the data layout rather than a modifier:
///      every write indexes _tasks[msg.sender], so a caller can only ever
///      reach its own list and an out-of-range id reverts on the array bounds
///      check.
contract TodoList {
    /// @notice One task.
    /// @param text What the task says.
    /// @param done Whether it has been completed.
    struct Task {
        string text;
        bool done;
    }

    mapping(address => Task[]) private _tasks;

    /// @notice Emitted when a task is added.
    /// @param owner The list the task was added to.
    /// @param id Index of the new task within that list.
    /// @param text The task text.
    event TaskAdded(address indexed owner, uint256 indexed id, string text);

    /// @notice Emitted when a task is completed.
    /// @param owner The list the task belongs to.
    /// @param id Index of the completed task.
    event TaskCompleted(address indexed owner, uint256 indexed id);

    /// @notice Appends a task to the caller's list.
    /// @param text The task text.
    /// @return id Index of the new task within the caller's list.
    function addTask(string calldata text) external returns (uint256 id) {
        _tasks[msg.sender].push(Task(text, false));
        id = _tasks[msg.sender].length - 1;
        emit TaskAdded(msg.sender, id, text);
    }

    /// @notice Marks one of the caller's tasks as done.
    /// @dev Completion is one-way; there is no reopen. Ids are per list, so
    ///      the same id means different tasks for different owners.
    /// @param id Index of the task within the caller's list.
    function complete(uint256 id) external {
        Task storage task = _tasks[msg.sender][id];
        require(!task.done, "TodoList: already done");
        task.done = true;
        emit TaskCompleted(msg.sender, id);
    }

    /// @notice How many tasks an address has.
    /// @param owner The list to measure.
    /// @return The task count, including completed ones.
    function taskCount(address owner) external view returns (uint256) {
        return _tasks[owner].length;
    }

    /// @notice Reads one task from a list.
    /// @param owner The list to read from.
    /// @param id Index of the task.
    /// @return The task at that index.
    function taskAt(address owner, uint256 id) external view returns (Task memory) {
        return _tasks[owner][id];
    }
}
