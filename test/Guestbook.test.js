const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

describe("Guestbook", () => {
  let chain, guestbook;

  beforeEach(async () => {
    chain = await TestChain.create();
    guestbook = await chain.deploy("Guestbook");
  });

  test("starts empty", async () => {
    assert.equal(await guestbook.read("total"), 0n);
  });

  test("stores a signed message with its author", async () => {
    await guestbook.send("sign", ["hello base"], { from: account(1) });
    assert.equal(await guestbook.read("total"), 1n);
    const entry = await guestbook.read("entryAt", [0]);
    assert.equal(entry.author.toLowerCase(), account(1).toString().toLowerCase());
    assert.equal(entry.message, "hello base");
    assert.ok(entry.timestamp > 0n);
  });

  test("keeps entries in insertion order", async () => {
    await guestbook.send("sign", ["first"], { from: account(1) });
    await guestbook.send("sign", ["second"], { from: account(2) });
    assert.equal((await guestbook.read("entryAt", [0])).message, "first");
    assert.equal((await guestbook.read("entryAt", [1])).message, "second");
  });

  test("lets the same author sign more than once", async () => {
    await guestbook.send("sign", ["one"], { from: account(1) });
    await guestbook.send("sign", ["two"], { from: account(1) });
    assert.equal(await guestbook.read("total"), 2n);
  });

  test("accepts a message of exactly 280 bytes", async () => {
    await guestbook.send("sign", ["a".repeat(280)]);
    assert.equal((await guestbook.read("entryAt", [0])).message.length, 280);
  });

  test("rejects a message of 281 bytes", async () => {
    assert.equal(await guestbook.expectRevert("sign", ["a".repeat(281)]), "Guestbook: too long");
  });

  test("measures the limit in bytes, not characters", async () => {
    // Each of these is one character but three UTF-8 bytes, so 94 of them fit
    // and 94 more would not.
    await guestbook.send("sign", ["あ".repeat(93)]);
    assert.equal(await guestbook.expectRevert("sign", ["あ".repeat(94)]), "Guestbook: too long");
  });

  test("reverts when reading past the end", async () => {
    assert.ok(await guestbook.expectRevert("entryAt", [0]));
  });

  test("emits Signed with the entry index", async () => {
    await guestbook.send("sign", ["first"]);
    const { logs } = await guestbook.send("sign", ["second"], { from: account(3) });
    assert.equal(logs[0].name, "Signed");
    assert.equal(logs[0].args.index, 1n);
    assert.equal(logs[0].args.message, "second");
  });
});
