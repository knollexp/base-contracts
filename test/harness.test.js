const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account, GENESIS_TIMESTAMP } = require("./harness");

// The harness is what every other suite trusts, and it has already been wrong
// once: a zero block timestamp made two contracts look like they had no state.
// These tests pin the guarantees the other suites rely on.
describe("harness", () => {
  let chain;

  beforeEach(async () => {
    chain = await TestChain.create();
  });

  test("account() is deterministic", () => {
    assert.equal(account(0).toString(), account(0).toString());
    assert.notEqual(account(0).toString(), account(1).toString());
  });

  test("account() never returns the zero address", () => {
    assert.notEqual(account(0).toString(), "0x" + "00".repeat(20));
  });

  test("rejects an unknown artifact name", async () => {
    await assert.rejects(() => chain.deploy("NoSuchContract"), /No artifact named/);
  });

  test("starts at a non-zero block timestamp", async () => {
    assert.equal(chain.timestamp, GENESIS_TIMESTAMP);
    const badge = await chain.deploy("BuilderBadge");
    await badge.send("claim", [], { from: account(1) });
    assert.equal(await badge.read("claimedAt", [account(1).toString()]), GENESIS_TIMESTAMP);
  });

  test("warp moves the timestamp the contracts observe", async () => {
    chain.warp(3600);
    const badge = await chain.deploy("BuilderBadge");
    await badge.send("claim", [], { from: account(1) });
    assert.equal(await badge.read("claimedAt", [account(1).toString()]), GENESIS_TIMESTAMP + 3600n);
  });

  test("decodes a require message into a revert reason", async () => {
    const counter = await chain.deploy("Counter");
    assert.equal(await counter.expectRevert("decrement"), "Counter: underflow");
  });

  test("still reports a revert that carries no message", async () => {
    const guestbook = await chain.deploy("Guestbook");
    // An out-of-bounds array read panics rather than reverting with a string.
    const reason = await guestbook.expectRevert("entryAt", [0]);
    assert.ok(reason, "expected some indication of failure");
  });

  test("treats a successful call as a failed expectation", async () => {
    const counter = await chain.deploy("Counter");
    await assert.rejects(() => counter.expectRevert("increment"), /expected to revert/);
  });

  test("surfaces a revert from read() as a thrown error", async () => {
    const log = await chain.deploy("VersionLog");
    await assert.rejects(() => log.read("latest"), /VersionLog: empty/);
  });

  test("isolates state between chains", async () => {
    const first = await chain.deploy("Counter");
    await first.send("increment");

    const other = await TestChain.create();
    const second = await other.deploy("Counter");
    assert.equal(await second.read("count"), 0n);
    assert.equal(await first.read("count"), 1n);
  });

  test("reports gas used for a call", async () => {
    const counter = await chain.deploy("Counter");
    const { gasUsed } = await counter.send("increment");
    assert.ok(gasUsed > 0n, "expected a positive gas figure");
  });

  test("deploys from a chosen address", async () => {
    const whitelist = await chain.deploy("Whitelist", { from: account(7) });
    assert.equal(
      (await whitelist.read("owner")).toLowerCase(),
      account(7).toString().toLowerCase()
    );
  });
});
