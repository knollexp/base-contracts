const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { TestChain, account } = require("./harness");

const DIGEST_A = "0x" + "11".repeat(32);
const DIGEST_B = "0x" + "22".repeat(32);

describe("Attestation", () => {
  let chain, attestation;

  beforeEach(async () => {
    chain = await TestChain.create();
    attestation = await chain.deploy("Attestation");
  });

  test("reports nothing attested initially", async () => {
    assert.equal(await attestation.read("hasAttested", [DIGEST_A, account(1).toString()]), false);
    assert.equal(await attestation.read("attestedAt", [DIGEST_A, account(1).toString()]), 0n);
  });

  test("records an attestation with a timestamp", async () => {
    await attestation.send("attest", [DIGEST_A], { from: account(1) });
    assert.equal(await attestation.read("hasAttested", [DIGEST_A, account(1).toString()]), true);
    assert.ok((await attestation.read("attestedAt", [DIGEST_A, account(1).toString()])) > 0n);
  });

  test("keeps attestations per attester", async () => {
    await attestation.send("attest", [DIGEST_A], { from: account(1) });
    assert.equal(await attestation.read("hasAttested", [DIGEST_A, account(2).toString()]), false);
  });

  test("lets the same attester cover different digests", async () => {
    await attestation.send("attest", [DIGEST_A], { from: account(1) });
    await attestation.send("attest", [DIGEST_B], { from: account(1) });
    assert.equal(await attestation.read("hasAttested", [DIGEST_B, account(1).toString()]), true);
  });

  test("rejects a duplicate attestation", async () => {
    await attestation.send("attest", [DIGEST_A], { from: account(1) });
    const reason = await attestation.expectRevert("attest", [DIGEST_A], { from: account(1) });
    assert.equal(reason, "Attestation: duplicate");
  });

  test("emits Attested with the digest and attester", async () => {
    const { logs } = await attestation.send("attest", [DIGEST_A], { from: account(7) });
    assert.equal(logs[0].name, "Attested");
    assert.equal(logs[0].args.digest, DIGEST_A);
    assert.equal(logs[0].args.attester.toLowerCase(), account(7).toString().toLowerCase());
  });
});
