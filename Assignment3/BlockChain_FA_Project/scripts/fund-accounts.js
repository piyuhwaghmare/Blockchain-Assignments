const hre = require("hardhat");

async function main() {
  console.log("💰 Funding test accounts...\n");

  const [defaultAccount, account1, account2, account3, account4] = await hre.ethers.getSigners();

  console.log("Default Account:", defaultAccount.address);
  console.log("Account 1:", account1.address);
  console.log("Account 2:", account2.address);
  console.log("Account 3:", account3.address);
  console.log("Account 4:", account4.address);

  // Send ETH from default to others
  const amount = hre.ethers.parseEther("1000");

  console.log("\n📤 Sending 1000 ETH to each account...");

  const tx1 = await defaultAccount.sendTransaction({
    to: account1.address,
    value: amount
  });
  await tx1.wait();
  console.log("✅ Sent to Account 1");

  const tx2 = await defaultAccount.sendTransaction({
    to: account2.address,
    value: amount
  });
  await tx2.wait();
  console.log("✅ Sent to Account 2");

  const tx3 = await defaultAccount.sendTransaction({
    to: account3.address,
    value: amount
  });
  await tx3.wait();
  console.log("✅ Sent to Account 3");

  const tx4 = await defaultAccount.sendTransaction({
    to: account4.address,
    value: amount
  });
  await tx4.wait();
  console.log("✅ Sent to Account 4");

  console.log("\n✨ All accounts funded!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Account 0 (Default): Government");
  console.log("Account 1: Contractor");
  console.log("Account 2: Citizen/Oracle");
  console.log("Account 3: Citizen");
  console.log("Account 4: Citizen");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
