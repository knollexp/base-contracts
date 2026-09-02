const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

describe("Greeter", () => {
  let chain, greeter;

  beforeEach(async () => {
    chain = await TestChain.create();
    greeter = await chain.deploy("Greeter", { from: account(5) });
  });

  test("starts with the default greeting", async () => {
    assert.equal(await greeter.read("greeting"), "gm base");
  });

  test("records the deployer", async () => {
    assert.equal(
      (await greeter.read("deployer")).toLowerCase(),
      account(5).toString().toLowerCase()
    );
  });

  test("lets anyone change the greeting", async () => {
    await greeter.send("setGreeting", ["wagmi"], { from: account(2) });
    assert.equal(await greeter.read("greeting"), "wagmi");
  });

  test("handles a greeting longer than one storage slot", async () => {
    const long = "a".repeat(200);
    await greeter.send("setGreeting", [long]);
    assert.equal(await greeter.read("greeting"), long);
  });

  test("handles an empty greeting", async () => {
    await greeter.send("setGreeting", [""]);
    assert.equal(await greeter.read("greeting"), "");
  });

  test("emits GreetingChanged with the author", async () => {
    const { logs } = await greeter.send("setGreeting", ["hello"], { from: account(3) });
    assert.equal(logs[0].name, "GreetingChanged");
    assert.equal(logs[0].args.by.toLowerCase(), account(3).toString().toLowerCase());
    assert.equal(logs[0].args.greeting, "hello");
  });
});
