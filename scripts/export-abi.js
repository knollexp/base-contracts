const fs = require("fs");
const path = require("path");
const { compileAll } = require("../compile");

const OUT_DIR = path.join(__dirname, "..", "abi");

/**
 * Writes one JSON file per contract into abi/, so consumers can read an
 * interface without installing a Solidity compiler.
 */
function exportAbis() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Drop files for contracts that no longer exist, otherwise a rename leaves
  // a stale interface behind that still looks current.
  const current = new Set();
  const artifacts = compileAll();

  for (const artifact of artifacts) {
    const file = `${artifact.name}.json`;
    current.add(file);
    fs.writeFileSync(
      path.join(OUT_DIR, file),
      JSON.stringify(artifact.abi, null, 2) + "\n"
    );
  }

  let removed = 0;
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith(".json") && !current.has(file)) {
      fs.unlinkSync(path.join(OUT_DIR, file));
      removed++;
    }
  }

  return { written: artifacts.length, removed };
}

module.exports = { exportAbis, OUT_DIR };

if (require.main === module) {
  const { written, removed } = exportAbis();
  console.log(`Wrote ${written} ABI file(s) to abi/`);
  if (removed) console.log(`Removed ${removed} stale file(s)`);
}
