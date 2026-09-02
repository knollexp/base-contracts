const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ENV_FILE = path.join(__dirname, "..", ".env");
if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");

// Etherscan's unified v2 endpoint covers Base under a chain id, so one key
// works across networks instead of needing a separate Basescan key.
const API = "https://api.etherscan.io/v2/api";
const CHAIN_IDS = { base: 8453, sepolia: 84532 };

/**
 * Rebuilds the exact standard-JSON input compile.js used. Verification
 * compares compiler output byte for byte, so any drift in optimizer runs or
 * evmVersion here produces a mismatch that looks like a wrong address.
 */
function standardJsonInput() {
  const sources = {};
  for (const file of fs
    .readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith(".sol"))
    .sort()) {
    sources[file] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, file), "utf8") };
  }
  return {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "shanghai",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
}

function compilerVersion() {
  // solc reports "0.8.36+commit.8a079791.Emscripten.clang"; the API wants
  // "v0.8.36+commit.8a079791".
  const [semver, commit] = solc.version().split(".Emscripten")[0].split("+");
  return `v${semver}+${commit}`;
}

async function submit(chainId, apiKey, name, address) {
  const body = new URLSearchParams({
    module: "contract",
    action: "verifysourcecode",
    chainid: String(chainId),
    apikey: apiKey,
    codeformat: "solidity-standard-json-input",
    sourceCode: JSON.stringify(standardJsonInput()),
    contractaddress: address,
    contractname: `${name}.sol:${name}`,
    compilerversion: compilerVersion(),
    constructorArguements: "",
  });

  const res = await fetch(`${API}?chainid=${chainId}`, { method: "POST", body });
  const json = await res.json();
  return { ok: json.status === "1", message: json.result };
}

async function main() {
  const network = process.argv[2] || "base";
  const chainId = CHAIN_IDS[network];
  if (!chainId) throw new Error(`Unknown network "${network}". Use: base, sepolia`);

  const apiKey = process.env.BASESCAN_API_KEY;
  if (!apiKey) throw new Error("BASESCAN_API_KEY is not set. Get one from etherscan.io.");

  const file = path.join(__dirname, "..", `deployments.${network}.json`);
  if (!fs.existsSync(file)) throw new Error(`No ${path.basename(file)}. Deploy first.`);

  const { contracts } = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`Verifying ${contracts.length} contract(s) on ${network} with ${compilerVersion()}`);
  console.log(
    "This submits the CURRENT sources. If contracts/ has changed since the " +
      "deployment - even only in comments, which move the metadata hash - " +
      "verification will be rejected as a bytecode mismatch. See docs/addresses.md.\n"
  );

  for (const { name, address } of contracts) {
    const { ok, message } = await submit(chainId, apiKey, name, address);
    console.log(`  ${name.padEnd(16)} ${ok ? "submitted" : "failed"}: ${message}`);
    // The API rejects bursts; one submission per second is within its limit.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\nSubmission is asynchronous. Check each address on the explorer.`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`ERROR: ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = { standardJsonInput, compilerVersion };
