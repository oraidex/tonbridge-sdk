# Oraichain Ton Bridge SDK

## Generate code and docs

```bash
# build code:
cwtools build ../tonbridge-cw-contracts/contracts/* -o packages/contracts-build/data
# build schema
cwtools build ../tonbridge-cw-contracts/contracts/* -s
# gen code:
cwtools gents ../tonbridge-cw-contracts/contracts/* -o packages/contracts-sdk/src
# gen doc:
yarn docs

# patch a package:
yarn patch-package @cosmjs/cosmwasm-stargate
```
