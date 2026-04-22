# Assignment 1: Smart Contract Deployment

**Author:** Piyush Waghmare

## Overview
This project involves designing, compiling, and deploying a fundamental smart contract to a live blockchain test network. We utilize the `SimpleStorage` contract to demonstrate state variable manipulation on the Ethereum blockchain.

## Technologies Used
* **Language:** Solidity (`^0.8.0`)
* **Development Environment:** Remix IDE
* **Wallet:** MetaMask
* **Network:** Sepolia Test Network

## Features
* **Store Value:** Allows a user to input and store a `uint256` value on the blockchain.
* **Retrieve Value:** Reads and returns the currently stored value without incurring gas fees.

## Setup & Deployment
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file named `smartContract.sol` and paste the SimpleStorage code.
3. Compile the contract using the Solidity Compiler (ensure version matches).
4. Go to "Deploy & Run Transactions".
5. Change the Environment to "Injected Provider - MetaMask".
6. Ensure MetaMask is connected to the Sepolia test network and has test ETH.
7. Click "Deploy" and confirm the transaction in MetaMask.
