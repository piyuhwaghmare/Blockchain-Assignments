### 6. Assignment 5: `Assignment5/README.md`

markdown
# Assignment 5: Basic DAO Framework

**Student Name:** Piyush Waghmare  
**PRN Number:** 123B1B284 
**Course Name:** Blockchain Lab

## Brief Description
This assignment explores decentralized governance by setting up a basic Decentralized Autonomous Organization (DAO). The smart contract acts as a framework that allows registered members to create proposals, vote on them, and execute decisions transparently on the blockchain.

## Tech Stack Used
* **Language:** Solidity
* **Environment:** Remix IDE / Hardhat
* **Wallet:** MetaMask

## How to Run
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file and paste the DAO smart contract code.
3. Compile the contract using the Solidity Compiler.
4. Go to the "Deploy & Run Transactions" tab and select your preferred environment (e.g., Remix VM for quick testing, or Injected Provider for testnet).
5. Deploy the contract (passing any required constructor arguments like initial voting duration or member addresses).
6. Use the deployed contract interface in Remix to:
   * Call `createProposal()`
   * Call `vote()` using different account addresses.
   * Call `executeProposal()` once the voting period ends.
