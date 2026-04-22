const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying PublicWorkAuditV2 with advanced features...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy configuration
  const AUDIT_WINDOW = 3 * 24 * 60 * 60; // 3 days
  const VETO_THRESHOLD = 3;

  // Deploy main contract
  console.log("📝 Deploying PublicWorkAuditV2...");
  const PublicWorkAuditV2 = await hre.ethers.getContractFactory("PublicWorkAuditV2");
  const auditContract = await PublicWorkAuditV2.deploy(AUDIT_WINDOW, VETO_THRESHOLD);
  await auditContract.waitForDeployment();
  const auditAddress = await auditContract.getAddress();
  console.log("✅ PublicWorkAuditV2 deployed to:", auditAddress);

  // Deploy Governance Token
  console.log("\n📝 Deploying GovernanceToken...");
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const govToken = await GovernanceToken.deploy();
  await govToken.waitForDeployment();
  const govTokenAddress = await govToken.getAddress();
  console.log("✅ GovernanceToken deployed to:", govTokenAddress);

  // Deploy Project Factory
  console.log("\n📝 Deploying ProjectFactory...");
  const ProjectFactory = await hre.ethers.getContractFactory("ProjectFactory");
  const factory = await ProjectFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ ProjectFactory deployed to:", factoryAddress);

  // Register main contract with factory
  console.log("\n📝 Registering audit contract with factory...");
  await factory.registerContract(
    auditAddress,
    JSON.stringify({
      name: "Main Public Works Audit",
      version: "2.0.0",
      network: hre.network.name,
      deployedAt: new Date().toISOString()
    })
  );
  console.log("✅ Contract registered");

  // Deploy Mock ERC20 for testing
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n📝 Deploying MockERC20 for testing...");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Test USDC", "USDC", 6);
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log("✅ MockERC20 deployed to:", mockTokenAddress);

    // Mint some tokens to deployer
    await mockToken.mint(deployer.address, hre.ethers.parseUnits("1000000", 6));
    console.log("✅ Minted 1,000,000 USDC to deployer");
  }

  // Setup initial oracles
  console.log("\n📝 Setting up initial oracles...");
  const oracleAddresses = [deployer.address];
  for (const oracle of oracleAddresses) {
    await auditContract.setOracle(oracle, true, 0); // Manual type
    console.log("✅ Oracle added:", oracle);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PublicWorkAuditV2: auditAddress,
      GovernanceToken: govTokenAddress,
      ProjectFactory: factoryAddress,
    },
    configuration: {
      auditWindow: AUDIT_WINDOW,
      vetoThreshold: VETO_THRESHOLD,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
  const envContent = `VITE_CONTRACT_ADDRESS=${auditAddress}
VITE_GOVERNANCE_TOKEN_ADDRESS=${govTokenAddress}
VITE_FACTORY_ADDRESS=${factoryAddress}
VITE_NETWORK=${hre.network.name}
VITE_CHAIN_ID=${(await hre.ethers.provider.getNetwork()).chainId}
`;
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("✅ Frontend .env updated");

  // Export ABIs
  console.log("\n📝 Exporting ABIs...");
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const frontendAbiDir = path.join(__dirname, "..", "frontend", "src", "abi");

  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }

  // Copy V2 ABI
  const v2ArtifactPath = path.join(artifactsDir, "PublicWorkAuditV2.sol", "PublicWorkAuditV2.json");
  if (fs.existsSync(v2ArtifactPath)) {
    const v2Artifact = JSON.parse(fs.readFileSync(v2ArtifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendAbiDir, "PublicWorkAuditV2.json"),
      JSON.stringify({ abi: v2Artifact.abi }, null, 2)
    );
    console.log("✅ PublicWorkAuditV2 ABI exported");
  }

  // Copy Governance Token ABI
  const govTokenArtifactPath = path.join(artifactsDir, "GovernanceToken.sol", "GovernanceToken.json");
  if (fs.existsSync(govTokenArtifactPath)) {
    const govTokenArtifact = JSON.parse(fs.readFileSync(govTokenArtifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendAbiDir, "GovernanceToken.json"),
      JSON.stringify({ abi: govTokenArtifact.abi }, null, 2)
    );
    console.log("✅ GovernanceToken ABI exported");
  }

  console.log("\n✨ Deployment complete!\n");
  console.log("📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:", hre.network.name);
  console.log("PublicWorkAuditV2:", auditAddress);
  console.log("GovernanceToken:", govTokenAddress);
  console.log("ProjectFactory:", factoryAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("🎯 Next steps:");
  console.log("1. cd frontend && npm install");
  console.log("2. npm run dev");
  console.log("3. Connect MetaMask to", hre.network.name);
  console.log("4. Import test accounts if using localhost\n");

  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("🔍 Verify contracts on Etherscan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${auditAddress} ${AUDIT_WINDOW} ${VETO_THRESHOLD}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${govTokenAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${factoryAddress}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
