const { expect } = require("chai");
const hre = require("hardhat");

const ZERO = hre.ethers.ZeroAddress;

describe("PublicWorkAudit", function () {
  async function deploy() {
    const [admin, gov, contractor, oracle, oracle2, citizen1, citizen2] = await hre.ethers.getSigners();
    const PublicWorkAudit = await hre.ethers.getContractFactory("PublicWorkAudit");
    const auditWindow = 5;
    const vetoThreshold = 2;
    const c = await PublicWorkAudit.deploy(auditWindow, vetoThreshold);
    await c.waitForDeployment();
    await c.connect(admin).setOracle(oracle.address, true);
    await c.connect(admin).setOracle(oracle2.address, true);
    return {
      c,
      admin,
      gov,
      contractor,
      oracle,
      oracle2,
      citizen1,
      citizen2,
      auditWindow,
      vetoThreshold,
    };
  }

  it("creates ETH project with locked funds", async function () {
    const { c, gov, contractor } = await deploy();
    const descs = ["A", "B"];
    const amounts = [hre.ethers.parseEther("0.4"), hre.ethers.parseEther("0.6")];
    const total = hre.ethers.parseEther("1");
    await expect(
      c
        .connect(gov)
        .createProject("Bridge", "Desc", "QmBp", contractor.address, ZERO, 0, descs, amounts, { value: total })
    )
      .to.emit(c, "ProjectCreated")
      .withArgs(0n, gov.address, contractor.address, ZERO, 1n, "Bridge", total, "QmBp");
    expect(await c.contractBalance()).to.equal(total);
  });

  it("full milestone flow: submit -> oracle quorum -> citizens -> finalize pay", async function () {
    const { c, gov, contractor, oracle, citizen1, citizen2 } = await deploy();
    const amounts = [hre.ethers.parseEther("1")];
    await c.connect(gov).createProject("P", "D", "Qm1", contractor.address, ZERO, 1, ["M1"], amounts, {
      value: hre.ethers.parseEther("1"),
    });

    await c.connect(contractor).submitMilestoneProof(0, 0, "QmEvidence");
    await c.connect(oracle).oracleVerifyMilestone(0, 0);
    await c.connect(citizen1).citizenAuditVote(0, 0, true);
    await c.connect(citizen2).citizenAuditVote(0, 0, true);

    await hre.network.provider.send("evm_increaseTime", [10]);
    await hre.network.provider.send("evm_mine");

    const before = await hre.ethers.provider.getBalance(contractor.address);
    await c.finalizeMilestone(0, 0);
    const after = await hre.ethers.provider.getBalance(contractor.address);
    expect(after).to.be.gt(before);
  });

  it("requires oracle quorum > 1 before public audit opens", async function () {
    const { c, gov, contractor, oracle, oracle2 } = await deploy();
    const amounts = [hre.ethers.parseEther("1")];
    await c.connect(gov).createProject("P", "D", "Qm1", contractor.address, ZERO, 2, ["M1"], amounts, {
      value: hre.ethers.parseEther("1"),
    });
    await c.connect(contractor).submitMilestoneProof(0, 0, "QmE");
    await c.connect(oracle).oracleVerifyMilestone(0, 0);
    let m = await c.getMilestone(0, 0);
    expect(m.status).to.equal(1n); // Submitted
    await c.connect(oracle2).oracleVerifyMilestone(0, 0);
    m = await c.getMilestone(0, 0);
    expect(m.status).to.equal(2n); // PublicAudit
  });

  it("ERC-20 project: pull, quorum 1, pay in token", async function () {
    const { c, gov, contractor, oracle, citizen1, citizen2 } = await deploy();
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock USD", "mUSD", 18);
    await token.waitForDeployment();
    const tAddr = await token.getAddress();
    const total = hre.ethers.parseEther("100");
    await token.mint(gov.address, total);
    await token.connect(gov).approve(await c.getAddress(), total);

    await c.connect(gov).createProject("Tok", "D", "Qm1", contractor.address, tAddr, 1, ["M1"], [total]);

    await c.connect(contractor).submitMilestoneProof(0, 0, "QmE");
    await c.connect(oracle).oracleVerifyMilestone(0, 0);
    await c.connect(citizen1).citizenAuditVote(0, 0, true);
    await c.connect(citizen2).citizenAuditVote(0, 0, true);
    await hre.network.provider.send("evm_increaseTime", [10]);
    await hre.network.provider.send("evm_mine");

    const before = await token.balanceOf(contractor.address);
    await c.finalizeMilestone(0, 0);
    const after = await token.balanceOf(contractor.address);
    expect(after - before).to.equal(total);
  });

  it("vetoes lead to dispute and government can rework", async function () {
    const { c, gov, contractor, oracle, citizen1, citizen2 } = await deploy();
    const amounts = [hre.ethers.parseEther("1")];
    await c.connect(gov).createProject("P", "D", "Qm1", contractor.address, ZERO, 1, ["M1"], amounts, {
      value: hre.ethers.parseEther("1"),
    });
    await c.connect(contractor).submitMilestoneProof(0, 0, "QmE");
    await c.connect(oracle).oracleVerifyMilestone(0, 0);
    await c.connect(citizen1).citizenAuditVote(0, 0, false);
    await c.connect(citizen2).citizenAuditVote(0, 0, false);
    await hre.network.provider.send("evm_increaseTime", [10]);
    await hre.network.provider.send("evm_mine");
    await c.finalizeMilestone(0, 0);
    const m = await c.getMilestone(0, 0);
    expect(m.status).to.equal(4n); // Disputed
    await c.connect(gov).resolveDispute(0, 0, false);
    const m2 = await c.getMilestone(0, 0);
    expect(m2.status).to.equal(0n); // Pending
  });
});
