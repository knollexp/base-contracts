# base-contracts

Eleven small, self-contained Solidity contracts and a minimal deploy script for
Base. No framework, no proxy patterns, no funds held: every contract is
non-payable and has an argument-less constructor.

## Contracts

| Contract | Purpose |
| --- | --- |
| `Greeter` | Stores a greeting string, emits on change |
| `Counter` | Increment / decrement with underflow guard |
| `KeyValueStore` | Per-address `bytes32 -> string` storage |
| `Guestbook` | Append-only signed messages, 280 char limit |
| `NameRegistry` | One-name-per-address claim and release |
| `TodoList` | Per-address task list with completion flag |
| `Poll` | One-vote-per-address yes/no poll |
| `Whitelist` | Owner-managed allowlist with ownership transfer |
| `VersionLog` | Monotonically increasing semver release log |
| `Attestation` | Timestamped digest attestations, duplicate-guarded |
| `BuilderBadge` | One-time non-transferable claim record |

## Setup

```
npm install
node compile.js
```

## Deploy

The script is a dry run unless you pass `--yes`. It never stores your key; it
reads `PRIVATE_KEY` from the environment for the duration of the run.

Dry run against Base mainnet (prints gas estimates and cost, sends nothing):

```
PRIVATE_KEY=0x... node deploy.js --network base
```

Rehearse on Base Sepolia:

```
PRIVATE_KEY=0x... node deploy.js --network sepolia --yes
```

Broadcast to Base mainnet:

```
PRIVATE_KEY=0x... node deploy.js --network base --yes
```

Addresses and tx hashes are written to `deployments.<network>.json`, which is
gitignored.

### Notes

- Deployments are attributed to the sending address. Deploy from the address you
  want credited.
- The printed cost estimate covers L2 execution gas only. Base additionally
  charges an L1 data fee per transaction, so the real total is somewhat higher.
- Override the RPC with `BASE_RPC_URL` / `BASE_SEPOLIA_RPC_URL` if the public
  endpoint rate-limits you.
