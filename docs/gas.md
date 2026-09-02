# Gas report

Execution gas for one representative call per contract, measured against a
freshly deployed instance. Most of these calls write to a cold storage slot
and are therefore close to worst case: a second call to the same slot costs
substantially less.

`Greeter.setGreeting` is the exception and is much cheaper than the rest. Its
slot is already populated by the constructor, so the call is an overwrite
rather than a cold write, and the replacement string used here is shorter
than the default one. Read it as a warm-write figure, not a cold one.

Figures cover L2 execution only. On Base each transaction also carries an L1
data fee that depends on calldata size and L1 conditions, and is not
measurable from an in-process EVM.

| Contract        | Call            | Gas   | Deployed size (bytes) |
| --------------- | --------------- | ----- | --------------------- |
| `Attestation`   | `attest()`      | 24559 | 627                   |
| `BuilderBadge`  | `claim()`       | 68830 | 833                   |
| `Counter`       | `increment()`   | 23734 | 392                   |
| `Greeter`       | `setGreeting()` | 5849  | 1479                  |
| `Guestbook`     | `sign()`        | 70250 | 1571                  |
| `KeyValueStore` | `set()`         | 25510 | 1130                  |
| `NameRegistry`  | `register()`    | 46467 | 880                   |
| `Poll`          | `vote()`        | 46555 | 1475                  |
| `TodoList`      | `addTask()`     | 50387 | 1762                  |
| `VersionLog`    | `publish()`     | 70224 | 2013                  |
| `Whitelist`     | `allow()`       | 23834 | 929                   |

Regenerate with `npm run gas`.
