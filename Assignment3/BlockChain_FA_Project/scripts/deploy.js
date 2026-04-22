const hre = require("hardhat");

async function main() {
  const auditWindow = 120; // 2 minutes for local demos (override in prod)
  const vetoThreshold = 3n;

  const PublicWorkAudit = await hre.ethers.getContractFactory("PublicWorkAudit");
  const contract = await PublicWorkAudit.deploy(auditWindow, vetoThreshold);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("PublicWorkAudit deployed to:", address);
  console.log("Public audit window (seconds):", auditWindow.toString());
  console.log("Veto threshold:", vetoThreshold.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
