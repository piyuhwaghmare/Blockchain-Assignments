# 🏗️ LedgerWorks V2 - Advanced Blockchain Public Works Audit System

## 🌟 Overview

LedgerWorks V2 is a **production-ready, enterprise-grade blockchain platform** for transparent public infrastructure project management. This advanced version includes comprehensive features for government agencies, contractors, oracles, and citizens to collaborate on public works projects with complete transparency and accountability.

## ✨ New Advanced Features

### 🔐 Security & Access Control
- **Multi-signature Governance**: Require multiple approvals for critical operations
- **Role-Based Access Control (RBAC)**: Granular permissions for different stakeholders
- **Emergency Pause Mechanism**: System-wide and project-specific pause controls
- **Reentrancy Protection**: Guards against common smart contract vulnerabilities
- **Rate Limiting**: Prevents spam and abuse of contract functions

### 🤖 Enhanced Oracle System
- **Multiple Oracle Types**: Manual, IoT, AI, and Hybrid verification methods
- **Reputation Scoring**: Track oracle performance (0-1000 score)
- **Oracle Analytics**: Success rates, total attestations, and reliability metrics
- **Quorum Requirements**: Configurable multi-oracle verification before public audit

### ⚖️ Advanced Dispute Resolution
- **Structured Arbitration**: Professional arbitrator assignment and voting
- **Dispute Lifecycle**: Open → Under Review → Resolved workflow
- **Multi-party Voting**: Arbitrators vote to determine dispute outcomes
- **Transparent Resolution**: All dispute actions recorded on-chain

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Comprehensive project and system metrics
- **Performance Tracking**: Contractor scores, completion times, success rates
- **Budget Analytics**: Utilization rates, spending patterns, forecasting
- **Risk Indicators**: Dispute rates, deadline tracking, quality scores
- **Oracle Performance**: Reputation trends, attestation statistics

### 📝 Enhanced Project Management
- **Quality Scoring**: 0-100 quality ratings for milestone submissions
- **Multiple Attachments**: Support for photos, videos, documents (IPFS)
- **Deadline Tracking**: Project completion deadlines with enforcement
- **Location & Category**: Geographic and categorical project organization
- **Milestone Cancellation**: Government can cancel pending milestones

### 💬 Citizen Engagement
- **Voting with Comments**: Citizens can provide feedback with votes
- **Transparent Audit Trail**: All votes and comments recorded on-chain
- **Veto Threshold**: Configurable citizen veto requirements
- **Public Audit Window**: Time-bound citizen review period

### 🏭 Factory Pattern
- **Project Factory**: Deploy and manage multiple audit contract instances
- **Contract Registry**: Track all deployed contracts with metadata
- **Governance Token**: ERC-20 token for system governance and voting

## 🏗️ Architecture

### Smart Contracts

```
contracts/
├── PublicWorkAuditV2.sol      # Main audit contract with advanced features
├── ProjectFactory.sol          # Factory for deploying multiple instances
├── GovernanceToken.sol         # ERC-20 governance token
├── IERC20.sol                  # ERC-20 interface
└── MockERC20.sol              # Test token for development
```

### Frontend Application

```
frontend/src/
├── pages/
│   ├── Home.tsx               # Landing page with system overview
│   ├── Explorer.tsx           # Browse all projects
│   ├── CreateProject.tsx     # Create new projects
│   ├── ProjectDetail.tsx     # Detailed project view with actions
│   ├── Analytics.tsx         # 📊 NEW: Analytics dashboard
│   ├── Regulator.tsx         # Event stream for regulators
│   └── Architecture.tsx      # System architecture documentation
├── components/
│   ├── Layout.tsx            # Main layout wrapper
│   ├── Navbar.tsx            # Navigation with wallet connection
│   ├── Footer.tsx            # Footer component
│   ├── Button.tsx            # Reusable button component
│   └── SetupBanner.tsx       # Configuration reminder
├── context/
│   └── WalletContext.tsx     # Wallet connection management
├── hooks/
│   └── usePublicWorkContract.ts  # Contract interaction hooks
└── lib/
    ├── contractReads.ts      # Read-only contract functions
    └── formatPayment.ts      # Payment formatting utilities
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd public-work-audit-blockchain

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Local Development

#### 1. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

This will start a local Ethereum network and display 20 test accounts with private keys.

#### 2. Deploy Contracts

```bash
# Terminal 2: Deploy V2 contracts
npx hardhat run scripts/deploy-v2.js --network localhost
```

The deployment script will:
- Deploy PublicWorkAuditV2 contract
- Deploy GovernanceToken contract
- Deploy ProjectFactory contract
- Setup initial oracles
- Export ABIs to frontend
- Create frontend/.env with contract addresses

#### 3. Setup Demo Data (Optional)

```bash
# Populate with sample projects
node scripts/setup-demo-data.js <CONTRACT_ADDRESS>
```

This creates 3 sample projects with realistic data and completes one milestone through the full workflow.

#### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

#### 5. Configure MetaMask

1. Add network: `http://localhost:8545`
2. Chain ID: `31337`
3. Import test accounts using private keys from Hardhat node output
4. Use Account #0 as Government, #1 as Contractor, #2+ as Citizens

## 📖 User Workflows

### Government Agency Workflow

1. **Connect Wallet** - Connect as government account
2. **Create Project** - Navigate to "New Project"
   - Enter project details (title, description, location, category)
   - Set completion deadline
   - Choose payment method (ETH or ERC-20)
   - Configure oracle quorum (number of required attestations)
   - Define milestones with descriptions and amounts
   - Lock funds in contract
3. **Monitor Progress** - View project status in Explorer
4. **Review Submissions** - Approve or reject contractor submissions
5. **Resolve Disputes** - Handle disputed milestones
6. **Pause if Needed** - Emergency pause for specific projects

### Contractor Workflow

1. **Connect Wallet** - Connect as contractor account
2. **View Assigned Projects** - See projects where you're the contractor
3. **Submit Milestone Proof**
   - Upload evidence to IPFS
   - Enter IPFS CID (Content Identifier)
   - Provide quality score (0-100)
   - Add multiple attachments (photos, videos, documents)
4. **Wait for Oracle Verification** - Oracles attest to work quality
5. **Public Audit Period** - Citizens review and vote
6. **Receive Payment** - Automatic payment after successful audit

### Oracle Workflow

1. **Get Oracle Status** - Admin grants oracle permissions
2. **Monitor Submissions** - Watch for new milestone submissions
3. **Verify Work** - Review evidence and attest
   - Check IPFS evidence
   - Verify quality score
   - Attest on-chain
4. **Build Reputation** - Successful attestations increase reputation score

### Citizen Workflow

1. **Connect Wallet** - Any address can participate
2. **Browse Projects** - View all public projects
3. **Review Milestones** - Check evidence during public audit window
4. **Vote on Quality**
   - Approve: Validate good work
   - Veto: Flag concerns
   - Add comments explaining vote
5. **Track Impact** - See how votes affect outcomes

### Regulator Workflow

1. **Access Regulator Feed** - No wallet required (read-only)
2. **Monitor Events** - Real-time event stream
   - Project creation
   - Milestone submissions
   - Oracle attestations
   - Citizen votes
   - Payments
   - Disputes
3. **Filter Events** - Focus on specific event types
4. **Export Data** - Download for compliance reporting

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run original tests
npx hardhat test test/PublicWorkAudit.test.js

# Run V2 advanced feature tests
npx hardhat test test/PublicWorkAuditV2.test.js
```

### Test Coverage

The V2 test suite includes:
- ✅ Project creation with deadlines and metadata
- ✅ Enhanced milestone submission with quality scores
- ✅ Oracle reputation system
- ✅ Citizen voting with comments
- ✅ Emergency pause controls
- ✅ Dispute resolution with arbitrators
- ✅ Analytics and statistics
- ✅ Reentrancy protection
- ✅ Rate limiting
- ✅ Multi-oracle quorum

## 📊 Analytics Dashboard

The new Analytics page provides:

### Key Metrics
- **Total Projects**: Count of all projects (active/inactive)
- **Total Budget**: Sum of all project budgets
- **Completed Milestones**: Successfully paid milestones
- **Average Completion Time**: Time from submission to payment

### Visualizations
- **Budget Utilization**: Progress bar showing allocated vs paid funds
- **System Health**: Success rates and active project percentage
- **Risk Indicators**: Dispute rates and efficiency metrics
- **Performance Trends**: Historical data and patterns

### Oracle Analytics
- **Reputation Scores**: Track oracle reliability
- **Attestation Statistics**: Total and successful attestations
- **Success Rates**: Percentage of correct attestations

## 🔧 Configuration

### Contract Parameters

Edit in deployment script or call admin functions:

```javascript
// Audit window (seconds)
const AUDIT_WINDOW = 3 * 24 * 60 * 60; // 3 days

// Veto threshold (number of vetoes to trigger dispute)
const VETO_THRESHOLD = 3;

// Action cooldown (rate limiting)
const ACTION_COOLDOWN = 60; // 1 minute

// Governance quorum
const GOVERNANCE_QUORUM = 2;
```

### Environment Variables

Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x...
VITE_GOVERNANCE_TOKEN_ADDRESS=0x...
VITE_FACTORY_ADDRESS=0x...
VITE_NETWORK=localhost
VITE_CHAIN_ID=31337
```

## 🌐 Deployment to Testnet/Mainnet

### 1. Configure Network

Edit `hardhat.config.js`:

```javascript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
  },
  // Add other networks as needed
}
```

### 2. Set Environment Variables

Create `.env` in root:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key
```

### 3. Deploy

```bash
npx hardhat run scripts/deploy-v2.js --network sepolia
```

### 4. Verify Contracts

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 🔒 Security Considerations

### Implemented Protections

1. **Reentrancy Guards**: All state-changing functions protected
2. **Access Control**: Role-based permissions enforced
3. **Integer Overflow**: Solidity 0.8.20 built-in protection
4. **Rate Limiting**: Prevents spam and DoS attacks
5. **Emergency Pause**: Quick response to vulnerabilities
6. **Input Validation**: All inputs sanitized and validated

### Best Practices

- ✅ Use multi-sig wallets for admin functions
- ✅ Set appropriate oracle quorum (≥2 for production)
- ✅ Configure reasonable audit windows (3-7 days)
- ✅ Monitor oracle reputation scores
- ✅ Regular security audits recommended
- ✅ Test thoroughly on testnet before mainnet

## 📈 Performance Optimizations

### Gas Optimization

- Efficient storage patterns
- Batch operations where possible
- Optimized loops and iterations
- Minimal storage writes

### Frontend Optimization

- React lazy loading
- Efficient state management
- Cached contract reads
- Optimistic UI updates

## 🤝 Contributing

We welcome contributions! Areas for enhancement:

- [ ] Mobile-responsive improvements
- [ ] Additional oracle types (GPS, satellite imagery)
- [ ] Advanced analytics charts
- [ ] Export functionality for reports
- [ ] Multi-language support
- [ ] Integration with IPFS pinning services
- [ ] Notification system (email/SMS)
- [ ] API for third-party integrations

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review test files for usage examples

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Advanced smart contracts
- ✅ Enhanced frontend
- ✅ Analytics dashboard
- ✅ Comprehensive testing

### Phase 2 (Planned)
- [ ] Mobile app (React Native)
- [ ] Advanced reporting tools
- [ ] Integration with government systems
- [ ] AI-powered fraud detection

### Phase 3 (Future)
- [ ] Cross-chain support
- [ ] Layer 2 scaling solutions
- [ ] Decentralized oracle network
- [ ] DAO governance

## 📚 Additional Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [React Documentation](https://react.dev/)
- [IPFS Documentation](https://docs.ipfs.tech/)

---

**Built with ❤️ for transparent public infrastructure**
