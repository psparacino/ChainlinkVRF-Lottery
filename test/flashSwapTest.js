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
    const provider = ethers.provider;

    const DECIMALS = 18
    // const USDCHolder = "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE";
    const USDCHolder = "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE";
    const DAIHolder = "0x6F6C07d80D0D433ca389D336e6D1feBEA2489264";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";


    before (async() => {
        const LotteryFactory = await ethers.getContractFactory('FlashLottery');
        // sample feed address
        LotteryContract = await LotteryFactory.deploy('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f','0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F');  
        await LotteryContract.deployed();

        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
    })

    it("flashSwapArb Attempt", async () => {

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [USDCHolder],
        });

        const impersonateSigner = await ethers.getSigner(USDCHolder);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [DAIHolder],
        });

        const impersonateDAISigner = await ethers.getSigner(DAIHolder);
        

        // Token Borrowed
        const USDCContract = new ethers.Contract(USDC, ERC20ABI, impersonateSigner)
        const DAIContract = new ethers.Contract(DAI, ERC20ABI, impersonateDAISigner)

        await USDCContract.connect(impersonateSigner).transfer(LotteryContract.address, 627915817099)
        await DAIContract.connect(impersonateDAISigner).transfer(LotteryContract.address, 1593109897874121)

        console.log("LotteryContract USDC balance is:", (await USDCContract.balanceOf(LotteryContract.address)).toString());
        console.log("LotteryContract DAI balance is:", (await DAIContract.balanceOf(LotteryContract.address)).toString());
        console.log("DAIContract DAI balance is:", (await DAIContract.balanceOf(DAIContract.address)).toString());
        console.log("USDCContract USDC balance is:", (await USDCContract.balanceOf(USDCContract.address)).toString());

        const borrowAmount = ethers.utils.parseUnits("50.0", DECIMALS);


        await LotteryContract.flashSwapArb(DAI, USDC, 0 , 1000);

        
    }
    

    // it("flashSwap Attempt", async () => {
    //     await hre.network.provider.request({
    //         method: "hardhat_impersonateAccount",
    //         params: [USDCHolder],
    //     });
    //     const impersonateSigner = await ethers.getSigner(USDCHolder);

    //     // Token Borrowed
    //     const USDCContract = new ethers.Contract(USDC, ERC20ABI, impersonateSigner)
    //     const fee = Math.round(((borrowAmount * 3) / 997)) + 1;

    //     console.log(fee, "fee")

    //     await USDCContract.connect(impersonateSigner).transfer(LotteryContract.address, fee)

    //     const beforeBalance = await USDCContract.balanceOf(LotteryContract.address);

    //     console.log(beforeBalance, "balance before")

    //     await LotteryContract.flashSwapArb(USDCContract.address, borrowAmount);

        

    //     const updatedBalance = await USDCContract.balanceOf(LotteryContract.address);
    //     console.log(updatedBalance, "balance new")
        
    // }
    
    
    )

    





})