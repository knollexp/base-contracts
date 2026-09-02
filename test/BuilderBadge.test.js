const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

describe("BuilderBadge", () => {
  let chain, badge;

  beforeEach(async () => {
    chain = await TestChain.create();
    badge = await chain.deploy("BuilderBadge");
  });

  test("exposes name and symbol", async () => {
    assert.equal(await badge.read("name"), "Base Builder Badge");
    assert.equal(await badge.read("symbol"), "BBB");
  });

  test("starts with nothing claimed", async () => {
    assert.equal(await badge.read("totalClaimed"), 0n);
    assert.equal(await badge.read("claimed", [account(1).toString()]), false);
  });

  test("records a claim", async () => {
    await badge.send("claim", [], { from: account(1) });
    assert.equal(await badge.read("claimed", [account(1).toString()]), true);
    assert.ok((await badge.read("claimedAt", [account(1).toString()])) > 0n);
  });

  test("numbers claims in order", async () => {
    await badge.send("claim", [], { from: account(1) });
    await badge.send("claim", [], { from: account(2) });
    await badge.send("claim", [], { from: account(3) });
    assert.equal(await badge.read("totalClaimed"), 3n);
  });

  test("rejects a second claim from the same address", async () => {
    await badge.send("claim", [], { from: account(1) });
    assert.equal(
      await badge.expectRevert("claim", [], { from: account(1) }),
      "Badge: already claimed"
    );
  });

  test("does not increase the total on a rejected claim", async () => {
    await badge.send("claim", [], { from: account(1) });
    await badge.expectRevert("claim", [], { from: account(1) });
    assert.equal(await badge.read("totalClaimed"), 1n);
  });

  test("emits Claimed with the sequence number", async () => {
    await badge.send("claim", [], { from: account(1) });
    const { logs } = await badge.send("claim", [], { from: account(2) });
    assert.equal(logs[0].name, "Claimed");
    assert.equal(logs[0].args.number, 2n);
  });
});
