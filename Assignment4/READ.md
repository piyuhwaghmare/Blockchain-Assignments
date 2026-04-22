# Assignment 4: Decentralized File Storage with IPFS

**Author:** Piyush Waghmare

## Overview
Instead of storing large files directly on the blockchain (which is extremely expensive), this assignment implements decentralized file storage using the InterPlanetary File System (IPFS) via the Pinata API. 

## Technologies Used
* **Runtime Environment:** Node.js
* **Storage Network:** IPFS
* **IPFS Gateway/Provider:** Pinata
* **Libraries:** `axios`, `form-data`, `fs`

## Project Structure
* `upload.js`: Script to read a local file (`sample.txt` or a PDF) and upload it to IPFS via Pinata.
* `retrieve.js`: Script to fetch the file back from IPFS using its unique Content Identifier (CID).
* `sample.txt`: The test file used for uploading.

## Setup Instructions
1. Initialize the Node project and install dependencies:
   ```bash
   npm install axios form-data fs
