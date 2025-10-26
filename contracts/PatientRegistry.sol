// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PaymentRegistry
 * @dev Smart contract for healthcare payment processing on DIDLab QBFT
 */
contract PaymentRegistry {
    
    // Payment structure
    struct Payment {
        string paymentId;
        string itemId;
        string itemType; // "bill" or "prescription"
        address payer;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        string memberID;
    }
    
    // Events
    event PaymentProcessed(
        string indexed paymentId,
        string itemId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );
    
    event PaymentRefunded(
        string indexed paymentId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );
    
    // State variables
    mapping(string => Payment) public payments;
    mapping(address => string[]) public userPayments;
    mapping(string => bool) public itemPaid; // Track if item is already paid
    
    address public owner;
    uint256 public totalPaymentsProcessed;
    uint256 public totalAmountProcessed;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Process a healthcare payment
     * @param _paymentId Unique payment identifier
     * @param _itemId Bill or prescription ID
     * @param _itemType Type of item (bill or prescription)
     * @param _memberID Patient member ID
     */
    function processPayment(
        string memory _paymentId,
        string memory _itemId,
        string memory _itemType,
        string memory _memberID
    ) public payable returns (bool) {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(!itemPaid[_itemId], "Item already paid");
        require(bytes(_paymentId).length > 0, "Payment ID required");
        require(bytes(_itemId).length > 0, "Item ID required");
        
        // Create payment record
        Payment memory newPayment = Payment({
            paymentId: _paymentId,
            itemId: _itemId,
            itemType: _itemType,
            payer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            completed: true,
            memberID: _memberID
        });
        
        // Store payment
        payments[_paymentId] = newPayment;
        userPayments[msg.sender].push(_paymentId);
        itemPaid[_itemId] = true;
        
        // Update totals
        totalPaymentsProcessed++;
        totalAmountProcessed += msg.value;
        
        // Emit event
        emit PaymentProcessed(
            _paymentId,
            _itemId,
            msg.sender,
            msg.value,
            block.timestamp
        );
        
        return true;
    }
    
    /**
     * @dev Get payment details
     * @param _paymentId Payment identifier
     */
    function getPayment(string memory _paymentId) 
        public 
        view 
        returns (
            string memory itemId,
            string memory itemType,
            address payer,
            uint256 amount,
            uint256 timestamp,
            bool completed
        ) 
    {
        Payment memory payment = payments[_paymentId];
        return (
            payment.itemId,
            payment.itemType,
            payment.payer,
            payment.amount,
            payment.timestamp,
            payment.completed
        );
    }
    
    /**
     * @dev Get all payments for a user
     * @param _user User address
     */
    function getUserPayments(address _user) 
        public 
        view 
        returns (string[] memory) 
    {
        return userPayments[_user];
    }
    
    /**
     * @dev Check if an item has been paid
     * @param _itemId Item identifier
     */
    function isItemPaid(string memory _itemId) 
        public 
        view 
        returns (bool) 
    {
        return itemPaid[_itemId];
    }
    
    /**
     * @dev Withdraw funds (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get total statistics
     */
    function getStats() 
        public 
        view 
        returns (
            uint256 paymentsProcessed,
            uint256 amountProcessed,
            uint256 contractBalance
        ) 
    {
        return (
            totalPaymentsProcessed,
            totalAmountProcessed,
            address(this).balance
        );
    }
}