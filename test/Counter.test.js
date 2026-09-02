const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

describe("Counter", () => {
  let chain, counter;

  beforeEach(async () => {
    chain = await TestChain.create();
    counter = await chain.deploy("Counter");
  });

  test("starts at zero", async () => {
    assert.equal(await counter.read("count"), 0n);
  });

  test("increments", async () => {
    await counter.send("increment");
    assert.equal(await counter.read("count"), 1n);
  });

  test("decrements back down", async () => {
    await counter.send("increment");
    await counter.send("increment");
    await counter.send("decrement");
    assert.equal(await counter.read("count"), 1n);
  });

  test("refuses to decrement below zero", async () => {
    assert.equal(await counter.expectRevert("decrement"), "Counter: underflow");
  });

  test("counts across different senders", async () => {
    await counter.send("increment", [], { from: account(1) });
    await counter.send("increment", [], { from: account(2) });
    assert.equal(await counter.read("count"), 2n);
  });

  test("emits Counted with the new value", async () => {
    const { logs } = await counter.send("increment");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].name, "Counted");
    assert.equal(logs[0].args.newCount, 1n);
  });
});
