# 🚀 Getting Started with LedgerWorks V2

## Welcome!

This guide will help you get the advanced blockchain public works audit system up and running in **less than 10 minutes**.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **MetaMask** browser extension ([Install](https://metamask.io/))
- ✅ **Git** (optional, for cloning)

## 🔒 Safe Demo (No MetaMask, No Risk)

**For presentations and safe testing:**

```bash
# Option 1: Just run tests (safest)
npm run test:all

# Option 2: Visual demo without wallet
npx hardhat node                                    # Terminal 1
npx hardhat run scripts/deploy-v2.js --network localhost  # Terminal 2  
node scripts/setup-demo-data.js <CONTRACT_ADDRESS>        # Terminal 2
cd frontend && npm run dev                                 # Terminal 3
```

Then visit:
- **Analytics**: http://localhost:5173/analytics (shows metrics)
- **Explorer**: http://localhost:5173/explorer (shows projects) 
- **Regulator**: http://localhost:5173/regulator (shows events)

**No wallet connection needed for viewing!**

## 🎯 Full Setup with MetaMask (5 Minutes)

### Step 1: Install Dependencies (2 minutes)

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Start Local Blockchain (1 minute)

Open a **new terminal** (Terminal 1) and run:

```bash
npx hardhat node
```

**Important:** Keep this terminal running! It's your local blockchain.

You'll see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**Save these accounts!** You'll need them for MetaMask.

### Step 3: Deploy Contracts (1 minute)

Open a **new terminal** (Terminal 2) and run:

```bash
npx hardhat run scripts/deploy-v2.js --network localhost
```

You'll see:
```
✅ PublicWorkAuditV2 deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ GovernanceToken deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ ProjectFactory deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

The script automatically:
- Deploys all contracts
- Creates `frontend/.env` with contract addresses
- Exports ABIs to frontend
- Sets up initial oracles

### Step 4: Setup Demo Data (Optional, 30 seconds)

```bash
# Use the contract address from Step 3
node scripts/setup-demo-data.js 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

This creates 3 sample projects with realistic data.

### Step 5: Start Frontend (30 seconds)

Open a **new terminal** (Terminal 3) and run:

```bash
cd frontend
npm run dev
```

Open your browser to: **http://localhost:5173**

### Step 6: Configure MetaMask (1 minute)

1. **Add Local Network:**
   - Open MetaMask
   - Click network dropdown → "Add Network" → "Add a network manually"
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
   - Click "Save"

2. **Import Test Accounts:**
   - Click account icon → "Import Account"
   - Paste private key from Step 2 (Account #0)
   - Repeat for Account #1, #2, etc.

**Account Roles:**
- Account #0: Government (creates projects)
- Account #1: Contractor (submits work)
- Account #2+: Citizens/Oracles (vote and verify)

## 🎮 Try It Out!

### Create Your First Project

1. **Connect Wallet** (Account #0 - Government)
2. Click **"New Project"** in navigation
3. Fill in details:
   - Title: "My First Bridge"
   - Description: "Test project"
   - Location: "Your City"
   - Category: "Infrastructure"
   - Deadline: 30 days from now
   - Oracle Quorum: 1
4. Add milestones:
   - "Foundation": 0.5 ETH
   - "Structure": 1.0 ETH
5. Click **"Deploy project & lock funds"**
6. Confirm in MetaMask

### Submit a Milestone

1. **Switch to Account #1** (Contractor)
2. Go to **Explorer** → Click your project
3. Find Milestone 0 (Pending)
4. Enter evidence:
   - Evidence CID: `QmTestEvidence123`
   - Quality Score: 90
5. Click **"Submit proof"**
6. Confirm in MetaMask

### Verify as Oracle

1. **Switch to Account #0** (Oracle)
2. Same project page
3. Click **"Oracle attest"** on Milestone 0
4. Confirm in MetaMask
5. Status changes to "Public audit"

### Vote as Citizen

1. **Switch to Account #2** (Citizen)
2. Same project page
3. Click **"Validate work"** or **"Veto / flag"**
4. Add comment: "Looks good!"
5. Confirm in MetaMask

### Finalize Payment

1. Wait for audit window to end (5 seconds in local setup)
2. Any account can click **"Finalize milestone"**
3. Contractor receives payment automatically!

## 📊 Explore Features

### Analytics Dashboard

Visit **Analytics** page to see:
- Total projects and budgets
- Completion rates
- Performance metrics
- Risk indicators

### Regulator Feed

Visit **Regulator** page to see:
- Real-time event stream
- All transactions
- Filter by event type
- No wallet needed!

## 🧪 Run Tests

```bash
# Run all tests
npm run test:all

# Run V2 tests only
npm run test:v2

# Run original tests
npm test
```

## 🔧 Troubleshooting

### "Nonce too high" Error
**Solution:** Reset MetaMask account
- Settings → Advanced → Clear activity tab data

### "Contract not deployed" Error
**Solution:** Redeploy contracts
```bash
npx hardhat run scripts/deploy-v2.js --network localhost
```

### Frontend shows "Configure .env"
**Solution:** Check `frontend/.env` exists with:
```
VITE_CONTRACT_ADDRESS=0x...
```

### MetaMask not connecting
**Solution:** 
1. Ensure network is `Localhost 8545` with Chain ID `31337`
2. Restart browser
3. Reimport accounts

## 📚 Next Steps

### Learn More
- Read **README_ADVANCED.md** for detailed documentation
- Check **PROJECT_SUMMARY.md** for feature overview
- Review **Architecture** page in the app

### Customize
- Edit contract parameters in `scripts/deploy-v2.js`
- Modify frontend styling in `frontend/src/index.css`
- Add new features following existing patterns

### Deploy to Testnet
1. Get testnet ETH from faucet
2. Configure network in `hardhat.config.js`
3. Set environment variables in `.env`
4. Run: `npx hardhat run scripts/deploy-v2.js --network sepolia`

## 🎓 Understanding the System

### Workflow Overview

```
1. Government creates project → Funds locked in contract
2. Contractor submits milestone → Evidence on IPFS
3. Oracles verify work → Multi-party attestation
4. Public audit opens → Citizens vote (3 days)
5. Automatic payment → If approved, contractor paid
```

### Key Concepts

**Oracle Quorum:** Number of independent verifications required
- Set to 1 for testing
- Use 2-3 for production

**Veto Threshold:** Number of citizen vetoes to trigger dispute
- Default: 3 vetoes
- Configurable by admin

**Quality Score:** 0-100 rating of work quality
- Tracked for contractor reputation
- Visible to all stakeholders

**Dispute Resolution:** Structured arbitration process
- Admin assigns arbitrators
- Arbitrators vote
- Majority decision enforced

## 💡 Tips & Best Practices

### For Development
- ✅ Use demo data script for quick testing
- ✅ Keep terminal windows organized
- ✅ Reset MetaMask if transactions fail
- ✅ Check browser console for errors

### For Testing
- ✅ Test with multiple accounts
- ✅ Try different scenarios (approve, veto, dispute)
- ✅ Verify events in Regulator feed
- ✅ Check analytics after actions

### For Production
- ✅ Use multi-sig wallets for admin
- ✅ Set oracle quorum ≥ 2
- ✅ Configure appropriate audit windows
- ✅ Get professional security audit
- ✅ Test thoroughly on testnet first

## 🆘 Getting Help

### Common Questions

**Q: How do I reset everything?**
A: Stop all terminals, restart `npx hardhat node`, redeploy contracts

**Q: Can I use real IPFS?**
A: Yes! Upload files to IPFS and use real CIDs

**Q: How do I add more oracles?**
A: Admin can call `setOracle(address, true, type)` function

**Q: Can I change audit window?**
A: Yes, admin can call `setPublicAuditWindow(seconds)`

### Resources

- **Documentation:** README_ADVANCED.md
- **Examples:** scripts/setup-demo-data.js
- **Tests:** test/PublicWorkAuditV2.test.js
- **Architecture:** Visit /architecture in the app

## 🎉 You're Ready!

You now have a fully functional blockchain public works audit system running locally!

**What you can do:**
- ✅ Create projects with milestones
- ✅ Submit and verify work
- ✅ Citizen voting and oversight
- ✅ Automatic payments
- ✅ Dispute resolution
- ✅ Real-time analytics
- ✅ Complete audit trail

**Next steps:**
1. Explore all pages in the app
2. Try different user roles
3. Check analytics dashboard
4. Review regulator feed
5. Read advanced documentation

---

**Need help?** Check the troubleshooting section or review the test files for examples.

**Ready for production?** Read the deployment section in README_ADVANCED.md

**Happy building! 🚀**
