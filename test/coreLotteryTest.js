const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const LotteryABI = require('../artifacts/contracts/FlashLottery.sol/FlashLottery.json').abi;


describe ("Core Lottery Functions", function() {
    let LotteryContract;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    const entryPrice = .0086;

    before (async() => {
        const LotteryFactory = await ethers.getContractFactory('FlashLottery');
        // sample feed address
        LotteryContract = await LotteryFactory.deploy('0x6b175474e89094c44da98b954eedeac495271d0f');  
        await LotteryContract.deployed();

        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
    })

    it("address can join lottery", async () => {

        await LotteryContract.connect(addr1).joinPool(4, {value: ethers.utils.parseEther(`${(entryPrice * 4)}`)})
        await LotteryContract.connect(addr2).joinPool(10, {value: ethers.utils.parseEther(`${(entryPrice * 10)}`)})
        await LotteryContract.connect(addr3).joinPool(25, {value: ethers.utils.parseEther(`${(entryPrice * 25)}`)})


        console.log(await LotteryContract.getPlayerPool(), "player pool")
        
    })


})