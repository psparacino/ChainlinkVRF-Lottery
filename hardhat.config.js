
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require('dotenv').config()
require("solidity-coverage");
require("hardhat-deploy");
require("@appliedblockchain/chainlink-plugins-fund-link");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


module.exports = {
  gasReporter: {
    enabled: false,
    currency: 'USD'
  },
  networks: {
    hardhat: {
      chainId: 1337  
    },
  }, 
  namedAccounts: {
    deployer: {
      default: 0,
      4: 0,
    },
    user2: {
      default: 1,
      4: 1,
    },
    user3: {
      default: 2,
      4: 2,
    },
  }, 
  solidity: {
    compilers: [
      {
        version: "0.8.10",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.4.24",
      },
    ],
  },
  mocha: {
    timeout: 10000000,
  },
};
