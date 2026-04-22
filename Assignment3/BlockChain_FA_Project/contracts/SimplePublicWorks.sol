// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimplePublicWorks
 * @notice Simple, working system for public works audit
 */
contract SimplePublicWorks {
    enum ProjectStatus { Active, Completed, Cancelled }
    enum VoteType { Approve, Veto }
    
    struct Project {
        uint256 id;
        address government;
        address contractor;
        string title;
        string description;
        uint256 budget;
        uint256 vetoThreshold;
        uint256 createdAt;
        ProjectStatus status;
        uint256 totalVotes;
        uint256 approveVotes;
        uint256 vetoVotes;
        bool proofSubmitted;
        string proofHash;
    }
    
    struct Vote {
        address voter;
        VoteType voteType;
        uint256 amount;
        string comment;
        uint256 timestamp;
    }
    
    address public admin;
    uint256 public projectCount;
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Vote[]) public projectVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed government,
        address indexed contractor,
        uint256 budget,
        uint256 vetoThreshold,
        string title
    );
    
    event ProofSubmitted(
        uint256 indexed projectId,
        address indexed contractor,
        string proofHash
    );
    
    event Voted(
        uint256 indexed projectId,
        address indexed voter,
        VoteType voteType,
        uint256 amount,
        string comment
    );
    
    event ProjectCompleted(
        uint256 indexed projectId,
        address indexed contractor,
        uint256 amountPaid
    );
    
    constructor() {
        admin = msg.sender;
    }
    
    // Government creates project
    function createProject(
        address contractor,
        string memory title,
        string memory description,
        uint256 budget,
        uint256 vetoThreshold
    ) external payable returns (uint256) {
        require(msg.value == budget, "Send exact budget amount");
        require(contractor != address(0), "Invalid contractor");
        require(vetoThreshold > 0, "Veto threshold must be > 0");
        
        uint256 projectId = projectCount++;
        
        projects[projectId] = Project({
            id: projectId,
            government: msg.sender,
            contractor: contractor,
            title: title,
            description: description,
            budget: budget,
            vetoThreshold: vetoThreshold,
            createdAt: block.timestamp,
            status: ProjectStatus.Active,
            totalVotes: 0,
            approveVotes: 0,
            vetoVotes: 0,
            proofSubmitted: false,
            proofHash: ""
        });
        
        emit ProjectCreated(projectId, msg.sender, contractor, budget, vetoThreshold, title);
        return projectId;
    }
    
    // Contractor submits proof
    function submitProof(uint256 projectId, string memory proofHash) external {
        Project storage project = projects[projectId];
        require(msg.sender == project.contractor, "Only contractor");
        require(project.status == ProjectStatus.Active, "Project not active");
        
        project.proofSubmitted = true;
        project.proofHash = proofHash;
        
        emit ProofSubmitted(projectId, msg.sender, proofHash);
    }
    
    // Public votes with ETH
    function vote(
        uint256 projectId,
        VoteType voteType,
        string memory comment
    ) external payable {
        Project storage project = projects[projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        require(project.proofSubmitted, "Proof not submitted yet");
        require(!hasVoted[projectId][msg.sender], "Already voted");
        require(msg.value > 0, "Must send ETH to vote");
        
        hasVoted[projectId][msg.sender] = true;
        
        projectVotes[projectId].push(Vote({
            voter: msg.sender,
            voteType: voteType,
            amount: msg.value,
            comment: comment,
            timestamp: block.timestamp
        }));
        
        project.totalVotes++;
        
        if (voteType == VoteType.Approve) {
            project.approveVotes++;
        } else {
            project.vetoVotes++;
        }
        
        emit Voted(projectId, msg.sender, voteType, msg.value, comment);
        
        // Check if veto threshold reached
        if (project.vetoVotes >= project.vetoThreshold) {
            // Refund all voters
            refundVoters(projectId);
            project.status = ProjectStatus.Cancelled;
        }
        
        // Check if approved and can complete
        checkAndComplete(projectId);
    }
    
    // Check and complete project
    function checkAndComplete(uint256 projectId) internal {
        Project storage project = projects[projectId];
        
        // Simple logic: If approve votes > veto votes * 2, complete
        if (project.approveVotes > project.vetoVotes * 2 && project.totalVotes >= 3) {
            project.status = ProjectStatus.Completed;
            
            // Pay contractor
            uint256 amount = project.budget;
            (bool success, ) = payable(project.contractor).call{value: amount}("");
            require(success, "Payment failed");
            
            emit ProjectCompleted(projectId, project.contractor, amount);
        }
    }
    
    // Refund voters if project cancelled
    function refundVoters(uint256 projectId) internal {
        Vote[] storage votes = projectVotes[projectId];
        
        for (uint256 i = 0; i < votes.length; i++) {
            (bool success, ) = payable(votes[i].voter).call{value: votes[i].amount}("");
            require(success, "Refund failed");
        }
    }
    
    // Get project details
    function getProject(uint256 projectId) external view returns (
        uint256 id,
        address government,
        address contractor,
        string memory title,
        string memory description,
        uint256 budget,
        uint256 vetoThreshold,
        ProjectStatus status,
        uint256 totalVotes,
        uint256 approveVotes,
        uint256 vetoVotes,
        bool proofSubmitted,
        string memory proofHash
    ) {
        Project storage project = projects[projectId];
        return (
            project.id,
            project.government,
            project.contractor,
            project.title,
            project.description,
            project.budget,
            project.vetoThreshold,
            project.status,
            project.totalVotes,
            project.approveVotes,
            project.vetoVotes,
            project.proofSubmitted,
            project.proofHash
        );
    }
    
    // Get votes for project
    function getVotes(uint256 projectId) external view returns (Vote[] memory) {
        return projectVotes[projectId];
    }
    
    // Get contract balance
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    receive() external payable {}
}
