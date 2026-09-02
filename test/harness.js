const { createVM } = require("@ethereumjs/vm");
const { createBlock } = require("@ethereumjs/block");
const { Common, Mainnet, Hardfork } = require("@ethereumjs/common");
const { Address, hexToBytes, bytesToHex } = require("@ethereumjs/util");
const { ethers } = require("ethers");
const { compileAll } = require("../compile");

const GAS_LIMIT = 30_000_000n;

// A fresh VM reports block.timestamp as 0, which silently breaks any contract
// that treats a zero timestamp as "unset". Start the chain at a plausible time
// instead and let tests move it forward.
const GENESIS_TIMESTAMP = 1_700_000_000n;

// Compiling is the slow part, so do it once for the whole test run.
let artifactCache = null;
function artifacts() {
  if (!artifactCache) {
    artifactCache = new Map(compileAll().map((a) => [a.name, a]));
  }
  return artifactCache;
}

/** Deterministic test accounts, so failures are reproducible. */
function account(index) {
  return new Address(hexToBytes("0x" + (index + 1).toString(16).padStart(40, "0")));
}

/** Extracts the string from a reverted call's Error(string) return data. */
function revertReason(returnValue) {
  const data = bytesToHex(returnValue);
  if (data === "0x") return null;
  try {
    return ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + data.slice(10))[0];
  } catch {
    return data;
  }
}

class Contract {
  constructor(chain, address, abi) {
    this.chain = chain;
    this.address = address;
    this.iface = new ethers.Interface(abi);
  }

  /** Runs a function and returns its decoded return value. */
  async read(fn, args = [], opts = {}) {
    const result = await this.#run(fn, args, opts);
    if (result.error) throw new Error(`${fn} reverted: ${result.error}`);
    const decoded = this.iface.decodeFunctionResult(fn, bytesToHex(result.returnValue));
    return decoded.length === 1 ? decoded[0] : decoded;
  }

  /** Runs a state-changing function. Throws if it reverts. */
  async send(fn, args = [], opts = {}) {
    const result = await this.#run(fn, args, opts);
    if (result.error) throw new Error(`${fn} reverted: ${result.error}`);
    return result;
  }

  /** Runs a function that is expected to revert and returns the reason. */
  async expectRevert(fn, args = [], opts = {}) {
    const result = await this.#run(fn, args, opts);
    if (!result.error) throw new Error(`${fn} was expected to revert but succeeded`);
    return result.error;
  }

  async #run(fn, args, opts) {
    const caller = opts.from ?? account(0);
    const res = await this.chain.vm.evm.runCall({
      caller,
      origin: caller,
      to: this.address,
      gasLimit: GAS_LIMIT,
      block: this.chain.block(),
      data: hexToBytes(this.iface.encodeFunctionData(fn, args)),
    });
    const exec = res.execResult;
    return {
      error: exec.exceptionError
        ? (revertReason(exec.returnValue) ?? exec.exceptionError.error)
        : null,
      returnValue: exec.returnValue,
      gasUsed: exec.executionGasUsed,
      logs: this.#decodeLogs(exec.logs || []),
    };
  }

  #decodeLogs(rawLogs) {
    return rawLogs.map(([, topics, data]) => {
      const parsed = this.iface.parseLog({
        topics: topics.map((t) => bytesToHex(t)),
        data: bytesToHex(data),
      });
      return parsed ? { name: parsed.name, args: parsed.args } : null;
    });
  }
}

class TestChain {
  constructor(vm) {
    this.vm = vm;
    this.timestamp = GENESIS_TIMESTAMP;
    this.blockNumber = 1n;
  }

  /** The block context handed to every call, so block.timestamp is sane. */
  block() {
    return createBlock({ header: { number: this.blockNumber, timestamp: this.timestamp } });
  }

  /** Moves the chain forward, for tests that depend on elapsed time. */
  warp(seconds) {
    this.timestamp += BigInt(seconds);
    this.blockNumber += 1n;
    return this.timestamp;
  }

  static async create() {
    const common = new Common({ chain: Mainnet, hardfork: Hardfork.Shanghai });
    return new TestChain(await createVM({ common }));
  }

  async deploy(name, opts = {}) {
    const artifact = artifacts().get(name);
    if (!artifact) throw new Error(`No artifact named "${name}"`);

    const deployer = opts.from ?? account(0);
    const res = await this.vm.evm.runCall({
      caller: deployer,
      origin: deployer,
      gasLimit: GAS_LIMIT,
      block: this.block(),
      data: hexToBytes(artifact.bytecode),
    });
    if (res.execResult.exceptionError) {
      throw new Error(`Deploying ${name} failed: ${res.execResult.exceptionError.error}`);
    }
    return new Contract(this, res.createdAddress, artifact.abi);
  }
}

module.exports = { TestChain, account, GAS_LIMIT, GENESIS_TIMESTAMP };
