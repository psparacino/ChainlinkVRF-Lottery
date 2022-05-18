const { expect, should } = require("chai");
const { ethers, waffle } = require("hardhat");
// import { ERC20, WETH9 } from "typechain";
const LotteryABI = require('../artifacts/contracts/FlashLottery.sol/FlashLottery.json').abi;
const ERC20ABI = require("@uniswap/v2-core/build/ERC20.json").abi;


describe ("FlashSwap Tests", function() {
    let LotteryContract;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    const provider = waffle.provider;
    const USDCHolder = "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE";
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const borrowAmount = 10000000000000; // 1000

    before (async() => {
        const LotteryFactory = await ethers.getContractFactory('FlashLottery');
        // sample feed address
        LotteryContract = await LotteryFactory.deploy('0x6b175474e89094c44da98b954eedeac495271d0f');  
        await LotteryContract.deployed();

        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
    })

    it("flashSwap Attempt", async () => {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [USDCHolder],
        });
        const impersonateSigner = await ethers.getSigner(USDCHolder);

        // Token Borrowed
        const USDCContract = new ethers.Contract(USDCAddress, ERC20ABI, impersonateSigner)
        const fee = Math.round(((borrowAmount * 3) / 997)) + 1;

        console.log(fee, "fee")

        await USDCContract.connect(impersonateSigner).transfer(LotteryContract.address, fee)

        const beforeBalance = await USDCContract.balanceOf(LotteryContract.address);

        console.log(beforeBalance, "balance before")

        await LotteryContract.flashSwapArb(USDCContract.address, borrowAmount);

        

        const updatedBalance = await USDCContract.balanceOf(LotteryContract.address);
        console.log(updatedBalance, "balance new")
        
    })

    





})