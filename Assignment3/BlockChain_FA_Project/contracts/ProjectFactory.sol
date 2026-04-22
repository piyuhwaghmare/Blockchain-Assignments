// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProjectFactory
 * @notice Factory pattern for creating and managing multiple audit contract instances
 */
contract ProjectFactory {
    address public admin;
    address[] public deployedContracts;
    
    mapping(address => bool) public isDeployed;
    mapping(address => address) public contractOwner;
    mapping(address => string) public contractMetadata;
    
    event ContractDeployed(
        address indexed contractAddress,
        address indexed owner,
        string metadata,
        uint256 timestamp
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function registerContract(
        address contractAddress,
        string calldata metadata
    ) external {
        require(!isDeployed[contractAddress], "Already registered");
        
        deployedContracts.push(contractAddress);
        isDeployed[contractAddress] = true;
        contractOwner[contractAddress] = msg.sender;
        contractMetadata[contractAddress] = metadata;
        
        emit ContractDeployed(contractAddress, msg.sender, metadata, block.timestamp);
    }
    
    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
    
    function getContractCount() external view returns (uint256) {
        return deployedContracts.length;
    }
}
