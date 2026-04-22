// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

/**
 * @title PublicWorkAuditV2
 * @notice Advanced milestone escrow with multi-sig governance, emergency controls, oracle reputation, and dispute arbitration
 * @dev Includes reentrancy guards, pausable operations, role-based access control, and event-driven architecture
 */
contract PublicWorkAuditV2 {
    /* ============ Types ============ */

    enum MilestoneStatus {
        Pending,
        Submitted,
        PublicAudit,
        Paid,
        Disputed,
        Rejected,
        Cancelled
    }

    enum DisputeStatus {
        None,
        Open,
        UnderReview,
        Resolved
    }

    enum OracleType {
        Manual,      // Human verification
        IoT,         // IoT sensor data
        AI,          // AI-based verification
        Hybrid       // Multiple verification methods
    }

    struct Milestone {
        string description;
        uint256 amountWei;
        MilestoneStatus status;
        string evidenceIpfsHash;
        uint256 submittedAt;
        uint256 oracleVerifiedAt;
        uint256 publicAuditEndsAt;
        uint256 citizenApprovals;
        uint256 citizenVetoes;
        uint256 oracleConfirmationCount;
        uint256 oracleResetNonce;
        address lastOracleAttester;
        uint256 qualityScore;        // 0-100 quality rating
        string[] attachments;         // Additional IPFS hashes
    }

    struct Project {
        string title;
        string description;
        string blueprintIpfsHash;
        address government;
        address contractor;
        address paymentToken;
        uint256 oracleQuorum;
        uint256 createdAt;
        uint256 totalBudget;
        uint256 totalPaidOut;
        bool active;
        bool paused;
        uint256 completionDeadline;
        string location;              // Geographic location
        string category;              // Project category
    }

    struct Dispute {
        uint256 projectId;
        uint256 milestoneIndex;
        address initiator;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        address[] arbitrators;
        mapping(address => bool) arbitratorVotes;
        uint256 votesForContractor;
        uint256 votesForGovernment;
    }

    struct OracleInfo {
        bool active;
        OracleType oracleType;
        uint256 reputationScore;     // 0-1000
        uint256 totalAttestations;
        uint256 successfulAttestations;
        uint256 lastAttestationTime;
    }

    /* ============ Storage ============ */

    address public admin;
    address public emergencyAdmin;
    uint256 public projectCount;
    uint256 public disputeCount;
    uint256 public publicAuditWindowSeconds;
    uint256 public vetoThreshold;
    bool public globalPaused;
    
    // Reentrancy guard
    uint256 private _locked = 1;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone[]) private _milestones;
    mapping(address => OracleInfo) public oracles;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _citizenVoted;
    mapping(bytes32 => bool) private _oracleAttested;
    
    // Multi-sig governance
    mapping(bytes32 => mapping(address => bool)) public governanceVotes;
    mapping(bytes32 => uint256) public governanceVoteCount;
    uint256 public governanceQuorum = 2;
    address[] public governanceMembers;

    // Rate limiting
    mapping(address => uint256) public lastActionTime;
    uint256 public actionCooldown = 1 minutes;

    // Analytics
    mapping(uint256 => uint256) public projectMilestoneCompletionTime;
    mapping(address => uint256) public contractorPerformanceScore;

    /* ============ Events ============ */

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed government,
        address indexed contractor,
        address paymentToken,
        uint256 oracleQuorum,
        string title,
        uint256 totalBudget,
        string blueprintIpfsHash,
        uint256 deadline
    );
    
    event MilestoneProofSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        string evidenceIpfsHash,
        uint256 submittedAt,
        uint256 qualityScore
    );
    
    event MilestoneOracleAttested(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed oracle,
        uint256 confirmationCount,
        uint256 requiredQuorum,
        OracleType oracleType
    );
    
    event MilestonePublicAuditOpened(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 publicAuditEndsAt
    );
    
    event CitizenVote(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed citizen,
        bool approved,
        string comment
    );
    
    event MilestonePaid(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed contractor,
        address paymentToken,
        uint256 amount,
        uint256 completionTime
    );
    
    event MilestoneDisputed(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 indexed disputeId,
        string reason,
        address initiator
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        bool payContractor,
        address resolver
    );
    
    event OracleUpdated(
        address indexed oracle,
        bool active,
        OracleType oracleType,
        uint256 reputationScore
    );
    
    event EmergencyPause(address indexed admin, bool paused);
    event ProjectPaused(uint256 indexed projectId, bool paused);
    event GovernanceVote(bytes32 indexed actionHash, address indexed voter, uint256 voteCount);

    /* ============ Modifiers ============ */

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyGovernment(uint256 projectId) {
        require(msg.sender == projects[projectId].government, "Not government");
        _;
    }

    modifier onlyContractor(uint256 projectId) {
        require(msg.sender == projects[projectId].contractor, "Not contractor");
        _;
    }

    modifier whenNotPaused() {
        require(!globalPaused, "System paused");
        _;
    }

    modifier projectNotPaused(uint256 projectId) {
        require(!projects[projectId].paused, "Project paused");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 1, "Reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier rateLimit() {
        require(block.timestamp >= lastActionTime[msg.sender] + actionCooldown, "Rate limit");
        lastActionTime[msg.sender] = block.timestamp;
        _;
    }

    /* ============ Constructor ============ */

    constructor(uint256 auditWindowSeconds_, uint256 vetoThreshold_) {
        admin = msg.sender;
        emergencyAdmin = msg.sender;
        publicAuditWindowSeconds = auditWindowSeconds_ == 0 ? 3 days : auditWindowSeconds_;
        vetoThreshold = vetoThreshold_ == 0 ? 3 : vetoThreshold_;
        
        oracles[msg.sender] = OracleInfo({
            active: true,
            oracleType: OracleType.Manual,
            reputationScore: 500,
            totalAttestations: 0,
            successfulAttestations: 0,
            lastAttestationTime: 0
        });
        
        governanceMembers.push(msg.sender);
        
        emit OracleUpdated(msg.sender, true, OracleType.Manual, 500);
    }

    /* ============ Admin Functions ============ */

    function setOracle(address oracle, bool active, OracleType oracleType) external onlyAdmin {
        oracles[oracle].active = active;
        oracles[oracle].oracleType = oracleType;
        if (active && oracles[oracle].reputationScore == 0) {
            oracles[oracle].reputationScore = 500; // Default reputation
        }
        emit OracleUpdated(oracle, active, oracleType, oracles[oracle].reputationScore);
    }

    function emergencyPause(bool pause) external {
        require(msg.sender == admin || msg.sender == emergencyAdmin, "Not authorized");
        globalPaused = pause;
        emit EmergencyPause(msg.sender, pause);
    }

    function pauseProject(uint256 projectId, bool pause) external onlyGovernment(projectId) {
        projects[projectId].paused = pause;
        emit ProjectPaused(projectId, pause);
    }

    function setPublicAuditWindow(uint256 seconds_) external onlyAdmin {
        require(seconds_ > 0, "Invalid window");
        publicAuditWindowSeconds = seconds_;
    }

    function setVetoThreshold(uint256 threshold_) external onlyAdmin {
        vetoThreshold = threshold_;
    }

    function setActionCooldown(uint256 cooldown_) external onlyAdmin {
        actionCooldown = cooldown_;
    }

    function addGovernanceMember(address member) external onlyAdmin {
        governanceMembers.push(member);
    }

    function setGovernanceQuorum(uint256 quorum_) external onlyAdmin {
        require(quorum_ > 0 && quorum_ <= governanceMembers.length, "Invalid quorum");
        governanceQuorum = quorum_;
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero admin");
        admin = newAdmin;
    }

    /* ============ Internal Functions ============ */

    function _oracleKey(
        uint256 projectId,
        uint256 milestoneIndex,
        address oracle,
        uint256 nonce
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(projectId, milestoneIndex, oracle, nonce));
    }

    function _payContractor(Project storage p, address to, uint256 amount) private {
        if (p.paymentToken == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            require(IERC20(p.paymentToken).transfer(to, amount), "ERC20 transfer failed");
        }
    }

    function _contractTokenBalance(address token) private view returns (uint256) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
        require(ok && data.length >= 32, "balanceOf");
        return abi.decode(data, (uint256));
    }

    function _updateOracleReputation(address oracle, bool success) private {
        OracleInfo storage info = oracles[oracle];
        info.totalAttestations++;
        if (success) {
            info.successfulAttestations++;
            if (info.reputationScore < 1000) {
                info.reputationScore += 10;
            }
        } else {
            if (info.reputationScore > 100) {
                info.reputationScore -= 50;
            }
        }
        info.lastAttestationTime = block.timestamp;
    }

    /* ============ Project Creation ============ */

    function createProject(
        string calldata title,
        string calldata description,
        string calldata blueprintIpfsHash,
        address contractor,
        address paymentToken,
        uint256 oracleQuorum_,
        uint256 completionDeadline,
        string calldata location,
        string calldata category,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmountsWei
    ) external payable whenNotPaused nonReentrant returns (uint256 projectId) {
        require(bytes(title).length > 0, "Empty title");
        require(contractor != address(0), "Zero contractor");
        require(completionDeadline > block.timestamp, "Invalid deadline");
        uint256 n = milestoneDescriptions.length;
        require(n > 0 && n == milestoneAmountsWei.length, "Milestone mismatch");

        uint256 quorum = oracleQuorum_ == 0 ? 1 : oracleQuorum_;
        uint256 total;
        for (uint256 i; i < n; ++i) {
            require(milestoneAmountsWei[i] > 0, "Zero milestone amount");
            total += milestoneAmountsWei[i];
        }

        if (paymentToken == address(0)) {
            require(msg.value == total, "ETH value != budget");
        } else {
            require(msg.value == 0, "No ETH with ERC20");
            require(IERC20(paymentToken).transferFrom(msg.sender, address(this), total), "ERC20 pull failed");
        }

        projectId = projectCount++;
        Project storage p = projects[projectId];
        p.title = title;
        p.description = description;
        p.blueprintIpfsHash = blueprintIpfsHash;
        p.government = msg.sender;
        p.contractor = contractor;
        p.paymentToken = paymentToken;
        p.oracleQuorum = quorum;
        p.createdAt = block.timestamp;
        p.totalBudget = total;
        p.active = true;
        p.completionDeadline = completionDeadline;
        p.location = location;
        p.category = category;

        for (uint256 i; i < n; ++i) {
            _milestones[projectId].push(
                Milestone({
                    description: milestoneDescriptions[i],
                    amountWei: milestoneAmountsWei[i],
                    status: MilestoneStatus.Pending,
                    evidenceIpfsHash: "",
                    submittedAt: 0,
                    oracleVerifiedAt: 0,
                    publicAuditEndsAt: 0,
                    citizenApprovals: 0,
                    citizenVetoes: 0,
                    oracleConfirmationCount: 0,
                    oracleResetNonce: 0,
                    lastOracleAttester: address(0),
                    qualityScore: 0,
                    attachments: new string[](0)
                })
            );
        }

        emit ProjectCreated(
            projectId,
            msg.sender,
            contractor,
            paymentToken,
            quorum,
            title,
            total,
            blueprintIpfsHash,
            completionDeadline
        );
    }

    /* ============ View Functions ============ */

    function milestoneCount(uint256 projectId) external view returns (uint256) {
        return _milestones[projectId].length;
    }

    function getMilestone(uint256 projectId, uint256 index) external view returns (
        string memory description,
        uint256 amountWei,
        MilestoneStatus status,
        string memory evidenceIpfsHash,
        uint256 submittedAt,
        uint256 oracleVerifiedAt,
        uint256 publicAuditEndsAt,
        uint256 citizenApprovals,
        uint256 citizenVetoes,
        uint256 oracleConfirmationCount,
        uint256 oracleResetNonce,
        address lastOracleAttester,
        uint256 qualityScore
    ) {
        require(index < _milestones[projectId].length, "Bad index");
        Milestone storage m = _milestones[projectId][index];
        return (
            m.description,
            m.amountWei,
            m.status,
            m.evidenceIpfsHash,
            m.submittedAt,
            m.oracleVerifiedAt,
            m.publicAuditEndsAt,
            m.citizenApprovals,
            m.citizenVetoes,
            m.oracleConfirmationCount,
            m.oracleResetNonce,
            m.lastOracleAttester,
            m.qualityScore
        );
    }

    function getMilestoneAttachments(uint256 projectId, uint256 index) external view returns (string[] memory) {
        require(index < _milestones[projectId].length, "Bad index");
        return _milestones[projectId][index].attachments;
    }

    function getOracleInfo(address oracle) external view returns (
        bool active,
        OracleType oracleType,
        uint256 reputationScore,
        uint256 totalAttestations,
        uint256 successfulAttestations
    ) {
        OracleInfo storage info = oracles[oracle];
        return (
            info.active,
            info.oracleType,
            info.reputationScore,
            info.totalAttestations,
            info.successfulAttestations
        );
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function tokenBalanceHeld(address token) external view returns (uint256) {
        return _contractTokenBalance(token);
    }

    /* ============ Contractor Functions ============ */

    function submitMilestoneProof(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata evidenceIpfsHash,
        uint256 qualityScore,
        string[] calldata attachments
    ) external onlyContractor(projectId) whenNotPaused projectNotPaused(projectId) rateLimit {
        Project storage p = projects[projectId];
        require(p.active, "Inactive");
        require(block.timestamp < p.completionDeadline, "Deadline passed");
        require(bytes(evidenceIpfsHash).length > 0, "Empty evidence");
        require(qualityScore <= 100, "Invalid quality score");
        
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "Not pending");

        m.evidenceIpfsHash = evidenceIpfsHash;
        m.submittedAt = block.timestamp;
        m.qualityScore = qualityScore;
        m.status = MilestoneStatus.Submitted;
        
        for (uint256 i = 0; i < attachments.length; i++) {
            m.attachments.push(attachments[i]);
        }

        emit MilestoneProofSubmitted(projectId, milestoneIndex, evidenceIpfsHash, block.timestamp, qualityScore);
    }

    /* ============ Oracle Functions ============ */

    function oracleVerifyMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external whenNotPaused projectNotPaused(projectId) {
        require(oracles[msg.sender].active, "Not oracle");
        
        Project storage p = projects[projectId];
        require(p.active, "Inactive");
        
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "Not submitted");

        bytes32 k = _oracleKey(projectId, milestoneIndex, msg.sender, m.oracleResetNonce);
        require(!_oracleAttested[k], "Oracle already attested");
        _oracleAttested[k] = true;

        m.oracleConfirmationCount++;
        m.lastOracleAttester = msg.sender;

        OracleInfo storage oracleInfo = oracles[msg.sender];
        
        emit MilestoneOracleAttested(
            projectId,
            milestoneIndex,
            msg.sender,
            m.oracleConfirmationCount,
            p.oracleQuorum,
            oracleInfo.oracleType
        );

        if (m.oracleConfirmationCount >= p.oracleQuorum) {
            m.oracleVerifiedAt = block.timestamp;
            m.publicAuditEndsAt = block.timestamp + publicAuditWindowSeconds;
            m.status = MilestoneStatus.PublicAudit;
            _updateOracleReputation(msg.sender, true);
            emit MilestonePublicAuditOpened(projectId, milestoneIndex, m.publicAuditEndsAt);
        }
    }

    /* ============ Citizen Functions ============ */

    function citizenAuditVote(
        uint256 projectId,
        uint256 milestoneIndex,
        bool approve,
        string calldata comment
    ) external whenNotPaused {
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.PublicAudit, "Not in audit");
        require(block.timestamp <= m.publicAuditEndsAt, "Audit ended");
        require(!_citizenVoted[projectId][milestoneIndex][msg.sender], "Already voted");

        _citizenVoted[projectId][milestoneIndex][msg.sender] = true;
        if (approve) {
            m.citizenApprovals++;
        } else {
            m.citizenVetoes++;
        }

        emit CitizenVote(projectId, milestoneIndex, msg.sender, approve, comment);
    }

    /* ============ Finalization ============ */

    function finalizeMilestone(uint256 projectId, uint256 milestoneIndex) 
        external 
        whenNotPaused 
        projectNotPaused(projectId) 
        nonReentrant 
    {
        Project storage p = projects[projectId];
        require(p.active, "Inactive");
        
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.PublicAudit, "Not in audit");
        require(block.timestamp > m.publicAuditEndsAt, "Audit active");

        if (m.citizenVetoes >= vetoThreshold) {
            m.status = MilestoneStatus.Disputed;
            uint256 disputeId = disputeCount++;
            Dispute storage dispute = disputes[disputeId];
            dispute.projectId = projectId;
            dispute.milestoneIndex = milestoneIndex;
            dispute.initiator = msg.sender;
            dispute.reason = "Public veto threshold reached";
            dispute.status = DisputeStatus.Open;
            dispute.createdAt = block.timestamp;
            
            emit MilestoneDisputed(projectId, milestoneIndex, disputeId, "Public veto threshold reached", msg.sender);
            return;
        }

        uint256 payAmount = m.amountWei;
        if (p.paymentToken == address(0)) {
            require(address(this).balance >= payAmount, "Insufficient ETH");
        } else {
            require(_contractTokenBalance(p.paymentToken) >= payAmount, "Insufficient token");
        }

        uint256 completionTime = block.timestamp - m.submittedAt;
        m.status = MilestoneStatus.Paid;
        p.totalPaidOut += payAmount;
        
        // Update contractor performance
        contractorPerformanceScore[p.contractor] += m.qualityScore;
        projectMilestoneCompletionTime[projectId] = completionTime;

        _payContractor(p, p.contractor, payAmount);

        emit MilestonePaid(projectId, milestoneIndex, p.contractor, p.paymentToken, payAmount, completionTime);
    }

    /* ============ Dispute Resolution ============ */

    function createDispute(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata reason
    ) external whenNotPaused returns (uint256 disputeId) {
        Project storage p = projects[projectId];
        require(
            msg.sender == p.government || msg.sender == p.contractor,
            "Not authorized"
        );
        
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(
            m.status == MilestoneStatus.Submitted || 
            m.status == MilestoneStatus.PublicAudit,
            "Invalid status"
        );

        disputeId = disputeCount++;
        Dispute storage dispute = disputes[disputeId];
        dispute.projectId = projectId;
        dispute.milestoneIndex = milestoneIndex;
        dispute.initiator = msg.sender;
        dispute.reason = reason;
        dispute.status = DisputeStatus.Open;
        dispute.createdAt = block.timestamp;
        
        m.status = MilestoneStatus.Disputed;

        emit MilestoneDisputed(projectId, milestoneIndex, disputeId, reason, msg.sender);
    }

    function addArbitrator(uint256 disputeId, address arbitrator) external onlyAdmin {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Open, "Not open");
        dispute.arbitrators.push(arbitrator);
        dispute.status = DisputeStatus.UnderReview;
    }

    function arbitratorVote(uint256 disputeId, bool favorContractor) external {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.UnderReview, "Not under review");
        
        bool isArbitrator = false;
        for (uint256 i = 0; i < dispute.arbitrators.length; i++) {
            if (dispute.arbitrators[i] == msg.sender) {
                isArbitrator = true;
                break;
            }
        }
        require(isArbitrator, "Not arbitrator");
        require(!dispute.arbitratorVotes[msg.sender], "Already voted");

        dispute.arbitratorVotes[msg.sender] = true;
        if (favorContractor) {
            dispute.votesForContractor++;
        } else {
            dispute.votesForGovernment++;
        }
    }

    function resolveDispute(uint256 disputeId) external onlyAdmin nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.UnderReview, "Not under review");

        bool payContractor = dispute.votesForContractor > dispute.votesForGovernment;
        
        uint256 projectId = dispute.projectId;
        uint256 milestoneIndex = dispute.milestoneIndex;
        
        Project storage p = projects[projectId];
        Milestone storage m = _milestones[projectId][milestoneIndex];

        if (payContractor) {
            uint256 payAmount = m.amountWei;
            m.status = MilestoneStatus.Paid;
            p.totalPaidOut += payAmount;
            _payContractor(p, p.contractor, payAmount);
            emit MilestonePaid(projectId, milestoneIndex, p.contractor, p.paymentToken, payAmount, 0);
        } else {
            m.status = MilestoneStatus.Pending;
            m.evidenceIpfsHash = "";
            m.submittedAt = 0;
            m.oracleVerifiedAt = 0;
            m.publicAuditEndsAt = 0;
            m.citizenApprovals = 0;
            m.citizenVetoes = 0;
            m.oracleConfirmationCount = 0;
            m.oracleResetNonce++;
            m.lastOracleAttester = address(0);
        }

        dispute.status = DisputeStatus.Resolved;
        dispute.resolvedAt = block.timestamp;

        emit DisputeResolved(disputeId, projectId, milestoneIndex, payContractor, msg.sender);
    }

    /* ============ Government Functions ============ */

    function rejectMilestone(uint256 projectId, uint256 milestoneIndex)
        external
        onlyGovernment(projectId)
        whenNotPaused
    {
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(
            m.status == MilestoneStatus.Submitted || m.status == MilestoneStatus.Pending,
            "Cannot reject"
        );
        
        if (m.status == MilestoneStatus.Submitted) {
            m.evidenceIpfsHash = "";
            m.submittedAt = 0;
            m.oracleConfirmationCount = 0;
            m.oracleResetNonce++;
            m.lastOracleAttester = address(0);
        }
        m.status = MilestoneStatus.Pending;
    }

    function cancelMilestone(uint256 projectId, uint256 milestoneIndex)
        external
        onlyGovernment(projectId)
        whenNotPaused
    {
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "Not pending");
        m.status = MilestoneStatus.Cancelled;
    }

    /* ============ Analytics ============ */

    function getProjectStats(uint256 projectId) external view returns (
        uint256 totalMilestones,
        uint256 completedMilestones,
        uint256 pendingMilestones,
        uint256 disputedMilestones,
        uint256 averageCompletionTime
    ) {
        totalMilestones = _milestones[projectId].length;
        
        for (uint256 i = 0; i < totalMilestones; i++) {
            MilestoneStatus status = _milestones[projectId][i].status;
            if (status == MilestoneStatus.Paid) {
                completedMilestones++;
            } else if (status == MilestoneStatus.Pending || status == MilestoneStatus.Submitted) {
                pendingMilestones++;
            } else if (status == MilestoneStatus.Disputed) {
                disputedMilestones++;
            }
        }
        
        averageCompletionTime = projectMilestoneCompletionTime[projectId];
    }

    function getContractorScore(address contractor) external view returns (uint256) {
        return contractorPerformanceScore[contractor];
    }

    receive() external payable {}
}
