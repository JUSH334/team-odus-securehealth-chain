// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PatientRegistry
 * @dev Core smart contract for patient registration and management in SecureHealth Chain
 */
contract PatientRegistry {
    
    // Patient structure to store essential information
    struct Patient {
        address patientAddress;
        string memberID;
        string encryptedPersonalData; // HIPAA-compliant encrypted data
        uint256 registrationTimestamp;
        bool isActive;
        address assignedProvider;
    }
    
    // Events for transparency and audit trail
    event PatientRegistered(
        address indexed patientAddress,
        string memberID,
        uint256 timestamp
    );
    
    event PatientUpdated(
        address indexed patientAddress,
        string memberID,
        uint256 timestamp
    );
    
    event ProviderAssigned(
        address indexed patientAddress,
        address indexed providerAddress,
        uint256 timestamp
    );
    
    // State variables
    mapping(address => Patient) public patients;
    mapping(string => address) public memberIDToAddress;
    mapping(address => bool) public authorizedProviders;
    
    address public custodian; // Insurance company/PBM address
    uint256 public totalPatients;
    
    // Modifiers for access control
    modifier onlyCustodian() {
        require(msg.sender == custodian, "Only custodian can perform this action");
        _;
    }
    
    modifier onlyAuthorizedProvider() {
        require(authorizedProviders[msg.sender], "Not an authorized provider");
        _;
    }
    
    modifier patientExists(address _patient) {
        require(patients[_patient].isActive, "Patient not registered");
        _;
    }
    
    constructor() {
        custodian = msg.sender;
    }
    
    /**
     * @dev Register a new patient - main function for vertical slice
     * @param _memberID Insurance member ID
     * @param _encryptedData Encrypted personal data (HIPAA compliant)
     */
    function registerPatient(
        string memory _memberID,
        string memory _encryptedData
    ) public returns (bool) {
        require(bytes(_memberID).length > 0, "Member ID cannot be empty");
        require(bytes(_encryptedData).length > 0, "Patient data cannot be empty");
        require(!patients[msg.sender].isActive, "Patient already registered");
        require(memberIDToAddress[_memberID] == address(0), "Member ID already exists");
        
        // Create new patient record
        Patient memory newPatient = Patient({
            patientAddress: msg.sender,
            memberID: _memberID,
            encryptedPersonalData: _encryptedData,
            registrationTimestamp: block.timestamp,
            isActive: true,
            assignedProvider: address(0)
        });
        
        // Update state
        patients[msg.sender] = newPatient;
        memberIDToAddress[_memberID] = msg.sender;
        totalPatients++;
        
        // Emit event for transparency and audit
        emit PatientRegistered(msg.sender, _memberID, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Get patient details
     * @param _patientAddress Address of the patient
     */
    function getPatient(address _patientAddress) 
        public 
        view 
        returns (
            string memory memberID,
            uint256 registrationTimestamp,
            bool isActive,
            address assignedProvider
        ) 
    {
        Patient memory patient = patients[_patientAddress];
        return (
            patient.memberID,
            patient.registrationTimestamp,
            patient.isActive,
            patient.assignedProvider
        );
    }
    
    /**
     * @dev Update patient information
     * @param _encryptedData New encrypted personal data
     */
    function updatePatientData(string memory _encryptedData) 
        public 
        patientExists(msg.sender) 
        returns (bool) 
    {
        require(bytes(_encryptedData).length > 0, "Data cannot be empty");
        
        patients[msg.sender].encryptedPersonalData = _encryptedData;
        
        emit PatientUpdated(
            msg.sender, 
            patients[msg.sender].memberID, 
            block.timestamp
        );
        
        return true;
    }
    
    /**
     * @dev Assign a provider to a patient
     * @param _patientAddress Address of the patient
     * @param _providerAddress Address of the provider
     */
    function assignProvider(address _patientAddress, address _providerAddress)
        public
        onlyCustodian
        patientExists(_patientAddress)
        returns (bool)
    {
        require(authorizedProviders[_providerAddress], "Not an authorized provider");
        
        patients[_patientAddress].assignedProvider = _providerAddress;
        
        emit ProviderAssigned(_patientAddress, _providerAddress, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Authorize a provider (custodian only)
     * @param _provider Address of the provider to authorize
     */
    function authorizeProvider(address _provider) 
        public 
        onlyCustodian 
        returns (bool) 
    {
        authorizedProviders[_provider] = true;
        return true;
    }
    
    /**
     * @dev Check if a member ID is already registered
     * @param _memberID Insurance member ID to check
     */
    function isMemberIDRegistered(string memory _memberID) 
        public 
        view 
        returns (bool) 
    {
        return memberIDToAddress[_memberID] != address(0);
    }
}