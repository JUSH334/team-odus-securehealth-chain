require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    didlab: {
      url: "https://eth.didlab.org", // Replace with actual RPC endpoint
      chainId: 252501, // Replace with didlab's actual chain ID
      accounts: process.env.PRIVATE_KEY ? [`${process.env.PRIVATE_KEY}`] : []
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

