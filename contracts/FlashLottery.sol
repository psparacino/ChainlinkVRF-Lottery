// SPDX-License-Identifier: MIT

   
pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/UniswapInterfaces.sol";

import 'hardhat/console.sol';

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external;
}
contract FlashLottery is IUniswapV2Callee {

    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant UniswapV2Factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    //  sushi Router 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F


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
        console.log(index, "index");
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

        return (winner, prizeAmount);

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


    function flashSwapArb(address _tokenBorrow, uint _amount) external {
        address pair = IUniswapV2Factory(UniswapV2Factory).getPair(_tokenBorrow, WETH);
        require(pair != address(0), "!pair");
        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint256 amount0Out = _tokenBorrow == token0 ? _amount : 0;
        uint256 amount1Out = _tokenBorrow == token1 ? _amount : 0;
        bytes memory data = abi.encode(_tokenBorrow, _amount);
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);

    }

    function uniswapV2Call(
        address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data
    ) external override {
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        // call uniswapv2factory to getpair 
        address pair = IUniswapV2Factory(UniswapV2Factory).getPair(token0, token1);
        require(msg.sender == pair, "caller is not pair contract");
        (address tokenBorrow, uint amount) = abi.decode(_data, (address, uint));
        console.log(amount, "amount");
        
        uint fee = ((amount *3) / 997) + 1;
        uint amountToRepay = amount + fee;
        IERC20(tokenBorrow).transfer(pair, amountToRepay);
    }

    function _calculateRepayment(uint256 owedAmount) internal pure returns (uint256)
    {
        uint256 fee = ((owedAmount * 3) / 997) + 1;
        return owedAmount + fee;
    }
  

}