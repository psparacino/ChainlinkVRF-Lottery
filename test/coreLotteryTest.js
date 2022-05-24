const { expect, assert } = require("chai");
const { ethers, waffle, getChainId, deployments } = require("hardhat");
const LotteryABI = require('../artifacts/contracts/FlashLottery.sol/FlashLottery.json').abi;

const { config, autoFundCheck } = require("../config/link.config");


describe ("Core Lottery Functions", function() {
    let LotteryContract;
    let lotteryContract;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let entries;
    let LinkToken;
    let linkToken;
    let chainId;
    const entryPrice = .0086;
    const provider = waffle.provider;

    before (async() => {
        chainId = await getChainId();
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
        // const LotteryFactory = await ethers.getContractFactory('FlashLottery');
        // LotteryContract = await LotteryFactory.deploy('0x6b175474e89094c44da98b954eedeac495271d0f');  
        // await LotteryContract.deployed();

        await deployments.fixture(["main"]);
        LinkToken = await deployments.get("LinkToken");
        linkToken = await ethers.getContractAt("LinkToken", LinkToken.address);
        lotteryContract = await deployments.get("FlashLottery");
        LotteryContract = await ethers.getContractAt(
          "FlashLottery",
          lotteryContract.address
        );

        
    })

    it("address can join lottery", async () => {

        await LotteryContract.connect(addr1).joinPool(4, {value: ethers.utils.parseEther(`${(entryPrice * 4)}`)})
        await LotteryContract.connect(addr2).joinPool(10, {value: ethers.utils.parseEther(`${(entryPrice * 10)}`)})
        await LotteryContract.connect(addr3).joinPool(25, {value: ethers.utils.parseEther(`${(entryPrice * 25)}`)})
    
        expect((await LotteryContract.getPlayerPool()).length).to.equal(3);
        
    })

    it("Should emit an event when requesting randomness", async () => {
        const networkName = config[chainId].name;
        const additionalMessage = " --linkaddress " + linkToken.address;
        if (
          await autoFundCheck(
            LotteryContract.address,
            networkName,
            linkToken.address,
            additionalMessage
          )
        ) {
          await hre.run("fund-link", {
            contract: LotteryContract.address,
            linkaddress: linkToken.address,
          });
        }
        
        await LotteryContract.connect(addr1).joinPool(11, {
          value: ethers.utils.parseEther("0.0946"),
        });
        await LotteryContract.connect(addr2).joinPool(11, {
            value: ethers.utils.parseEther("0.0946"),
          });
        await expect(LotteryContract.processLotteryExternal()).to.emit(
          LotteryContract,
          "RandomnessRequested"
        );
      });

    it("50 players join lottery, winner chosen", async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const entryInWei = ethers.utils.parseEther(entryPrice.toString())
        const networkName = config[chainId].name;
        const additionalMessage = " --linkaddress " + linkToken.address;
        if (
          await autoFundCheck(
            LotteryContract.address,
            networkName,
            linkToken.address,
            additionalMessage
          )
        ) {
          await hre.run("fund-link", {
            contract: LotteryContract.address,
            linkaddress: linkToken.address,
          });
        }

        for (let i = 0; i < 50; i++) {

            wallet = ethers.Wallet.createRandom();
            wallet =  wallet.connect(ethers.provider);
            await addr1.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
            const entries = Math.floor(Math.random() * 5) + 1;
            
            await LotteryContract.connect(wallet).joinPool(entries, {value: ethers.utils.parseEther(`${(entryPrice * entries)}`)})
        }
        entries = await LotteryContract.entries();

        // console.log((await LotteryContract.getPlayerPool()).length, "player pool")
        // console.log((await LotteryContract.entries()), "entries")


        let LotteryEvent = new Promise((resolve, reject) => {
            LotteryContract.on('LotteryComplete', (winner, amount, lotteryNumber, event) => {
                event.removeListener();
                resolve({
                    winner: winner,
                    amount: amount,
                    lotteryNumber: lotteryNumber
                });
            });

            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });
        
        const txn = await LotteryContract.processLottery();

        let event = await LotteryEvent;

        let prizeAmount = (entries * entryInWei) * .85;

        expect(event.winner).to.not.equal(undefined);
        expect(ethers.utils.formatEther((event.amount).toString())).to.not.equal(prizeAmount);
        
    })

    it("four lotteries run, lottery history is valid", async () => {
        let lotteryWinners = [];
        for (let i = 0; i <= 3; i++) {
            for (let i = 0; i < 50; i++) {

                wallet = ethers.Wallet.createRandom();
                wallet =  wallet.connect(ethers.provider);
                await addr1.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
                const entries = Math.floor(Math.random() * 5) + 1;    
                await LotteryContract.connect(wallet).joinPool(entries, {value: ethers.utils.parseEther(`${(entryPrice * entries)}`)})
            }

            let LotteryEvent = new Promise((resolve, reject) => {
                LotteryContract.once('LotteryComplete', (winner, amount, lotteryNumber, event) => {
                    event.removeListener();
                    resolve({
                        winner: winner,
                        amount: amount,
                        lotteryNumber: lotteryNumber
                    });
                });
    
                setTimeout(() => {
                    reject(new Error('timeout'));
                }, 60000)
            });

              
            const txn = await LotteryContract.processLottery();

            let event = await LotteryEvent;
    
            // console.log(event.winner, "event winner")
            lotteryWinners.push(event.winner)
        }
        const history = await LotteryContract.getLotteryHistory();

        // numbers offset because of event emission in above test

        expect((history[1]).winner).to.equal(lotteryWinners[0])
        expect((history[2]).winner).to.equal(lotteryWinners[1])
       
        
    })


})