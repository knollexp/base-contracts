const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "contracts");

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
  for (const file of files) {
    const contracts = output.contracts[file] || {};
    for (const [name, c] of Object.entries(contracts)) {
      artifacts.push({
        file,
        name,
        abi: c.abi,
        bytecode: "0x" + c.evm.bytecode.object,
      });
    }
  }
  return artifacts;
}

module.exports = { compileAll };

if (require.main === module) {
  const artifacts = compileAll();
  console.log(`Compiled ${artifacts.length} contract(s) with solc ${solc.version()}\n`);
  for (const a of artifacts) {
    const sizeBytes = (a.bytecode.length - 2) / 2;
    console.log(`  ${a.name.padEnd(16)} ${String(sizeBytes).padStart(5)} bytes  (${a.file})`);
  }
}
