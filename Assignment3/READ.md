# Assignment 3: Web3 Interface Implementation

**Author:** Piyush Waghmare

## Overview
This assignment bridges the gap between the blockchain backend and the user interface. It provides a frontend web application that allows users to interact with the deployed smart contract (e.g., executing product transactions) directly from their browser using MetaMask.

## Technologies Used
* **Frontend:** HTML, CSS, JavaScript
* **Web3 Library:** Ethers.js (or Web3.js)
* **Wallet Integration:** MetaMask

## Features
* **Connect Wallet:** A button to prompt users to connect their MetaMask wallet to the DApp.
* **Read State:** Fetches and displays data directly from the deployed blockchain contract.
* **Write State:** Provides a form/interface to sign and send new transactions to the blockchain.

## How to Run
1. Ensure your smart contract is deployed and you have its Contract Address and ABI.
2. Update the `contractAddress` and `contractABI` variables in the `app.js` (or main JavaScript file).
3. Serve the `index.html` file using a local web server (e.g., VS Code Live Server).
4. Open the site in a browser equipped with the MetaMask extension.
