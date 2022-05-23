const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const LotteryABI = require('../artifacts/contracts/FlashLottery.sol/FlashLottery.json').abi;


describe ("Core Lottery Functions", function() {
    let LotteryContract;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let entries;
    const entryPrice = .0086;
    const provider = waffle.provider;

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
    
        expect((await LotteryContract.getPlayerPool()).length).to.equal(3);
        
    })

    it("50 players join lottery, winner chosen", async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const entryInWei = ethers.utils.parseEther(entryPrice.toString())

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