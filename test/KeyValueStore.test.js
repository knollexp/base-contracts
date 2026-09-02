const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { ethers } = require("ethers");
const { TestChain, account } = require("./harness");

const KEY = ethers.encodeBytes32String("theme");
const OTHER_KEY = ethers.encodeBytes32String("locale");

describe("KeyValueStore", () => {
  let chain, store;

  beforeEach(async () => {
    chain = await TestChain.create();
    store = await chain.deploy("KeyValueStore");
  });

  test("returns an empty string for an unset key", async () => {
    assert.equal(await store.read("get", [account(1).toString(), KEY]), "");
  });

  test("stores a value under the sender", async () => {
    await store.send("set", [KEY, "dark"], { from: account(1) });
    assert.equal(await store.read("get", [account(1).toString(), KEY]), "dark");
  });

  test("keeps values of different owners apart", async () => {
    await store.send("set", [KEY, "dark"], { from: account(1) });
    await store.send("set", [KEY, "light"], { from: account(2) });
    assert.equal(await store.read("get", [account(1).toString(), KEY]), "dark");
    assert.equal(await store.read("get", [account(2).toString(), KEY]), "light");
  });

  test("keeps different keys of one owner apart", async () => {
    await store.send("set", [KEY, "dark"], { from: account(1) });
    await store.send("set", [OTHER_KEY, "de-DE"], { from: account(1) });
    assert.equal(await store.read("get", [account(1).toString(), KEY]), "dark");
    assert.equal(await store.read("get", [account(1).toString(), OTHER_KEY]), "de-DE");
  });

  test("overwrites an existing value", async () => {
    await store.send("set", [KEY, "dark"], { from: account(1) });
    await store.send("set", [KEY, "light"], { from: account(1) });
    assert.equal(await store.read("get", [account(1).toString(), KEY]), "light");
  });

  test("stores a value longer than one slot", async () => {
    const long = "x".repeat(500);
    await store.send("set", [KEY, long], { from: account(1) });
    assert.equal(await store.read("get", [account(1).toString(), KEY]), long);
  });

  test("emits ValueSet with owner and key", async () => {
    const { logs } = await store.send("set", [KEY, "dark"], { from: account(6) });
    assert.equal(logs[0].name, "ValueSet");
    assert.equal(logs[0].args.owner.toLowerCase(), account(6).toString().toLowerCase());
    assert.equal(logs[0].args.key, KEY);
  });
});
