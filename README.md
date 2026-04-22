# Blockchain Engineering Assignments Workspace

**Student Name:** Piyush Waghmare  
**PRN Number:** 123B1B284  
**Course Name:** Blockchain Technology Laboratory

## Brief Description of All Assignments
This repository contains a collection of five assignments demonstrating foundational and advanced concepts in Web3 and Blockchain development:
* **Assignment 1:** Deployment of a foundational smart contract (`SimpleStorage`) on the Ethereum Sepolia test network to understand state variables and basic on-chain transactions.
* **Assignment 2:** Migration of the smart contract to the Polygon Layer 2 test network to demonstrate scalability and reduced gas fees.
* **Assignment 3:** Development of a decentralized Web3 user interface (DApp) allowing users to interact with smart contracts directly via MetaMask.
* **Assignment 4:** Implementation of decentralized file storage using Node.js to upload and retrieve files via IPFS and the Pinata API.
* **Assignment 5:** Design and deployment of a basic Decentralized Autonomous Organization (DAO) smart contract framework for community governance and voting.

## Tech Stack Used
* **Blockchain/Smart Contracts:** Solidity (`^0.8.0`), Ethereum (Sepolia), Polygon (Amoy/Mumbai)
* **Development Environments:** Remix IDE, VS Code
* **Web3 Integration:** Ethers.js / Web3.js, HTML, CSS, JavaScript
* **Wallets & Authentication:** MetaMask
* **Decentralized Storage:** IPFS, Pinata API
* **Backend/Scripts:** Node.js, `axios`, `form-data`, `fs`

## How to Run Each Assignment

**Assignment 1 & 2 (Remix IDE):**
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file and paste the `.sol` contract code.
3. Compile the contract using the Solidity Compiler.
4. Go to the "Deploy & Run" tab, select "Injected Provider - MetaMask".
5. Ensure MetaMask is on the correct network (Sepolia for A1, Polygon for A2).
6. Click "Deploy" and confirm in MetaMask.

**Assignment 3 (Web3 UI):**
1. Navigate to the `Assignment3` folder.
2. Ensure your contract address and ABI are updated in the JavaScript file.
3. Serve the `index.html` file using a local web server (e.g., VS Code Live Server).
4. Connect your MetaMask wallet on the webpage to interact.

**Assignment 4 (IPFS with Node.js):**
1. Navigate to the `Assignment4` directory in your terminal.
2. Run `npm install` to install dependencies (`axios`, `form-data`, `fs`).
3. Add your Pinata API keys to the scripts.
4. Run `node upload.js` to upload the file to IPFS.
5. Use the returned CID in `node retrieve.js` to fetch the file back.

**Assignment 5 (DAO Framework):**
1. Open the DAO `.sol` contract in Remix IDE.
2. Compile and deploy using the same steps as Assignments 1 & 2.
3. Use the Remix interface to interact with the deployed contract functions (`createProposal`, `vote`, `executeProposal`).
