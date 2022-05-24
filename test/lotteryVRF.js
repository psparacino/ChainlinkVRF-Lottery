const { getChainId, deployments, ethers } = require("hardhat");
const { config, autoFundCheck } = require("../config/link.config");
const { expect } = require("chai");


describe("Lottery Integration Tests", function() {
    this.timeout(300241);
    let LotteryContract;
    let lotteryContract;
    let LinkToken;
    let linkToken;
    let chainId;
    let deployer;
    let addr1;
    let addr2;

    before(async () => {
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

    });

    it("Should receive the random number from the Oracle", async () => {
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

      const addressJoins = await LotteryContract
        .connect(addr1)
        .joinPool(1, {value: ethers.utils.parseEther("0.0086"),
        });
      await addressJoins.wait();
      console.log("Addr1 Joins", new Date());
    //   const lottery2 = await lotteryContract.getLottery(lengthNumber);
    //   console.log(lottery2);
    // await new Promise((resolve) => setTimeout(resolve, 120000));
    const winnerTx = await LotteryContract.processLotteryVRF();
    // await winnerTx.wait();
    // Give the oracle some minutes to update the random number
    await new Promise((resolve) => setTimeout(resolve, 180000));
    const randomInteger = await LotteryContract.randomNumber();
    console.log(randomInteger, "randomInteger")
    // expect(lotteryAfter.winner).to.not.be.eq(
    //   "0x0000000000000000000000000000000000000000"
    // });
    })
  }); 