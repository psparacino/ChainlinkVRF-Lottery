// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import 'hardhat/console.sol';

// https://dev.to/johbu/creating-a-lottery-with-hardhat-and-chainlink-385f

contract FlashLottery is VRFConsumerBase {

    address[] public playerPool; // players in current lottery
    mapping(address => uint) players; //player 
    uint public entries;
    address admin;
    uint public prizePool;
    uint public randomNumber;
    uint constant maxEntriesPerPlayer = 50;

    bytes32 private keyHash;
    uint256 private fee;

    Lottery[] public lotteryHistory;

    struct Lottery {
        uint lotteryNumber;
        uint numberOfPlayers;
        uint totalValueWon;
        address winner;
    }

    event playerJoined(address player, uint numberOfEntries);
    event LotteryComplete(address winner, uint amount, uint lotteryNumber);
    event RandomnessRequested(bytes32 requestId,uint256 lotteryNumber);

    // Modifiers
    modifier adminOnly() {
        require(msg.sender == admin);
        _;
    }

    constructor(address vrfCoordinator, address link, bytes32 _keyhash, uint256 _fee)
    VRFConsumerBase(vrfCoordinator, link)
    {
    keyHash = _keyhash;
    fee = _fee;
    admin = msg.sender;
    }


    // ******************
    // VRF Functions
    // ******************

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        console.log(randomness, "randomness in contract"); 
        uint256 _lotteryId = lotteryHistory.length;
        uint256 index = randomness % playerPool.length;

        randomNumber = randomness;

        // address winner = playerPool[index]; 
        // uint prizeAmount = prizePool * 85 /100;
        // uint lotteryNumber = lotteryHistory.length;

        // // console.log("lottery winner (contract):", winner);
        // // console.log("prize amount in Wei (contract):", prizeAmount);

        // Lottery memory lottery = Lottery(lotteryNumber, playerPool.length, prizeAmount, winner);

        // lotteryHistory.push(lottery);

        // (bool success,)= winner.call{value: prizeAmount}("");
        // require(success, "transfer of winning funds not successful");

        // for (uint i = 0; i< playerPool.length ; i++){
        //     players[playerPool[i]] = 0;
        // }
        
        // prizePool = 0;
        // playerPool = new address[](0);
        // entries = 0;

        // emit LotteryComplete(winner, prizeAmount, lotteryNumber);
    }





    // ******************
    // Lottery Functions
    // ******************

    function joinPool(uint numberOfEntries) public payable {
        require(msg.value == (.0086 ether * numberOfEntries), "each entry costs .0086 ether. wrong amount sent");
        require(players[msg.sender] < maxEntriesPerPlayer, "this address has already reached maximum entries for this lottery (50)");

        if (players[msg.sender] == 0) {
            playerPool.push(msg.sender);
        }

        entries += numberOfEntries;
        players[msg.sender] += 1;
        prizePool += (.0086 ether * numberOfEntries);
        emit playerJoined(msg.sender, numberOfEntries);

    }

        function processLottery() public adminOnly {
        require(playerPool.length > 0, "no one has joined the lottery yet");

        uint index = notRandomGenerator() % playerPool.length;
        address winner = playerPool[index];
        uint prizeAmount = prizePool * 85 /100;
        uint lotteryNumber = lotteryHistory.length;

        // console.log("lottery winner (contract):", winner);
        // console.log("prize amount in Wei (contract):", prizeAmount);

        Lottery memory lottery = Lottery(lotteryNumber, playerPool.length, prizeAmount, winner);

        lotteryHistory.push(lottery);

        (bool success,)= winner.call{value: prizeAmount}("");
        require(success, "transfer of winning funds not successful");

        for (uint i = 0; i< playerPool.length ; i++){
            players[playerPool[i]] = 0;
        }
        
        prizePool = 0;
        playerPool = new address[](0);
        entries = 0;

        emit LotteryComplete(winner, prizeAmount, lotteryNumber);

    }

    function processLotteryVRF() public adminOnly {
        console.log("Lottery being processed...");
        console.log("Link Balance is:", LINK.balanceOf(address(this)));
        require(playerPool.length > 0, "no one has joined the lottery yet");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        bytes32 requestId = requestRandomness(keyHash, fee);
        console.log("Randomness Requested");
        emit RandomnessRequested(requestId, lotteryHistory.length);
    }

    function notRandomGenerator() public view returns(uint){
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, playerPool)));
    }

    // ******************
    // Lottery Getters
    // ******************

    function getPlayerPool() public view returns(address[] memory) {
        return playerPool;
    }

    function getLotteryHistory() public view returns(Lottery[] memory) {
        return lotteryHistory;
    }



    // ******************
    // FlashSwap Functions
    // ******************
  

}