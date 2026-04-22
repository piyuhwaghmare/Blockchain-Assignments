const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Quick Fix: Deploying working contract...\n");

  // Deploy original contract
  const PublicWorkAudit = await hre.ethers.getContractFactory("PublicWorkAudit");
  const auditWindow = 120; // 2 minutes for demo
  const vetoThreshold = 3;
  
  const contract = await PublicWorkAudit.deploy(auditWindow, vetoThreshold);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ PublicWorkAudit deployed to:", contractAddress);
  console.log("Public audit window (seconds):", auditWindow);
  console.log("Veto threshold:", vetoThreshold);

  // Setup oracle
  const [admin] = await hre.ethers.getSigners();
  await contract.setOracle(admin.address, true);
  console.log("✅ Oracle setup:", admin.address);

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
  const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}
VITE_NETWORK=localhost
VITE_CHAIN_ID=31337
`;
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("✅ Frontend .env updated");

  // Create demo project
  console.log("\n📝 Creating demo project...");
  
  const contractor = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const milestoneDescs = ["Foundation", "Structure"];
  const milestoneAmounts = [hre.ethers.parseEther("1"), hre.ethers.parseEther("2")];
  const totalBudget = milestoneAmounts.reduce((a, b) => a + b, 0n);
  
  const tx = await contract.createProject(
    "Demo Bridge",
    "Presentation project",
    "QmDemoBlueprint",
    contractor,
    hre.ethers.ZeroAddress,
    1,
    milestoneDescs,
    milestoneAmounts,
    { value: totalBudget }
  );
  
  await tx.wait();
  console.log("✅ Demo project created (Project ID: 0)");

  // Submit milestone
  console.log("\n📝 Submitting milestone...");
  const contractorSigner = await hre.ethers.getSigner(contractor);
  const contractWithContractor = contract.connect(contractorSigner);
  
  await contractWithContractor.submitMilestoneProof(0, 0, "QmDemoEvidence");
  console.log("✅ Milestone submitted");

  // Oracle attest
  console.log("\n🔍 Oracle attesting...");
  await contract.oracleVerifyMilestone(0, 0);
  console.log("✅ Oracle attested");

  console.log("\n✨ Setup complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract:", contractAddress);
  console.log("Project ID: 0 ready for citizen voting");
  console.log("Frontend ready at http://localhost:5173");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
