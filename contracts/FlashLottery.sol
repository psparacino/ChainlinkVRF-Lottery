// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import './UniswapV2Library.sol';
import "./interfaces/IERC20.sol";
import "./interfaces/UniswapInterfaces.sol";
import './interfaces/IUniswapV2Router02.sol';

import 'hardhat/console.sol';

// https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IERC20.sol
// https://github.com/jklepatch/eattheblocks/blob/master/screencast/298-arbitrage-uniswap-sushiswap/contracts/UniswapV2Library.sol
// https://github.com/AlexNi245/moonbot-v1/blob/main/contracts/Executor.sol

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external;
}
contract FlashLottery is IUniswapV2Callee {

    // address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // address private constant UniswapV2Factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    //  sushi Router 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F
    address public factory;
    uint constant deadline = 100000 days;
    IUniswapV2Router02 public sushiRouter;


    address[] public playerPool; // players in current lottery
    mapping(address => uint) players; //player 
    address admin;
    uint public prizePool;

    uint constant maxEntriesPerPlayer = 50;

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

  constructor(address _factory, address _sushiRouter) public {
    factory = _factory;  
    sushiRouter = IUniswapV2Router02(_sushiRouter);
    admin = msg.sender;
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


    function flashSwapArb(address token0, address token1, uint amount0, uint amount1) external {
        address pair = IUniswapV2Factory(factory).getPair(token0, token1);
        require(pair != address(0), "pair doesn't exist");
        bytes memory data = abi.encode(token0, amount0, token1, amount1);
        IUniswapV2Pair(pair).swap(amount0, amount1, address(this), data);

    }

    function uniswapV2Call(
        address _sender,
        uint256 _amount0, 
        uint256 _amount1,
        bytes calldata _data
    ) external override {

        address[] memory path = new address[](2);

        uint amountToken = _amount0 == 0 ? _amount1 : _amount0;

        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        // console.log(token0, token1, "checks");
        // call uniswapv2factory to getpair 

        require(msg.sender == UniswapV2Library.pairFor(factory, token0, token1), 'caller is not pair contract'); 

        path[0] = _amount0 == 0 ? token1 : token0;
        path[1] = _amount0 == 0 ? token0 : token1;

        IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);

        token.approve(address(sushiRouter), amountToken);

        console.log("_amount0:", _amount0);
        console.log("_amount1:", _amount1);


        uint amountRequired = UniswapV2Library.getAmountsIn(
        factory, 
        amountToken,  
        path
        )[0]; 

        console.log("AmountToken:", amountToken);
        console.log("AmountRequired:", amountRequired);
        console.log("Path[0]:", path[0]);
        console.log("Path[1]:", path[1]);

        uint amountReceived = sushiRouter.swapExactTokensForTokens(
        amountToken, 
        amountRequired, 
        path, 
        msg.sender, 
        deadline
        )[1];

        console.log(amountReceived, "amountReceived");
        // console.log(tx.origin, admin, address(this), msg.sender);
        IERC20 otherToken = IERC20(_amount0 == 0 ? token0 : token1);
        otherToken.transfer(msg.sender, amountRequired);
        console.log(((amountReceived - amountRequired)), "profit");
        otherToken.transfer(admin, 1);


    }
}