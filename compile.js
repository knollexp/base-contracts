const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "contracts");

// EIP-170: a contract whose deployed bytecode exceeds this cannot be created.
// Catching it here is far cheaper than catching it as a failed mainnet tx.
const MAX_CONTRACT_SIZE = 24576;

function compileAll() {
  const files = fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".sol")).sort();

  const sources = {};
  for (const file of files) {
    sources[file] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, file), "utf8") };
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "shanghai",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length) {
    for (const e of errors) console.error(e.formattedMessage);
    throw new Error(`Compilation failed with ${errors.length} error(s)`);
  }
  for (const w of (output.errors || []).filter((e) => e.severity === "warning")) {
    console.warn("warning:", w.formattedMessage.trim());
  }

  const artifacts = [];
  const oversized = [];
  for (const file of files) {
    const contracts = output.contracts[file] || {};
    for (const [name, c] of Object.entries(contracts)) {
      const size = c.evm.bytecode.object.length / 2;
      if (size > MAX_CONTRACT_SIZE) {
        oversized.push(`${name} is ${size} bytes, over the ${MAX_CONTRACT_SIZE} byte limit`);
      }
      artifacts.push({
        file,
        name,
        abi: c.abi,
        bytecode: "0x" + c.evm.bytecode.object,
        size,
      });
    }
  }

  if (oversized.length) {
    throw new Error("Contract size limit exceeded: " + oversized.join("; "));
  }

  return artifacts;
}

module.exports = { compileAll, MAX_CONTRACT_SIZE };

if (require.main === module) {
  const artifacts = compileAll();
  console.log(`Compiled ${artifacts.length} contract(s) with solc ${solc.version()}\n`);
  for (const a of artifacts) {
    const headroom = ((1 - a.size / MAX_CONTRACT_SIZE) * 100).toFixed(1);
    console.log(
      `  ${a.name.padEnd(16)} ${String(a.size).padStart(5)} bytes  ${headroom.padStart(5)}% headroom  (${a.file})`
    );
  }
}
