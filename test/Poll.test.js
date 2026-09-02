const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

describe("Poll", () => {
  let chain, poll;

  beforeEach(async () => {
    chain = await TestChain.create();
    poll = await chain.deploy("Poll");
  });

  test("exposes the question", async () => {
    assert.equal(await poll.read("question"), "Are you building on Base?");
  });

  test("starts with no votes", async () => {
    assert.equal(await poll.read("yesVotes"), 0n);
    assert.equal(await poll.read("noVotes"), 0n);
  });

  test("tallies yes and no separately", async () => {
    await poll.send("vote", [true], { from: account(1) });
    await poll.send("vote", [true], { from: account(2) });
    await poll.send("vote", [false], { from: account(3) });
    assert.equal(await poll.read("yesVotes"), 2n);
    assert.equal(await poll.read("noVotes"), 1n);
  });

  test("records that an address has voted", async () => {
    assert.equal(await poll.read("hasVoted", [account(1).toString()]), false);
    await poll.send("vote", [true], { from: account(1) });
    assert.equal(await poll.read("hasVoted", [account(1).toString()]), true);
  });

  test("rejects a second vote from the same address", async () => {
    await poll.send("vote", [true], { from: account(1) });
    const reason = await poll.expectRevert("vote", [false], { from: account(1) });
    assert.equal(reason, "Poll: already voted");
  });

  test("does not let a rejected second vote change the tally", async () => {
    await poll.send("vote", [true], { from: account(1) });
    await poll.expectRevert("vote", [false], { from: account(1) });
    assert.equal(await poll.read("yesVotes"), 1n);
    assert.equal(await poll.read("noVotes"), 0n);
  });

  test("emits Voted with the direction", async () => {
    const { logs } = await poll.send("vote", [false], { from: account(4) });
    assert.equal(logs[0].name, "Voted");
    assert.equal(logs[0].args.support, false);
  });
});
