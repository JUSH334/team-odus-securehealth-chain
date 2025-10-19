// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MedicationBillingLite
 * @dev Simplified medication billing contract optimized for networks with lower gas limits
 */
contract MedicationBillingLite {
    
    struct Bill {
        address patient;
        uint256 amount;
        uint256 dueDate;
        bool isPaid;
        string metadata; // Combined medication info
    }
    
    mapping(uint256 => Bill) public bills;
    mapping(address => uint256[]) public patientBills;
    mapping(address => bool) public authorizedProviders;
    mapping(address => bool) public registeredPatients;
    
    uint256 public billCounter;
    address public admin;
    
    event BillCreated(uint256 indexed billId, address indexed patient, uint256 amount);
    event BillPaid(uint256 indexed billId, address indexed patient, uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    modifier onlyProvider() {
        require(authorizedProviders[msg.sender], "Not provider");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        authorizedProviders[msg.sender] = true;
    }
    
    function registerPatient(address _patient) external onlyAdmin {
        registeredPatients[_patient] = true;
    }
    
    function authorizeProvider(address _provider) external onlyAdmin {
        authorizedProviders[_provider] = true;
    }
    
    function createBill(
        address _patient,
        uint256 _amount,
        uint256 _dueDate,
        string memory _metadata
    ) external onlyProvider returns (uint256) {
        require(registeredPatients[_patient], "Patient not registered");
        require(_amount > 0, "Invalid amount");
        
        billCounter++;
        
        bills[billCounter] = Bill({
            patient: _patient,
            amount: _amount,
            dueDate: _dueDate,
            isPaid: false,
            metadata: _metadata
        });
        
        patientBills[_patient].push(billCounter);
        
        emit BillCreated(billCounter, _patient, _amount);
        
        return billCounter;
    }
    
    function payBill(uint256 _billId) external payable {
        Bill storage bill = bills[_billId];
        
        require(msg.sender == bill.patient, "Not your bill");
        require(!bill.isPaid, "Already paid");
        require(msg.value >= bill.amount, "Insufficient payment");
        
        bill.isPaid = true;
        
        // Transfer to admin (in production, transfer to provider)
        payable(admin).transfer(bill.amount);
        
        // Refund excess
        if (msg.value > bill.amount) {
            payable(msg.sender).transfer(msg.value - bill.amount);
        }
        
        emit BillPaid(_billId, msg.sender, bill.amount);
    }
    
    function getPatientBills(address _patient) external view returns (uint256[] memory) {
        return patientBills[_patient];
    }
    
    function getBill(uint256 _billId) external view returns (
        address patient,
        uint256 amount,
        uint256 dueDate,
        bool isPaid,
        string memory metadata
    ) {
        Bill memory bill = bills[_billId];
        return (bill.patient, bill.amount, bill.dueDate, bill.isPaid, bill.metadata);
    }
    
    function getUnpaidBillsCount(address _patient) external view returns (uint256) {
        uint256 count = 0;
        uint256[] memory billIds = patientBills[_patient];
        
        for (uint256 i = 0; i < billIds.length; i++) {
            if (!bills[billIds[i]].isPaid) {
                count++;
            }
        }
        
        return count;
    }
    
    function getTotalOwed(address _patient) external view returns (uint256) {
        uint256 total = 0;
        uint256[] memory billIds = patientBills[_patient];
        
        for (uint256 i = 0; i < billIds.length; i++) {
            if (!bills[billIds[i]].isPaid) {
                total += bills[billIds[i]].amount;
            }
        }
        
        return total;
    }
}