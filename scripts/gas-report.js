const fs = require("fs");
const path = require("path");
const { TestChain, account } = require("../test/harness");
const { compileAll } = require("../compile");
const { ethers } = require("ethers");

/**
 * One representative call per contract, chosen as the operation a user would
 * actually pay for repeatedly. Cold writes to a fresh storage slot dominate,
 * so each scenario runs against a freshly deployed contract.
 */
const SCENARIOS = [
  {
    contract: "Attestation",
    label: "attest",
    run: (c) => c.send("attest", ["0x" + "11".repeat(32)]),
  },
  { contract: "BuilderBadge", label: "claim", run: (c) => c.send("claim") },
  { contract: "Counter", label: "increment", run: (c) => c.send("increment") },
  { contract: "Greeter", label: "setGreeting", run: (c) => c.send("setGreeting", ["gm"]) },
  { contract: "Guestbook", label: "sign", run: (c) => c.send("sign", ["hello"]) },
  {
    contract: "KeyValueStore",
    label: "set",
    run: (c) => c.send("set", [ethers.encodeBytes32String("k"), "v"]),
  },
  {
    contract: "NameRegistry",
    label: "register",
    run: (c) => c.send("register", [ethers.encodeBytes32String("alice")]),
  },
  { contract: "Poll", label: "vote", run: (c) => c.send("vote", [true]) },
  { contract: "TodoList", label: "addTask", run: (c) => c.send("addTask", ["ship"]) },
  {
    contract: "VersionLog",
    label: "publish",
    run: (c) => c.send("publish", [1, 0, 0, "initial"]),
  },
  {
    contract: "Whitelist",
    label: "allow",
    run: (c) => c.send("allow", [account(4).toString()]),
  },
];

async function measure() {
  const sizes = new Map(compileAll().map((a) => [a.name, a.size]));
  const rows = [];

  for (const scenario of SCENARIOS) {
    const chain = await TestChain.create();
    const contract = await chain.deploy(scenario.contract);
    const { gasUsed } = await scenario.run(contract);
    rows.push({
      contract: scenario.contract,
      label: scenario.label,
      gas: gasUsed,
      size: sizes.get(scenario.contract),
    });
  }

  return rows;
}

function render(rows) {
  const body = rows
    .map((r) => `| \`${r.contract}\` | \`${r.label}()\` | ${r.gas} | ${r.size} |`)
    .join("\n");

  return [
    "# Gas report",
    "",
    "Execution gas for one representative call per contract, measured against a",
    "freshly deployed instance. Most of these calls write to a cold storage slot",
    "and are therefore close to worst case: a second call to the same slot costs",
    "substantially less.",
    "",
    "`Greeter.setGreeting` is the exception and is much cheaper than the rest. Its",
    "slot is already populated by the constructor, so the call is an overwrite",
    "rather than a cold write, and the replacement string used here is shorter",
    "than the default one. Read it as a warm-write figure, not a cold one.",
    "",
    "Figures cover L2 execution only. On Base each transaction also carries an L1",
    "data fee that depends on calldata size and L1 conditions, and is not",
    "measurable from an in-process EVM.",
    "",
    "| Contract | Call | Gas | Deployed size (bytes) |",
    "| --- | --- | --- | --- |",
    body,
    "",
    "Regenerate with `npm run gas`.",
    "",
  ].join("\n");
}

if (require.main === module) {
  measure()
    .then((rows) => {
      const out = path.join(__dirname, "..", "docs", "gas.md");
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, render(rows));
      for (const r of rows) {
        console.log(
          `  ${r.contract.padEnd(16)} ${r.label.padEnd(14)} ${String(r.gas).padStart(7)} gas`
        );
      }
      console.log(`\nWrote ${path.relative(process.cwd(), out)}`);
    })
    .catch((err) => {
      console.error(`ERROR: ${err.message}`);
      process.exitCode = 1;
    });
}

module.exports = { measure, render, SCENARIOS };
