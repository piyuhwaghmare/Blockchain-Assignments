const fs = require("fs");
const path = require("path");

const artifactPath = path.join(__dirname, "../artifacts/contracts/PublicWorkAudit.sol/PublicWorkAudit.json");
const outDir = path.join(__dirname, "../frontend/src/abi");
const outFile = path.join(outDir, "PublicWorkAudit.json");

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const minimal = {
  contractName: artifact.contractName,
  abi: artifact.abi,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(minimal, null, 2));
console.log("Wrote", outFile);
