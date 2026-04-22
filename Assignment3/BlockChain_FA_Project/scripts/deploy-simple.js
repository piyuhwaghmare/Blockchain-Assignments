const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Simple Public Works...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy simple contract
  console.log("📝 Deploying SimplePublicWorks...");
  const SimplePublicWorks = await hre.ethers.getContractFactory("SimplePublicWorks");
  const contract = await SimplePublicWorks.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);

  // Save ABI
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const frontendAbiDir = path.join(__dirname, "..", "frontend", "src", "abi");
  
  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }

  const artifactPath = path.join(artifactsDir, "SimplePublicWorks.sol", "SimplePublicWorks.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendAbiDir, "SimplePublicWorks.json"),
      JSON.stringify({ abi: artifact.abi, address: contractAddress }, null, 2)
    );
    console.log("✅ ABI exported");
  }

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
  const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}
VITE_NETWORK=localhost
VITE_CHAIN_ID=31337
`;
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("✅ Frontend .env updated");

  // Create a demo project
  console.log("\n📝 Creating demo project...");
  
  const contractor = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const budget = hre.ethers.parseEther("3");
  
  const tx = await contract.createProject(
    contractor,
    "Demo Bridge Construction",
    "A test bridge for demonstration",
    budget,
    3, // veto threshold
    { value: budget }
  );
  
  await tx.wait();
  console.log("✅ Demo project created (Project ID: 0)");

  // Contractor submits proof
  console.log("\n📝 Contractor submitting proof...");
  const contractorSigner = await hre.ethers.getSigner(contractor);
  const contractWithContractor = contract.connect(contractorSigner);
  
  await contractWithContractor.submitProof(0, "QmDemoProofHash123");
  console.log("✅ Proof submitted");

  console.log("\n✨ Deployment complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract:", contractAddress);
  console.log("Project ID: 0 created");
  console.log("Contractor:", contractor);
  console.log("Budget: 3 ETH");
  console.log("Veto Threshold: 3 votes");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🎮 How to use:");
  console.log("1. Government creates project (already done)");
  console.log("2. Contractor submits proof (already done)");
  console.log("3. Public votes with ETH");
  console.log("4. System automatically pays when approved");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
