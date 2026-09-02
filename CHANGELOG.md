# Changelog

## 1.0.0

First release. Eleven contracts deployed to Base mainnet; see
[docs/addresses.md](docs/addresses.md) for addresses and provenance.

### Contracts

- `Attestation`, `BuilderBadge`, `Counter`, `Greeter`, `Guestbook`,
  `KeyValueStore`, `NameRegistry`, `Poll`, `TodoList`, `VersionLog`,
  `Whitelist`, all documented with NatSpec.

### Tooling

- `compile.js` wraps solc and fails on contracts over the EIP-170 limit.
- `deploy.js` is a dry run unless `--yes` is passed, checks the RPC chain id
  against the requested network, and reads the key from a gitignored `.env`.
- `scripts/export-abi.js` writes `abi/` and prunes stale files.
- `scripts/gas-report.js` generates `docs/gas.md` from the test harness.
- `scripts/verify.js` submits sources to Basescan. Not yet exercised against
  the live API.

### Tests

- 94 tests against an in-process EVM, including tests for the harness itself.

### Known gaps

- Nothing is audited.
- The deployed bytecode predates the documentation and formatting passes, so
  it no longer byte-matches HEAD. The runtime code is unchanged; only the
  metadata hash moved.
