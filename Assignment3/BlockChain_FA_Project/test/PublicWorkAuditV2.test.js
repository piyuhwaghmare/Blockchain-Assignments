const { expect } = require("chai");
const hre = require("hardhat");

const ZERO = hre.ethers.ZeroAddress;

describe("PublicWorkAuditV2 - Advanced Features", function () {
  async function deploy() {
    const [admin, gov, contractor, oracle, oracle2, citizen1, citizen2, arbitrator] = 
      await hre.ethers.getSigners();
    
    const PublicWorkAuditV2 = await hre.ethers.getContractFactory("PublicWorkAuditV2");
    const auditWindow = 5;
    const vetoThreshold = 2;
    const c = await PublicWorkAuditV2.deploy(auditWindow, vetoThreshold);
    await c.waitForDeployment();
    
    // Setup oracles with different types
    await c.connect(admin).setOracle(oracle.address, true, 0); // Manual
    await c.connect(admin).setOracle(oracle2.address, true, 1); // IoT
    
    return {
      c,
      admin,
      gov,
      contractor,
      oracle,
      oracle2,
      citizen1,
      citizen2,
      arbitrator,
      auditWindow,
      vetoThreshold,
    };
  }

  describe("Project Creation with Advanced Features", function () {
    it("creates project with deadline and location", async function () {
      const { c, gov, contractor } = await deploy();
      const descs = ["Foundation", "Structure"];
      const amounts = [hre.ethers.parseEther("0.4"), hre.ethers.parseEther("0.6")];
      const total = hre.ethers.parseEther("1");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
      
      await expect(
        c.connect(gov).createProject(
          "Smart Bridge",
          "Advanced bridge with IoT sensors",
          "QmBlueprint",
          contractor.address,
          ZERO,
          2, // Oracle quorum
          deadline,
          "Mumbai, India",
          "Infrastructure",
          descs,
          amounts,
          { value: total }
        )
      ).to.emit(c, "ProjectCreated");
      
      const project = await c.projects(0);
      expect(project.location).to.equal("Mumbai, India");
      expect(project.category).to.equal("Infrastructure");
      expect(project.completionDeadline).to.equal(deadline);
    });

    it("rejects project with past deadline", async function () {
      const { c, gov, contractor } = await deploy();
      const pastDeadline = Math.floor(Date.now() / 1000) - 1000;
      
      await expect(
        c.connect(gov).createProject(
          "Test",
          "Desc",
          "Qm",
          contractor.address,
          ZERO,
          1,
          pastDeadline,
          "Location",
          "Category",
          ["M1"],
          [hre.ethers.parseEther("1")],
          { value: hre.ethers.parseEther("1") }
        )
      ).to.be.revertedWith("Invalid deadline");
    });
  });

  describe("Enhanced Milestone Submission", function () {
    it("submits milestone with quality score and attachments", async function () {
      const { c, gov, contractor } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Delhi",
        "Roads",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      const attachments = ["QmPhoto1", "QmPhoto2", "QmVideo1"];
      await expect(
        c.connect(contractor).submitMilestoneProof(
          0,
          0,
          "QmEvidence",
          85, // Quality score
          attachments
        )
      ).to.emit(c, "MilestoneProofSubmitted");

      const milestone = await c.getMilestone(0, 0);
      expect(milestone.qualityScore).to.equal(85);
      
      const storedAttachments = await c.getMilestoneAttachments(0, 0);
      expect(storedAttachments.length).to.equal(3);
      expect(storedAttachments[0]).to.equal("QmPhoto1");
    });

    it("enforces rate limiting on submissions", async function () {
      const { c, gov, contractor } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1", "M2"],
        [hre.ethers.parseEther("0.5"), hre.ethers.parseEther("0.5")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE1", 80, []);
      
      // Second submission should fail due to rate limit
      await expect(
        c.connect(contractor).submitMilestoneProof(0, 1, "QmE2", 80, [])
      ).to.be.revertedWith("Rate limit");
    });
  });

  describe("Oracle Reputation System", function () {
    it("tracks oracle attestations and reputation", async function () {
      const { c, gov, contractor, oracle } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 90, []);
      
      const infoBefore = await c.getOracleInfo(oracle.address);
      expect(infoBefore.totalAttestations).to.equal(0);
      
      await c.connect(oracle).oracleVerifyMilestone(0, 0);
      
      const infoAfter = await c.getOracleInfo(oracle.address);
      expect(infoAfter.totalAttestations).to.equal(1);
      expect(infoAfter.successfulAttestations).to.equal(1);
      expect(infoAfter.reputationScore).to.be.gt(infoBefore.reputationScore);
    });

    it("emits oracle type in attestation event", async function () {
      const { c, gov, contractor, oracle2 } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 90, []);
      
      // oracle2 is IoT type (1)
      await expect(c.connect(oracle2).oracleVerifyMilestone(0, 0))
        .to.emit(c, "MilestoneOracleAttested");
    });
  });

  describe("Citizen Voting with Comments", function () {
    it("allows citizens to vote with comments", async function () {
      const { c, gov, contractor, oracle, citizen1 } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 90, []);
      await c.connect(oracle).oracleVerifyMilestone(0, 0);
      
      await expect(
        c.connect(citizen1).citizenAuditVote(0, 0, true, "Excellent work quality")
      ).to.emit(c, "CitizenVote");
    });
  });

  describe("Emergency Controls", function () {
    it("allows admin to pause system", async function () {
      const { c, admin, gov, contractor } = await deploy();
      
      await c.connect(admin).emergencyPause(true);
      
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      await expect(
        c.connect(gov).createProject(
          "Project",
          "Desc",
          "Qm1",
          contractor.address,
          ZERO,
          1,
          deadline,
          "Location",
          "Category",
          ["M1"],
          [hre.ethers.parseEther("1")],
          { value: hre.ethers.parseEther("1") }
        )
      ).to.be.revertedWith("System paused");
    });

    it("allows government to pause specific project", async function () {
      const { c, gov, contractor } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(gov).pauseProject(0, true);
      
      await expect(
        c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 80, [])
      ).to.be.revertedWith("Project paused");
    });
  });

  describe("Dispute Resolution System", function () {
    it("creates and resolves dispute with arbitrators", async function () {
      const { c, admin, gov, contractor, oracle, arbitrator } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 80, []);
      
      // Create dispute
      await expect(
        c.connect(gov).createDispute(0, 0, "Quality concerns")
      ).to.emit(c, "MilestoneDisputed");

      // Add arbitrator
      await c.connect(admin).addArbitrator(0, arbitrator.address);
      
      // Arbitrator votes
      await c.connect(arbitrator).arbitratorVote(0, true); // Favor contractor
      
      // Resolve dispute
      await expect(
        c.connect(admin).resolveDispute(0)
      ).to.emit(c, "DisputeResolved");
    });
  });

  describe("Analytics and Statistics", function () {
    it("tracks project statistics", async function () {
      const { c, gov, contractor, oracle, citizen1, citizen2 } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1", "M2"],
        [hre.ethers.parseEther("0.5"), hre.ethers.parseEther("0.5")],
        { value: hre.ethers.parseEther("1") }
      );

      // Complete first milestone
      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 90, []);
      await c.connect(oracle).oracleVerifyMilestone(0, 0);
      await c.connect(citizen1).citizenAuditVote(0, 0, true, "Good");
      await c.connect(citizen2).citizenAuditVote(0, 0, true, "Good");
      
      await hre.network.provider.send("evm_increaseTime", [10]);
      await hre.network.provider.send("evm_mine");
      
      await c.finalizeMilestone(0, 0);
      
      const stats = await c.getProjectStats(0);
      expect(stats.totalMilestones).to.equal(2);
      expect(stats.completedMilestones).to.equal(1);
      expect(stats.pendingMilestones).to.equal(1);
    });

    it("tracks contractor performance score", async function () {
      const { c, gov, contractor, oracle, citizen1, citizen2 } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 95, []);
      await c.connect(oracle).oracleVerifyMilestone(0, 0);
      await c.connect(citizen1).citizenAuditVote(0, 0, true, "Excellent");
      await c.connect(citizen2).citizenAuditVote(0, 0, true, "Great");
      
      await hre.network.provider.send("evm_increaseTime", [10]);
      await hre.network.provider.send("evm_mine");
      
      await c.finalizeMilestone(0, 0);
      
      const score = await c.getContractorScore(contractor.address);
      expect(score).to.equal(95);
    });
  });

  describe("Reentrancy Protection", function () {
    it("prevents reentrancy attacks on finalization", async function () {
      const { c, gov, contractor, oracle, citizen1, citizen2 } = await deploy();
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await c.connect(gov).createProject(
        "Project",
        "Desc",
        "Qm1",
        contractor.address,
        ZERO,
        1,
        deadline,
        "Location",
        "Category",
        ["M1"],
        [hre.ethers.parseEther("1")],
        { value: hre.ethers.parseEther("1") }
      );

      await c.connect(contractor).submitMilestoneProof(0, 0, "QmE", 90, []);
      await c.connect(oracle).oracleVerifyMilestone(0, 0);
      await c.connect(citizen1).citizenAuditVote(0, 0, true, "Good");
      await c.connect(citizen2).citizenAuditVote(0, 0, true, "Good");
      
      await hre.network.provider.send("evm_increaseTime", [10]);
      await hre.network.provider.send("evm_mine");
      
      // First finalization should succeed
      await c.finalizeMilestone(0, 0);
      
      // Second attempt should fail (already paid)
      await expect(c.finalizeMilestone(0, 0)).to.be.reverted;
    });
  });
});
