// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DAO {

    struct Proposal {
        string description;
        uint voteCount;
        uint deadline;
        bool executed;
    }

    address public owner;
    mapping(address => bool) public members;
    Proposal[] public proposals;

    mapping(uint => mapping(address => bool)) public hasVoted;

    constructor() {
        owner = msg.sender;
        members[msg.sender] = true; // creator is member
    }

    // Add member
    function addMember(address _member) public {
        require(msg.sender == owner, "Only owner");
        members[_member] = true;
    }

    // Create proposal
    function createProposal(string memory _desc, uint _duration) public {
        require(members[msg.sender], "Not a member");

        proposals.push(Proposal({
            description: _desc,
            voteCount: 0,
            deadline: block.timestamp + _duration,
            executed: false
        }));
    }

    // Vote
    function vote(uint proposalId) public {
        require(members[msg.sender], "Not a member");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(block.timestamp < proposals[proposalId].deadline, "Voting ended");

        proposals[proposalId].voteCount++;
        hasVoted[proposalId][msg.sender] = true;
    }

    // Execute proposal
    function executeProposal(uint proposalId) public {
        Proposal storage p = proposals[proposalId];

        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");
        require(p.voteCount > 0, "No votes");

        p.executed = true;
    }

    // View proposal
    function getProposal(uint id) public view returns (
        string memory, uint, uint, bool
    ) {
        Proposal memory p = proposals[id];
        return (p.description, p.voteCount, p.deadline, p.executed);
    }
}