// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

/**
 * @title PublicWorkAudit
 * @notice Milestone escrow (ETH or ERC-20), multi-oracle quorum, citizen audit window, IPFS evidence CIDs.
 */
contract PublicWorkAudit {
    /* ============ Types ============ */

    enum MilestoneStatus {
        Pending,
        Submitted,
        PublicAudit,
        Paid,
        Disputed,
        Rejected
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
    }

    /* ============ Storage ============ */

    address public admin;
    uint256 public projectCount;
    uint256 public publicAuditWindowSeconds;
    uint256 public vetoThreshold;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone[]) private _milestones;
    mapping(address => bool) public isOracle;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _citizenVoted;
    mapping(bytes32 => bool) private _oracleAttested;

    /* ============ Events ============ */

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed government,
        address indexed contractor,
        address paymentToken,
        uint256 oracleQuorum,
        string title,
        uint256 totalBudget,
        string blueprintIpfsHash
    );
    event MilestoneProofSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        string evidenceIpfsHash,
        uint256 submittedAt
    );
    /// @notice One oracle attestation (quorum may not be reached yet).
    event MilestoneOracleAttested(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed oracle,
        uint256 confirmationCount,
        uint256 requiredQuorum
    );
    /// @notice Citizen audit window opened after quorum satisfied.
    event MilestonePublicAuditOpened(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 publicAuditEndsAt
    );
    event CitizenVote(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed citizen,
        bool approved
    );
    event MilestonePaid(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed contractor,
        address paymentToken,
        uint256 amount
    );
    event MilestoneDisputed(uint256 indexed projectId, uint256 indexed milestoneIndex, string reason);
    event MilestoneRejected(uint256 indexed projectId, uint256 indexed milestoneIndex);
    event DisputeResolved(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        bool payContractor
    );
    event OracleUpdated(address indexed oracle, bool active);

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

    /* ============ Constructor ============ */

    constructor(uint256 auditWindowSeconds_, uint256 vetoThreshold_) {
        admin = msg.sender;
        publicAuditWindowSeconds = auditWindowSeconds_ == 0 ? 3 days : auditWindowSeconds_;
        vetoThreshold = vetoThreshold_ == 0 ? 3 : vetoThreshold_;
        isOracle[msg.sender] = true;
        emit OracleUpdated(msg.sender, true);
    }

    /* ============ Admin ============ */

    function setOracle(address oracle, bool active) external onlyAdmin {
        isOracle[oracle] = active;
        emit OracleUpdated(oracle, active);
    }

    function setPublicAuditWindow(uint256 seconds_) external onlyAdmin {
        require(seconds_ > 0, "Invalid window");
        publicAuditWindowSeconds = seconds_;
    }

    function setVetoThreshold(uint256 threshold_) external onlyAdmin {
        vetoThreshold = threshold_;
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero admin");
        admin = newAdmin;
    }

    /* ============ Internal ============ */

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

    /* ============ Projects ============ */

    /**
     * @param paymentToken address(0) = native ETH (send `msg.value`); else ERC-20 `transferFrom` government.
     * @param oracleQuorum_ distinct oracle attestations required before public audit (0 => 1).
     */
    function createProject(
        string calldata title,
        string calldata description,
        string calldata blueprintIpfsHash,
        address contractor,
        address paymentToken,
        uint256 oracleQuorum_,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmountsWei
    ) external payable returns (uint256 projectId) {
        require(bytes(title).length > 0, "Empty title");
        require(contractor != address(0), "Zero contractor");
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
                    lastOracleAttester: address(0)
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
            blueprintIpfsHash
        );
    }

    function milestoneCount(uint256 projectId) external view returns (uint256) {
        return _milestones[projectId].length;
    }

    function getMilestone(uint256 projectId, uint256 index) external view returns (Milestone memory) {
        require(index < _milestones[projectId].length, "Bad index");
        return _milestones[projectId][index];
    }

    function tokenBalanceHeld(address token) external view returns (uint256) {
        return _contractTokenBalance(token);
    }

    /* ============ Contractor ============ */

    function submitMilestoneProof(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata evidenceIpfsHash
    ) external onlyContractor(projectId) {
        Project storage p = projects[projectId];
        require(p.active, "Inactive");
        require(bytes(evidenceIpfsHash).length > 0, "Empty evidence");
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "Not pending");

        m.evidenceIpfsHash = evidenceIpfsHash;
        m.submittedAt = block.timestamp;
        m.status = MilestoneStatus.Submitted;

        emit MilestoneProofSubmitted(projectId, milestoneIndex, evidenceIpfsHash, block.timestamp);
    }

    /* ============ Oracle quorum ============ */

    function oracleVerifyMilestone(uint256 projectId, uint256 milestoneIndex) external {
        require(isOracle[msg.sender], "Not oracle");
        Project storage p = projects[projectId];
        require(p.active, "Inactive");
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "Not submitted");

        bytes32 k = _oracleKey(projectId, milestoneIndex, msg.sender, m.oracleResetNonce);
        require(!_oracleAttested[k], "Oracle already attested");
        _oracleAttested[k] = true;

        m.oracleConfirmationCount++;
        m.lastOracleAttester = msg.sender;

        emit MilestoneOracleAttested(
            projectId,
            milestoneIndex,
            msg.sender,
            m.oracleConfirmationCount,
            p.oracleQuorum
        );

        if (m.oracleConfirmationCount >= p.oracleQuorum) {
            m.oracleVerifiedAt = block.timestamp;
            m.publicAuditEndsAt = block.timestamp + publicAuditWindowSeconds;
            m.status = MilestoneStatus.PublicAudit;
            emit MilestonePublicAuditOpened(projectId, milestoneIndex, m.publicAuditEndsAt);
        }
    }

    /* ============ Citizens ============ */

    function citizenAuditVote(uint256 projectId, uint256 milestoneIndex, bool approve) external {
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

        emit CitizenVote(projectId, milestoneIndex, msg.sender, approve);
    }

    /* ============ Finalize / Pay ============ */

    function finalizeMilestone(uint256 projectId, uint256 milestoneIndex) external {
        Project storage p = projects[projectId];
        require(p.active, "Inactive");
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.PublicAudit, "Not in audit");
        require(block.timestamp > m.publicAuditEndsAt, "Audit active");

        if (m.citizenVetoes >= vetoThreshold) {
            m.status = MilestoneStatus.Disputed;
            emit MilestoneDisputed(projectId, milestoneIndex, "Public veto threshold reached");
            return;
        }

        uint256 payAmount = m.amountWei;
        if (p.paymentToken == address(0)) {
            require(address(this).balance >= payAmount, "Insufficient ETH");
        } else {
            require(_contractTokenBalance(p.paymentToken) >= payAmount, "Insufficient token");
        }

        m.status = MilestoneStatus.Paid;
        p.totalPaidOut += payAmount;

        _payContractor(p, p.contractor, payAmount);

        emit MilestonePaid(projectId, milestoneIndex, p.contractor, p.paymentToken, payAmount);
    }

    /* ============ Government dispute resolution ============ */

    function rejectMilestone(uint256 projectId, uint256 milestoneIndex)
        external
        onlyGovernment(projectId)
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
        emit MilestoneRejected(projectId, milestoneIndex);
    }

    function resolveDispute(uint256 projectId, uint256 milestoneIndex, bool payContractor_)
        external
        onlyGovernment(projectId)
    {
        Milestone storage m = _milestones[projectId][milestoneIndex];
        require(m.status == MilestoneStatus.Disputed, "Not disputed");

        Project storage p = projects[projectId];

        if (payContractor_) {
            uint256 payAmount = m.amountWei;
            if (p.paymentToken == address(0)) {
                require(address(this).balance >= payAmount, "Insufficient ETH");
            } else {
                require(_contractTokenBalance(p.paymentToken) >= payAmount, "Insufficient token");
            }
            m.status = MilestoneStatus.Paid;
            p.totalPaidOut += payAmount;
            _payContractor(p, p.contractor, payAmount);
            emit MilestonePaid(projectId, milestoneIndex, p.contractor, p.paymentToken, payAmount);
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

        emit DisputeResolved(projectId, milestoneIndex, payContractor_);
    }

    /* ============ Views ============ */

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
