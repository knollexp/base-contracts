const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

const ZERO = "0x" + "00".repeat(20);

describe("Whitelist", () => {
  let chain, whitelist;
  const owner = account(0);
  const stranger = account(9);

  beforeEach(async () => {
    chain = await TestChain.create();
    whitelist = await chain.deploy("Whitelist", { from: owner });
  });

  test("makes the deployer the owner", async () => {
    assert.equal((await whitelist.read("owner")).toLowerCase(), owner.toString().toLowerCase());
  });

  test("allows and revokes an account", async () => {
    const target = account(4).toString();
    await whitelist.send("allow", [target]);
    assert.equal(await whitelist.read("allowed", [target]), true);
    await whitelist.send("revoke", [target]);
    assert.equal(await whitelist.read("allowed", [target]), false);
  });

  test("rejects allow from a non-owner", async () => {
    const reason = await whitelist.expectRevert("allow", [account(4).toString()], { from: stranger });
    assert.equal(reason, "Whitelist: not owner");
  });

  test("rejects revoke from a non-owner", async () => {
    const reason = await whitelist.expectRevert("revoke", [account(4).toString()], { from: stranger });
    assert.equal(reason, "Whitelist: not owner");
  });

  test("transfers ownership and moves the privilege with it", async () => {
    await whitelist.send("transferOwnership", [stranger.toString()]);
    assert.equal((await whitelist.read("owner")).toLowerCase(), stranger.toString().toLowerCase());
    await whitelist.send("allow", [account(4).toString()], { from: stranger });
    await whitelist.expectRevert("allow", [account(5).toString()], { from: owner });
  });

  test("refuses to transfer ownership to the zero address", async () => {
    assert.equal(await whitelist.expectRevert("transferOwnership", [ZERO]), "Whitelist: zero owner");
  });

  test("emits Allowed and Revoked", async () => {
    const target = account(4).toString();
    const allowed = await whitelist.send("allow", [target]);
    assert.equal(allowed.logs[0].name, "Allowed");
    const revoked = await whitelist.send("revoke", [target]);
    assert.equal(revoked.logs[0].name, "Revoked");
  });
});
