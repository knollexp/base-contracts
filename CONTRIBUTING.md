# Contributing

## Running the checks

```
npm ci
npm run compile
npm test
npm run format:check
```

CI runs the suite on Node 20, 22 and 24, plus a formatting check and an ABI
freshness check. All four must pass.

## Adding a contract

1. Add the source to `contracts/`. Keep it self-contained: no imports, and an
   argument-less constructor, so `deploy.js` picks it up without special
   casing.
2. Document it with NatSpec, including the tradeoffs a reader would otherwise
   have to infer.
3. Add `test/<Name>.test.js`. Cover the revert paths, not just the happy path,
   and assert that a rejected call leaves state untouched where that matters.
4. Run `npm run abi` and commit the regenerated interface. CI fails if you
   forget.
5. Add a scenario to `scripts/gas-report.js` and regenerate `docs/gas.md`.
6. Add a row to the README table and, if it has a limitation worth knowing,
   to `SECURITY.md`.

## Commits

One logical change per commit. Say why in the message, not just what: the diff
already shows what changed.

## What does not belong here

Anything that holds funds. Every contract is non-payable on purpose, which is
what keeps the consequences of a bug in this unaudited code bounded. A payable
function would remove that property from the whole repository, not just from
the contract that introduced it.
