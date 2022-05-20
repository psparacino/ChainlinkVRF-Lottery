const { expect, should } = require("chai");
const { ethers, waffle } = require("hardhat");
// import { ERC20, WETH9 } from "typechain";
const LotteryABI = require('../artifacts/contracts/FlashLottery.sol/FlashLottery.json').abi;


describe ("Core Lottery Functions", function() {
    let LotteryContract;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    const entryPrice = .0086;
    const provider = waffle.provider;

    before (async() => {
        const LotteryFactory = await ethers.getContractFactory('FlashLottery');
        // sample feed address
        LotteryContract = await LotteryFactory.deploy('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f','0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F');  
        await LotteryContract.deployed();

        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
    })

    it("players can join lottery", async () => {

        await LotteryContract.connect(addr1).joinPool(4, {value: ethers.utils.parseEther(`${(entryPrice * 4)}`)})
        await LotteryContract.connect(addr2).joinPool(10, {value: ethers.utils.parseEther(`${(entryPrice * 10)}`)})
        await LotteryContract.connect(addr3).joinPool(25, {value: ethers.utils.parseEther(`${(entryPrice * 25)}`)})

        const playerArray = await LotteryContract.getPlayerPool()

        const contractBalance = await provider.getBalance(LotteryContract.address)

        expect(ethers.utils.formatEther(contractBalance)).to.equal('0.3354');
        expect(playerArray.length).to.equal(3);
        
    })

    it("random number generation", async () => {
        const number = await LotteryContract.notRandomGenerator();
        console.log((number % 10000000000000000 ), "number" )
        expect(number.value).to.not.equal(undefined || '')      
    })


    





})