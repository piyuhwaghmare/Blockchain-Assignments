 Assignment 5: `Assignment5/README.md`

markdown
# Assignment 5: Basic DAO Framework

**Author:** Piyush Waghmare

## Overview
This assignment explores decentralized governance by setting up a basic Decentralized Autonomous Organization (DAO) using a smart contract. It allows designated members to govern decisions transparently on-chain.

## Technologies Used
* **Language:** Solidity
* **Development Framework:** Hardhat / Remix IDE

## Core DAO Features
* **Membership/Shares:** Tracks which addresses are part of the DAO and their voting weight.
* **Proposal Creation:** Allows members to submit new proposals for the community to vote on.
* **Voting Mechanism:** Members can cast "Yes" or "No" votes on active proposals within a specific timeframe.
* **Execution:** If a proposal passes the required quorum and majority, the contract allows the proposed action to be executed automatically.

## Deployment & Interaction
1. Deploy the DAO contract, assigning initial shares/tokens to founding members.
2. Use the contract interface to call `createProposal()`.
3. Switch between different MetaMask accounts (representing different members) to call `vote()`.
4. Once the voting period ends, call `executeProposal()` to finalize the outcome.
