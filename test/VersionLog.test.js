const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain } = require("./harness");

describe("VersionLog", () => {
  let chain, log;

  beforeEach(async () => {
    chain = await TestChain.create();
    log = await chain.deploy("VersionLog");
  });

  test("starts empty", async () => {
    assert.equal(await log.read("total"), 0n);
  });

  test("reverts on latest() while empty", async () => {
    assert.equal(await log.expectRevert("latest"), "VersionLog: empty");
  });

  test("publishes a first release of any version", async () => {
    await log.send("publish", [2, 5, 1, "first tagged build"]);
    const latest = await log.read("latest");
    assert.equal(latest.major, 2n);
    assert.equal(latest.minor, 5n);
    assert.equal(latest.patch, 1n);
    assert.equal(latest.notes, "first tagged build");
    assert.ok(latest.timestamp > 0n);
  });

  test("accepts a patch bump", async () => {
    await log.send("publish", [1, 0, 0, "initial"]);
    await log.send("publish", [1, 0, 1, "patch"]);
    assert.equal((await log.read("latest")).patch, 1n);
  });

  test("accepts a minor bump that resets patch", async () => {
    await log.send("publish", [1, 0, 9, "initial"]);
    await log.send("publish", [1, 1, 0, "minor"]);
    const latest = await log.read("latest");
    assert.equal(latest.minor, 1n);
    assert.equal(latest.patch, 0n);
  });

  test("accepts a major bump that resets minor and patch", async () => {
    await log.send("publish", [1, 9, 9, "initial"]);
    await log.send("publish", [2, 0, 0, "major"]);
    const latest = await log.read("latest");
    assert.equal(latest.major, 2n);
    assert.equal(latest.minor, 0n);
  });

  test("rejects republishing the same version", async () => {
    await log.send("publish", [1, 0, 0, "initial"]);
    assert.equal(await log.expectRevert("publish", [1, 0, 0, "again"]), "VersionLog: not newer");
  });

  test("rejects a lower patch", async () => {
    await log.send("publish", [1, 0, 5, "initial"]);
    assert.equal(await log.expectRevert("publish", [1, 0, 4, "back"]), "VersionLog: not newer");
  });

  test("rejects a lower major even with a higher minor", async () => {
    await log.send("publish", [2, 0, 0, "initial"]);
    assert.equal(await log.expectRevert("publish", [1, 9, 9, "back"]), "VersionLog: not newer");
  });

  test("counts every published release", async () => {
    await log.send("publish", [1, 0, 0, "a"]);
    await log.send("publish", [1, 0, 1, "b"]);
    await log.send("publish", [1, 1, 0, "c"]);
    assert.equal(await log.read("total"), 3n);
  });

  test("emits ReleasePublished with the index and version", async () => {
    await log.send("publish", [1, 0, 0, "a"]);
    const { logs } = await log.send("publish", [1, 2, 3, "b"]);
    assert.equal(logs[0].name, "ReleasePublished");
    assert.equal(logs[0].args.index, 1n);
    assert.equal(logs[0].args.major, 1n);
    assert.equal(logs[0].args.minor, 2n);
    assert.equal(logs[0].args.patch, 3n);
  });
});
