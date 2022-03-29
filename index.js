require('dotenv').config()
const ethers = require('ethers')
const configs = require('./configs')
const contractAbi = require('./contract-abi')

const provider = new ethers.providers.WebSocketProvider(configs.WSSProvider)

const contractPancakeswapV2Router = new ethers.Contract(
	configs.pancakeSwapV2RouterAddress,
	contractAbi.pancakeswapV2Router,
	provider
)
const contractPancakeswapV2Factory = new ethers.Contract(
	configs.pancakeSwapV2FactoryAddress,
	contractAbi.pancakeswapV2Factory,
	provider
)

const _buyToken = async () => {
	console.log('hello world')
}

const _sellToken = async () => {
	console.log('hello world')
}

const _onLiquidityAdded = (log) => {
	// detect total BNB
	// if total > min BNB then buy
	// buy token here
	console.log(log)
}

const _detectLiquidity = async () => {
	const filter = contractPancakeswapV2Factory.filters.PairCreated(
		configs.BNBContractAddress,
		configs.targetTokenAddress
	)
	provider.on(filter, _onLiquidityAdded)
}

const main = async () => {
	_detectLiquidity()
}

main()
