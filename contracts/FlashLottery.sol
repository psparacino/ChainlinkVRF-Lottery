// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract FlashLottery {

    address[] public playerPool; // players in current lottery
    mapping(address => uint) players; //player 
    address admin;
    uint public prizePool;

    uint constant maxEntriesPerPlayer = 50;
    AggregatorV3Interface internal priceFeed;

    Lottery[] public lotteryHistory;

    struct Lottery {
        uint lotteryNumber;
        uint numberOfPlayers;
        uint totalValueWon;
        address winner;
        bool flashDecision;
    }

    

    // xDai data feeds: https://docs.chain.link/docs/data-feeds-gnosis-chain/

    event playerJoined(address player, uint numberOfEntries);
    event lotteryComplete (address winner, uint amount, uint lotteryNumber);

    // Modifiers
    modifier adminOnly() {
        require(msg.sender == admin);
        _;
    }

    constructor(address aggregatorAddress) {
        admin = msg.sender;
        priceFeed = AggregatorV3Interface(aggregatorAddress);
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

        players[msg.sender] += 1;
        prizePool += (.0086 ether * numberOfEntries);
        emit playerJoined(msg.sender, numberOfEntries);

    }

    function processLottery() public adminOnly returns(address, uint) {
        require(playerPool.length > 0, "no one has joined the lottery yet");

        uint index = notRandomGenerator() % playerPool.length;
        address winner = playerPool[index];
        uint prizeAmount = prizePool * 85 /100;
        uint lotteryNumber = lotteryHistory.length;

        Lottery memory lottery = Lottery(lotteryNumber, playerPool.length, prizeAmount, winner, false);

        lotteryHistory.push(lottery);


        for (uint i = 0; i< playerPool.length ; i++){
            players[playerPool[i]] = 0;
        }
        prizePool = 0;
        playerPool = new address[](0);

        emit lotteryComplete(winner, prizeAmount, lotteryNumber);

    }

    //replace eventually with Chainlink VRF
    //  https://betterprogramming.pub/how-to-generate-truly-random-numbers-in-solidity-and-blockchain-9ced6472dbdf
    function notRandomGenerator() public view returns(uint){
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, playerPool)));
    }

    // ******************
    // Lottery Getters
    // ******************

    function getPlayerPool() public view returns(address[] memory) {
        return playerPool;
    }


    // ******************
    // FlashSwap Functions
    // ******************
  

}