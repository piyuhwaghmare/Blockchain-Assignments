const hre = require("hardhat");

async function main() {
  console.log("🎭 Setting up demo data...\n");

  const [gov, contractor, oracle1, oracle2, citizen1, citizen2] = await hre.ethers.getSigners();

  // Get contract address from environment or deployment
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];
  if (!contractAddress) {
    console.error("❌ Please provide contract address");
    process.exit(1);
  }

  const PublicWorkAuditV2 = await hre.ethers.getContractFactory("PublicWorkAuditV2");
  const contract = PublicWorkAuditV2.attach(contractAddress);

  console.log("📝 Contract:", contractAddress);
  console.log("👤 Government:", gov.address);
  console.log("🏗️  Contractor:", contractor.address);
  console.log("🔍 Oracles:", oracle1.address, oracle2.address);
  console.log("👥 Citizens:", citizen1.address, citizen2.address, "\n");

  // Setup additional oracles
  console.log("Setting up oracles...");
  await contract.connect(gov).setOracle(oracle1.address, true, 1); // IoT
  await contract.connect(gov).setOracle(oracle2.address, true, 2); // AI
  console.log("✅ Oracles configured\n");

  // Create sample projects
  const projects = [
    {
      title: "Mumbai Coastal Highway - Phase II",
      description: "Advanced highway construction with smart traffic management and IoT sensors",
      location: "Mumbai, Maharashtra",
      category: "Infrastructure",
      milestones: [
        { desc: "Site survey and soil analysis", amount: "2.5" },
        { desc: "Foundation and drainage system", amount: "5.0" },
        { desc: "Road surface and IoT installation", amount: "7.5" },
      ],
    },
    {
      title: "Delhi Metro Extension - Green Line",
      description: "Metro rail extension with eco-friendly stations and solar power integration",
      location: "Delhi NCR",
      category: "Transportation",
      milestones: [
        { desc: "Underground tunnel excavation", amount: "10.0" },
        { desc: "Station construction", amount: "8.0" },
        { desc: "Track laying and electrification", amount: "6.0" },
      ],
    },
    {
      title: "Bangalore Smart Water Grid",
      description: "IoT-enabled water distribution network with leak detection and quality monitoring",
      location: "Bangalore, Karnataka",
      category: "Utilities",
      milestones: [
        { desc: "Pipeline network installation", amount: "4.0" },
        { desc: "IoT sensor deployment", amount: "2.0" },
        { desc: "Control center setup", amount: "3.0" },
      ],
    },
  ];

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`Creating project ${i + 1}: ${project.title}...`);

    const milestoneDescs = project.milestones.map((m) => m.desc);
    const milestoneAmounts = project.milestones.map((m) => hre.ethers.parseEther(m.amount));
    const totalBudget = milestoneAmounts.reduce((a, b) => a + b, 0n);
    const deadline = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year

    const tx = await contract.connect(gov).createProject(
      project.title,
      project.description,
      `QmBlueprint${i}`,
      contractor.address,
      hre.ethers.ZeroAddress,
      2, // Oracle quorum
      deadline,
      project.location,
      project.category,
      milestoneDescs,
      milestoneAmounts,
      { value: totalBudget }
    );

    await tx.wait();
    console.log(`✅ Project ${i} created\n`);

    // Submit first milestone for first project
    if (i === 0) {
      console.log("Submitting first milestone...");
      await contract.connect(contractor).submitMilestoneProof(
        0,
        0,
        "QmEvidenceHash123",
        92, // Quality score
        ["QmPhoto1", "QmPhoto2", "QmDrone1"]
      );
      console.log("✅ Milestone submitted\n");

      // Oracle attestations
      console.log("Oracle attestations...");
      await contract.connect(oracle1).oracleVerifyMilestone(0, 0);
      console.log("✅ Oracle 1 attested");
      
      await contract.connect(oracle2).oracleVerifyMilestone(0, 0);
      console.log("✅ Oracle 2 attested (quorum reached)\n");

      // Citizen votes
      console.log("Citizen voting...");
      await contract.connect(citizen1).citizenAuditVote(0, 0, true, "Excellent quality work");
      await contract.connect(citizen2).citizenAuditVote(0, 0, true, "Very satisfied with progress");
      console.log("✅ Citizens voted\n");
    }
  }

  console.log("✨ Demo data setup complete!\n");
  console.log("📊 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ ${projects.length} projects created`);
  console.log("✅ 1 milestone submitted and in public audit");
  console.log("✅ Oracle quorum reached");
  console.log("✅ Citizen votes recorded");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
