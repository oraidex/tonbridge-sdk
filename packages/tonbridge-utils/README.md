# tonbridge-utils

## Overview

This package is forked from [TonRocks](https://github.com/oraichain/ton-trustless-bridge-relayer/tree/master/src/lib/ton-rocks-js). It is a utility package for parsing all kinds of TON data such as blocks, transactions, configurations,...

We need such parsing functions because our TON Bridge system is trustless, and we have to parse TON data from BoC format to the human-readable format and extract data for verification.

## Features

- Parse TON Cells, Hashmaps.
- Parse TON blocks, account states, validators, TON config.
- TL-B and TL-B typescript codegen for TON Bridge data formats.

## Quick start

Firstly, we need to install the dependencies and build the package:

```bash
# Install dependencies
yarn

# build
yarn build
```

Next, we import the package in `package.json` and use it. Eg: `"@oraichain/tonbridge-utils": "^1.2.5",`

## Generate typescript from TL-B

If you want to update the TL-B typescript codegen, you can use the following command:

```bash

# Eg:
yarn tlb src/tlb/outmsg-body.tlb
```