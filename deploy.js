const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { compileAll } = require("./compile");

// Load .env if present (Node >= 20.12 builtin, no dependency). Values already
// set in the real environment win, so an inline PRIVATE_KEY=... still works.
const ENV_FILE = path.join(__dirname, ".env");
if (fs.existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const NETWORKS = {
  base: {
    chainId: 8453n,
    rpc: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    explorer: "https://basescan.org",
  },
  sepolia: {
    chainId: 84532n,
    rpc: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
  },
};

let activeProvider = null;

function parseArgs(argv) {
  const args = { network: "base", broadcast: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--network") args.network = argv[++i];
    else if (argv[i] === "--yes") args.broadcast = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!NETWORKS[args.network]) {
    throw new Error(`Unknown network "${args.network}". Use: ${Object.keys(NETWORKS).join(", ")}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const net = NETWORKS[args.network];

  const pk = process.env.PRIVATE_KEY;
  if (!pk || pk.includes("HIER_DEINEN_KEY")) {
    throw new Error("PRIVATE_KEY is not set. Put it in .env (gitignored) or set it in the shell.");
  }

  const provider = new ethers.JsonRpcProvider(net.rpc);
  activeProvider = provider;
  const wallet = new ethers.Wallet(pk.startsWith("0x") ? pk : "0x" + pk, provider);

  const chain = await provider.getNetwork();
  if (chain.chainId !== net.chainId) {
    throw new Error(
      `RPC reports chainId ${chain.chainId}, expected ${net.chainId} for "${args.network}"`
    );
  }

  const artifacts = compileAll();
  const balance = await provider.getBalance(wallet.address);
  const fee = await provider.getFeeData();
  const gasPrice = fee.maxFeePerGas ?? fee.gasPrice;

  console.log(`Network   : ${args.network} (chainId ${chain.chainId})`);
  console.log(`RPC       : ${net.rpc}`);
  console.log(`Deployer  : ${wallet.address}`);
  console.log(`Balance   : ${ethers.formatEther(balance)} ETH`);
  console.log(`Gas price : ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Contracts : ${artifacts.length}\n`);

  let totalGas = 0n;
  for (const a of artifacts) {
    const gas = await provider.estimateGas({ from: wallet.address, data: a.bytecode });
    a.gas = gas;
    totalGas += gas;
    console.log(`  ${a.name.padEnd(16)} ~${String(gas).padStart(8)} gas`);
  }

  const estCost = totalGas * gasPrice;
  console.log(`\nTotal estimated gas : ${totalGas}`);
  console.log(`Total estimated cost: ${ethers.formatEther(estCost)} ETH (L2 execution only)`);
  console.log(`Note: Base also charges an L1 data fee per tx that is not included above.`);

  if (balance < estCost * 2n) {
    console.log(`\n!! Balance is below 2x the estimate. Top up before broadcasting.`);
  }

  if (!args.broadcast) {
    console.log(`\nDRY RUN — nothing was sent. Re-run with --yes to broadcast.`);
    return;
  }

  console.log(`\nBroadcasting ${artifacts.length} deployments...\n`);
  const deployments = [];
  for (const a of artifacts) {
    const factory = new ethers.ContractFactory(a.abi, a.bytecode, wallet);
    const contract = await factory.deploy();
    const tx = contract.deploymentTransaction();
    console.log(`  ${a.name.padEnd(16)} tx ${tx.hash}`);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const receipt = await provider.getTransactionReceipt(tx.hash);
    console.log(
      `  ${"".padEnd(16)} -> ${address}  (block ${receipt.blockNumber}, gas used ${receipt.gasUsed})\n`
    );
    deployments.push({
      name: a.name,
      address,
      txHash: tx.hash,
      block: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });
  }

  const outPath = path.join(__dirname, `deployments.${args.network}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        network: args.network,
        chainId: Number(net.chainId),
        deployer: wallet.address,
        deployedAt: new Date().toISOString(),
        contracts: deployments,
      },
      null,
      2
    ) + "\n"
  );

  console.log(`Done. ${deployments.length} contracts deployed by ${wallet.address}`);
  console.log(`Saved: ${outPath}`);
  console.log(`Verify on explorer: ${net.explorer}/address/${wallet.address}`);
}

main()
  .catch((err) => {
    console.error(`\nERROR: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    // Close the RPC socket so the process exits on its own instead of being
    // torn down mid-flight by process.exit().
    if (activeProvider) activeProvider.destroy();
  });
