const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔄 Fresh Start - Deploying Working System\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy ORIGINAL PublicWorkAudit (tested and working)
  console.log("\n📝 Deploying PublicWorkAudit (original, tested)...");
  const PublicWorkAudit = await hre.ethers.getContractFactory("PublicWorkAudit");
  const auditWindow = 30; // 30 seconds for demo
  const vetoThreshold = 2;
  const auditContract = await PublicWorkAudit.deploy(auditWindow, vetoThreshold);
  await auditContract.waitForDeployment();
  const auditAddress = await auditContract.getAddress();
  console.log("✅ PublicWorkAudit deployed:", auditAddress);

  // 2. Setup oracle
  await auditContract.setOracle(deployer.address, true);
  console.log("✅ Oracle setup");

  // 3. Create demo project
  console.log("\n📝 Creating demo project...");
  const contractor = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const milestoneDescs = ["Foundation", "Structure"];
  const milestoneAmounts = [hre.ethers.parseEther("1"), hre.ethers.parseEther("2")];
  const totalBudget = milestoneAmounts.reduce((a, b) => a + b, 0n);

  const tx = await auditContract.createProject(
    "Demo Bridge",
    "Test bridge for presentation",
    "QmDemoBlueprint",
    contractor,
    hre.ethers.ZeroAddress,
    1, // oracle quorum
    milestoneDescs,
    milestoneAmounts,
    { value: totalBudget }
  );
  await tx.wait();
  console.log("✅ Demo project created (ID: 0)");

  // 4. Submit milestone
  console.log("\n📝 Submitting milestone...");
  const contractorSigner = await hre.ethers.getSigner(contractor);
  const contractWithContractor = auditContract.connect(contractorSigner);
  await contractWithContractor.submitMilestoneProof(0, 0, "QmDemoEvidence");
  console.log("✅ Milestone submitted");

  // 5. Oracle attest
  console.log("\n🔍 Oracle attesting...");
  await auditContract.oracleVerifyMilestone(0, 0);
  console.log("✅ Oracle attested");

  // 6. Update frontend
  console.log("\n🔄 Updating frontend...");
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
  const envContent = `VITE_CONTRACT_ADDRESS=${auditAddress}
VITE_NETWORK=localhost
VITE_CHAIN_ID=31337
`;
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("✅ Frontend .env updated");

  // 7. Export ABI
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const frontendAbiDir = path.join(__dirname, "..", "frontend", "src", "abi");
  
  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }

  const artifactPath = path.join(artifactsDir, "PublicWorkAudit.sol", "PublicWorkAudit.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendAbiDir, "PublicWorkAudit.json"),
      JSON.stringify({ abi: artifact.abi, address: auditAddress }, null, 2)
    );
    console.log("✅ ABI exported");
  }

  console.log("\n✨ Fresh Start Complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract:", auditAddress);
  console.log("Project ID: 0 created");
  console.log("Status: Ready for citizen voting");
  console.log("Audit window: 30 seconds");
  console.log("Veto threshold: 2 votes");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🎮 Next Steps:");
  console.log("1. Switch to Citizen account");
  console.log("2. Go to Explorer → Demo Bridge");
  console.log("3. Click 'Validate work'");
  console.log("4. Wait 30 seconds");
  console.log("5. Click 'Finalize milestone'");
  console.log("6. Payment happens automatically!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
