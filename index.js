require('dotenv').config()
const ethers = require('ethers')
const { pancakeSwapV2RouterAddress, targetTokenAddress } = require('./configs')
const configs = require('./configs')
const contractAbi = require('./contract-abi')

const provider = new ethers.providers.WebSocketProvider(configs.WSSProvider)
// const provider = new ethers.providers.JsonRpcProvider(configs.RPCProvider)

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
const contractTargetToken = new ethers.Contract(
	configs.targetTokenAddress,
	contractAbi.BEP20,
	provider
)
const contractWBNBToken = new ethers.Contract(
	configs.WBNBContractAddress,
	contractAbi.BEP20,
	provider
)

const _buyToken = async () => {
	console.log('hello world')
}

const _sellToken = async () => {
	// TODO add target price
	// TODO set stop loss

	console.log('hello world')
}

const _getBalanceOfPool = async (pair) => {
	const [balanceOfWBNB, balanceOfTargetToken] = await Promise.all([
		contractWBNBToken.balanceOf(pair),
		contractTargetToken.balanceOf(pair),
	])
	return {
		balanceOfWBNB: ethers.utils.formatEther(balanceOfWBNB),
		balanceOfTargetToken: ethers.utils.formatEther(balanceOfTargetToken),
	}
}

const _getPairFromLog = (log) => {
	const iface = new ethers.utils.Interface(contractAbi.pancakeswapV2Factory)
	const result = iface.parseLog(log)
	return result.args.pair
}

const _onLiquidityAdded = async (log) => {
	const pair = _getPairFromLog(log)
	const balanceOfPool = await _getBalanceOfPool(pair)
	console.log(balanceOfPool)

	// skip when the balance of pool is less than minimum liquidity added
	if (balanceOfPool.balanceOfWBNB < configs.minLiquidityWBNBAdded) {
		return
	}

	//TODO log balance of BNB
	//TODO log balance of target token

	//TODO add delay before buy

	//TODO buy price impact less than 1%

	await _buyToken()

	console.log(balanceOfPool)
}

const _detectLiquidity = async () => {
	const filter = contractPancakeswapV2Factory.filters.PairCreated(
		[configs.WBNBContractAddress, configs.targetTokenAddress],
		[configs.WBNBContractAddress, configs.targetTokenAddress]
	)
	provider.on(filter, _onLiquidityAdded)
}

const main = async () => {
	// _detectLiquidity()

	_onLiquidityAdded({
		blockNumber: 18022152,
		blockHash: '0xf50232c38a6f19183a017b17749c135176d80173bcd0f58cbf13dcc4d729f3e3',
		transactionIndex: 0,
		removed: false,
		address: '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc',
		data: '0x00000000000000000000000019dc5d5e7c5b5ce903a680201d40e160eabecd3c0000000000000000000000000000000000000000000000000000000000025f5e',
		topics: [
			'0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9',
			'0x0000000000000000000000001063f8cfac351d530fa8935ec3513969ea99f0c9',
			'0x000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd',
		],
		transactionHash: '0xfebe5ac6af1d6d68fa02bf500dae375d01b07fec493375fb5611266aa20b45e5',
		logIndex: 1,
	})

	// const balanceOfPool = await _getBalanceOfPool()
	//
	// const amountsOutResult = await contractPancakeswapV2Router.getAmountsOut(
	// 	ethers.utils.parseUnits('0.0001'),
	// 	[configs.WBNBContractAddress, configs.targetTokenAddress]
	// )
	// const ammountOfTargetToken = amountsOutResult[1]

	// const ammountOfWBNB = 0.1
	// const balanceOfPool = {
	// 	balanceOfWBNB: 2000000,
	// 	balanceOfTargetToken: 1000,
	// }
	//
	// const constantPriceOfPool = balanceOfPool.balanceOfTargetToken * balanceOfPool.balanceOfWBNB
	// const totalTargetTokenAfterAddedWBNB =
	// 	constantPriceOfPool / (balanceOfPool.balanceOfWBNB + ammountOfWBNB)
	// const priceImpact =
	// 	100 - (100 / balanceOfPool.balanceOfTargetToken) * totalTargetTokenAfterAddedWBNB
	//
	// console.log(priceImpact)
}

main()
