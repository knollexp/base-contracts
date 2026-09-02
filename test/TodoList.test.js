const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

describe("TodoList", () => {
  let chain, todo;

  beforeEach(async () => {
    chain = await TestChain.create();
    todo = await chain.deploy("TodoList");
  });

  test("starts empty for every address", async () => {
    assert.equal(await todo.read("taskCount", [account(1).toString()]), 0n);
  });

  test("adds a task as not done", async () => {
    await todo.send("addTask", ["ship it"], { from: account(1) });
    assert.equal(await todo.read("taskCount", [account(1).toString()]), 1n);
    const task = await todo.read("taskAt", [account(1).toString(), 0]);
    assert.equal(task.text, "ship it");
    assert.equal(task.done, false);
  });

  test("keeps lists of different owners apart", async () => {
    await todo.send("addTask", ["mine"], { from: account(1) });
    await todo.send("addTask", ["yours"], { from: account(2) });
    assert.equal((await todo.read("taskAt", [account(1).toString(), 0])).text, "mine");
    assert.equal((await todo.read("taskAt", [account(2).toString(), 0])).text, "yours");
  });

  test("completes a task", async () => {
    await todo.send("addTask", ["ship it"], { from: account(1) });
    await todo.send("complete", [0], { from: account(1) });
    assert.equal((await todo.read("taskAt", [account(1).toString(), 0])).done, true);
  });

  test("completes the right task out of several", async () => {
    await todo.send("addTask", ["a"], { from: account(1) });
    await todo.send("addTask", ["b"], { from: account(1) });
    await todo.send("addTask", ["c"], { from: account(1) });
    await todo.send("complete", [1], { from: account(1) });
    assert.equal((await todo.read("taskAt", [account(1).toString(), 0])).done, false);
    assert.equal((await todo.read("taskAt", [account(1).toString(), 1])).done, true);
    assert.equal((await todo.read("taskAt", [account(1).toString(), 2])).done, false);
  });

  test("rejects completing a task twice", async () => {
    await todo.send("addTask", ["ship it"], { from: account(1) });
    await todo.send("complete", [0], { from: account(1) });
    const reason = await todo.expectRevert("complete", [0], { from: account(1) });
    assert.equal(reason, "TodoList: already done");
  });

  test("cannot complete another owner's task", async () => {
    await todo.send("addTask", ["mine"], { from: account(1) });
    // account(2) has no list, so index 0 is out of bounds for them.
    assert.ok(await todo.expectRevert("complete", [0], { from: account(2) }));
    assert.equal((await todo.read("taskAt", [account(1).toString(), 0])).done, false);
  });

  test("emits TaskAdded and TaskCompleted with the id", async () => {
    await todo.send("addTask", ["a"], { from: account(1) });
    const added = await todo.send("addTask", ["b"], { from: account(1) });
    assert.equal(added.logs[0].name, "TaskAdded");
    assert.equal(added.logs[0].args.id, 1n);
    const completed = await todo.send("complete", [1], { from: account(1) });
    assert.equal(completed.logs[0].name, "TaskCompleted");
    assert.equal(completed.logs[0].args.id, 1n);
  });
});
