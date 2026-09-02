const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { ethers } = require("ethers");
const { TestChain, account } = require("./harness");

const ALICE = ethers.encodeBytes32String("alice");
const BOB = ethers.encodeBytes32String("bob");
const EMPTY = "0x" + "00".repeat(32);
const ZERO_ADDR = "0x" + "00".repeat(20);

describe("NameRegistry", () => {
  let chain, registry;

  beforeEach(async () => {
    chain = await TestChain.create();
    registry = await chain.deploy("NameRegistry");
  });

  test("starts with no owner for a name", async () => {
    assert.equal(await registry.read("ownerOf", [ALICE]), ZERO_ADDR);
  });

  test("registers a name in both directions", async () => {
    await registry.send("register", [ALICE], { from: account(1) });
    assert.equal(
      (await registry.read("ownerOf", [ALICE])).toLowerCase(),
      account(1).toString().toLowerCase()
    );
    assert.equal(await registry.read("nameOf", [account(1).toString()]), ALICE);
  });

  test("rejects an empty name", async () => {
    assert.equal(await registry.expectRevert("register", [EMPTY]), "Registry: empty name");
  });

  test("rejects a name that is already taken", async () => {
    await registry.send("register", [ALICE], { from: account(1) });
    const reason = await registry.expectRevert("register", [ALICE], { from: account(2) });
    assert.equal(reason, "Registry: taken");
  });

  test("rejects a second name for the same address", async () => {
    await registry.send("register", [ALICE], { from: account(1) });
    const reason = await registry.expectRevert("register", [BOB], { from: account(1) });
    assert.equal(reason, "Registry: already named");
  });

  test("releases a name and frees it for someone else", async () => {
    await registry.send("register", [ALICE], { from: account(1) });
    await registry.send("release", [], { from: account(1) });
    assert.equal(await registry.read("ownerOf", [ALICE]), ZERO_ADDR);
    assert.equal(await registry.read("nameOf", [account(1).toString()]), EMPTY);
    await registry.send("register", [ALICE], { from: account(2) });
    assert.equal(
      (await registry.read("ownerOf", [ALICE])).toLowerCase(),
      account(2).toString().toLowerCase()
    );
  });

  test("rejects release from an address with no name", async () => {
    assert.equal(
      await registry.expectRevert("release", [], { from: account(3) }),
      "Registry: no name"
    );
  });

  test("emits Registered and Released", async () => {
    const reg = await registry.send("register", [ALICE], { from: account(1) });
    assert.equal(reg.logs[0].name, "Registered");
    assert.equal(reg.logs[0].args.name, ALICE);
    const rel = await registry.send("release", [], { from: account(1) });
    assert.equal(rel.logs[0].name, "Released");
  });
});
