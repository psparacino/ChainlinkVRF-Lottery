
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
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
      chainId: 1337  
    },
  },  
  solidity: "0.8.10",
};
