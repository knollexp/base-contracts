# Deployed addresses

All eleven contracts are live on Base mainnet (chain id 8453), deployed in a
single run on 2026-09-02 from `0xef583347978E680A8A58dD1b9C810a68a8F0Fb79`.

| Contract        | Address                                                                                                                 | Gas used |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| `Attestation`   | [`0x44DE54451feDeB5DBf9055f28Bc86E299247F129`](https://basescan.org/address/0x44DE54451feDeB5DBf9055f28Bc86E299247F129) | 182831   |
| `BuilderBadge`  | [`0x1f3053d41ba5DE86A2108Bcf75162B9D4158Dc1C`](https://basescan.org/address/0x1f3053d41ba5DE86A2108Bcf75162B9D4158Dc1C) | 227360   |
| `Counter`       | [`0x933ecA2Aa56824F161c6F79e30bBc21b527Bc955`](https://basescan.org/address/0x933ecA2Aa56824F161c6F79e30bBc21b527Bc955) | 132027   |
| `Greeter`       | [`0x004281f907786aB52C7571D46705429C277E5763`](https://basescan.org/address/0x004281f907786aB52C7571D46705429C277E5763) | 305830   |
| `Guestbook`     | [`0x9cEd3Fd924CbEb965ACF19Bd5347D04395B5a230`](https://basescan.org/address/0x9cEd3Fd924CbEb965ACF19Bd5347D04395B5a230) | 386979   |
| `KeyValueStore` | [`0x79f093E1ce2676e4205462cEfaB4f80486fA8b62`](https://basescan.org/address/0x79f093E1ce2676e4205462cEfaB4f80486fA8b62) | 291561   |
| `NameRegistry`  | [`0xCebB51a8adE938fd76FF62dE391B00E0c91774c3`](https://basescan.org/address/0xCebB51a8adE938fd76FF62dE391B00E0c91774c3) | 237412   |
| `Poll`          | [`0xFe32134fa5c229c505EaFC724C9F194E7458c0Ed`](https://basescan.org/address/0xFe32134fa5c229c505EaFC724C9F194E7458c0Ed) | 303569   |
| `TodoList`      | [`0x0292Fb832cF9569aa32C03AA0c1ED3B3c924e7e7`](https://basescan.org/address/0x0292Fb832cF9569aa32C03AA0c1ED3B3c924e7e7) | 428212   |
| `VersionLog`    | [`0xF9AB59194cA951A75ca55b3f78B61f8d0Afc2A84`](https://basescan.org/address/0xF9AB59194cA951A75ca55b3f78B61f8d0Afc2A84) | 482240   |
| `Whitelist`     | [`0x2A504f8b9bd57AB469Ef3be82a0298Ea9edD58C0`](https://basescan.org/address/0x2A504f8b9bd57AB469Ef3be82a0298Ea9edD58C0) | 259327   |

## Provenance

These addresses correspond to the source tree at commit `0028994`, before the
NatSpec documentation pass. The deployed bytecode therefore differs from the
current `contracts/` sources only in metadata: documentation comments do not
change generated code, but they do change the metadata hash appended to it.

Nothing in this repository upgrades or migrates these contracts. Redeploying
produces new addresses; it does not replace the ones above.

## Reproducing

```
git checkout 0028994
npm ci && npm run compile
```
