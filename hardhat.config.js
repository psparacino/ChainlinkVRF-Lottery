
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
// require("hardhat-typechain");
require("hardhat-gas-reporter");
require('dotenv').config()

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
      forking: {
        url: process.env.ALCHEMY_MAINNET_RPC_URL,
        blockNumber: 12975788
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.6.6",
        settings: {},
      },
    ],
    overrides: {
      "contracts/UniswapV2Library.sol": {
        version: "0.6.6",
        settings: { }
      },
      "contracts/SafeMath.sol": {
        version: "0.6.6",
        settings: { }
      },
      
      
      
    }
  }
};

//use Uniswamp's interfaces, not OZs
