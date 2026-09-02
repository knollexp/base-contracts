// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TodoList {
    struct Task {
        string text;
        bool done;
    }

    mapping(address => Task[]) private _tasks;

    event TaskAdded(address indexed owner, uint256 indexed id, string text);
    event TaskCompleted(address indexed owner, uint256 indexed id);

    function addTask(string calldata text) external returns (uint256 id) {
        _tasks[msg.sender].push(Task(text, false));
        id = _tasks[msg.sender].length - 1;
        emit TaskAdded(msg.sender, id, text);
    }

    function complete(uint256 id) external {
        Task storage task = _tasks[msg.sender][id];
        require(!task.done, "TodoList: already done");
        task.done = true;
        emit TaskCompleted(msg.sender, id);
    }

    function taskCount(address owner) external view returns (uint256) {
        return _tasks[owner].length;
    }

    function taskAt(address owner, uint256 id) external view returns (Task memory) {
        return _tasks[owner][id];
    }
}
