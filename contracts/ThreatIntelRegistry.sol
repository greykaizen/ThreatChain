// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ThreatIntelRegistry
 * @dev Stores cryptographic hashes of STIX threat intelligence reports on Ethereum
 * @notice Only hashes are stored on-chain, full reports remain off-chain for confidentiality
 */
contract ThreatIntelRegistry {
    
    // Structure to store report provenance
    struct ReportRecord {
        bytes32 reportHash;      // SHA-256 hash of STIX report
        string reportId;         // UUID from off-chain database
        uint256 timestamp;       // Block timestamp
        address uploader;        // Address that registered the hash
        bool exists;             // Flag to check if record exists
    }
    
    // Mapping from hash to record
    mapping(bytes32 => ReportRecord) public records;
    
    // Array to track all registered hashes
    bytes32[] public registeredHashes;
    
    // Events
    event HashRegistered(
        bytes32 indexed reportHash,
        string reportId,
        uint256 timestamp,
        address indexed uploader
    );
    
    /**
     * @dev Register a new threat intelligence report hash
     * @param _reportHash SHA-256 hash of the STIX report
     * @param _reportId UUID of the report in off-chain database
     */
    function registerReport(bytes32 _reportHash, string memory _reportId) public {
        require(_reportHash != bytes32(0), "Invalid hash");
        require(bytes(_reportId).length > 0, "Invalid report ID");
        require(!records[_reportHash].exists, "Hash already registered");
        
        records[_reportHash] = ReportRecord({
            reportHash: _reportHash,
            reportId: _reportId,
            timestamp: block.timestamp,
            uploader: msg.sender,
            exists: true
        });
        
        registeredHashes.push(_reportHash);
        
        emit HashRegistered(_reportHash, _reportId, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Verify if a hash exists in the registry
     * @param _reportHash Hash to verify
     * @return exists Whether the hash is registered
     * @return timestamp When it was registered
     * @return uploader Who registered it
     */
    function verifyReport(bytes32 _reportHash) public view returns (
        bool exists,
        uint256 timestamp,
        address uploader,
        string memory reportId
    ) {
        ReportRecord memory record = records[_reportHash];
        return (
            record.exists,
            record.timestamp,
            record.uploader,
            record.reportId
        );
    }
    
    /**
     * @dev Get total number of registered reports
     */
    function getTotalReports() public view returns (uint256) {
        return registeredHashes.length;
    }
    
    /**
     * @dev Get hash by index
     */
    function getHashByIndex(uint256 index) public view returns (bytes32) {
        require(index < registeredHashes.length, "Index out of bounds");
        return registeredHashes[index];
    }
}
