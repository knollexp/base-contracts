# Security

## Scope and status

These contracts have not been audited. They are small, deliberately simple and
covered by an automated test suite, which is not the same thing as an audit.

None of them hold funds. Every function is non-payable and no contract has a
withdrawal path, so the worst outcome of a bug here is corrupted or
inaccessible bookkeeping, not lost value. Read that as a bound on the damage,
not as a claim of correctness.

## Known limitations

These are design decisions, not defects, and they are documented in the
contracts themselves:

- `NameRegistry` registration can be front-run. A pending claim is visible in
  the mempool and can be taken by a higher-paying transaction. Preventing this
  needs a commit-reveal scheme.
- `Whitelist` ownership transfer is single-step. Transferring to an address
  that cannot act is irreversible and freezes the allowlist.
- `Poll` and `BuilderBadge` are one-per-address and offer no Sybil resistance.
  Addresses are free.
- `Guestbook` and `VersionLog` are append-only. Nothing published to them can
  be edited or removed.
- `Attestation` and `BuilderBadge` use a zero timestamp to mean "never". They
  must not be deployed to a chain whose genesis timestamp is zero.

## Reporting

Open an issue. Given the scope above there is no embargo process and nothing
here warrants one.
