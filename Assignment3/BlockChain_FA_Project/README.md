# LedgerWorks — Blockchain Public Work Audit & Fund Tracking

Solidity escrow with **milestone proofs (IPFS CIDs)**, **multi-oracle quorum** (distinct attestations before public audit), **native ETH or ERC-20** funding, **citizen audit window**, and **automatic payout** or **dispute** flow. React UI includes a **Regulator** page that aggregates on-chain **event logs** (read-only).

## Stack

- **Contracts:** Hardhat, Solidity 0.8.20 (`contracts/PublicWorkAudit.sol`)
- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, ethers v6, Framer Motion

## Quick start (local)

1. Install root deps: `npm install`
2. Compile & export ABI: `npx hardhat compile && node scripts/export-abi.js`
3. Terminal A: `npx hardhat node`
4. Terminal B: `npm run deploy:local` — copy the printed contract address.
5. `cd frontend && npm install`
6. Create `frontend/.env` with `VITE_CONTRACT_ADDRESS=0x...` (from step 4)
7. `npm run dev` — open the app (MetaMask on `localhost:8545`, chain ID **31337**)

Use Hardhat accounts: e.g. **#0** as government (deployer is also a default oracle), **#1** as contractor, **#2+** as citizens. For **oracle quorum > 1**, allowlist more oracle addresses via `setOracle` (deployer admin). **ERC-20 projects:** deploy `MockERC20` from tests or use any test token; **approve** the audit contract for the total budget before `createProject`.

- **Regulator feed:** `/regulator` — scans `ProjectCreated`, `MilestoneOracleAttested`, `MilestonePublicAuditOpened`, `CitizenVote`, `MilestonePaid`, disputes, etc.

## Hybrid architecture (concept)

Sensitive procurement data can stay on a **consortium chain**; this demo uses one chain for clarity. The UI describes splitting **private metadata** vs **public transparency** mirrors as in your specification.

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run compile`  | Compile contracts          |
| `npm run node`     | Local JSON-RPC chain       |
| `npm run deploy:local` | Deploy to localhost    |
| `node scripts/export-abi.js` | Refresh `frontend/src/abi` |

## Tests

```bash
npx hardhat test
```

## Reality check

On-chain records are only as honest as **oracles** and **evidence**. Combine multi-party verification, IoT, and policy for production.
