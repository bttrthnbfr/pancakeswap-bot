require('dotenv').config()
const ethers = require('ethers')
const configs = require('./configs')
const contractAbi = require('./contract-abi')

const provider = new ethers.providers.WebSocketProvider(configs.WSSProvider)
// const provider = new ethers.providers.JsonRpcProvider(configs.RPCProvider)

// TODO
// buy process
// sell process
// - set target price
// - set loss price
// token information
// - honeypot checker before add new token
// - tax checker before add token
// alert
// - when the price is lower send to telegram

const _contractFactory = (dataContracts) => {
	const results = []
	for (const dataContract of dataContracts) {
		results.push(new ethers.Contract(dataContract.address, dataContract.contractAbi, provider))
	}
	return results
}

const [
	contractPancakeswapV2Router,
	contractPancakeswapV2Factory,
	contractTargetToken,
	contractWBNBToken,
] = _contractFactory([
	{
		address: configs.pancakeSwapV2RouterAddress,
		contractAbi: contractAbi.pancakeswapV2Router,
	},
	{
		address: configs.pancakeSwapV2FactoryAddress,
		contractAbi: contractAbi.pancakeswapV2Factory,
	},
	{
		address: configs.targetTokenAddress,
		contractAbi: contractAbi.BEP20,
	},
	{
		address: configs.WBNBContractAddress,
		contractAbi: contractAbi.BEP20,
	},
])

const _buyToken = async (minAmountOutInValue) => {
	const tx = contractPancakeswapV2Router.swapExactTokensForTokens(
		ethers.utils.parseEther(configs.amountOfWBNB),
		minAmountOutInValue,
		[configs.WBNBContractAddress, configs.targetTokenAddress],
		configs.userWalletAddress
	)
	await tx.wait()
	return tx
}

const _sellToken = async () => {
	const tx = contractPancakeswapV2Router.swapExactTokensForTokens(
		amountInInValue,
		minAmountOutInValue,
		[configs.targetTokenAddress, configs.WBNBContractAddress],
		configs.userWalletAddress
	)
	await tx.wait()
	return tx
}

const _approveWBNB = async () => {
	console.log('approve wbnb')
}

const _getBalanceOfPool = async (pair) => {
	const [balanceOfWBNB, balanceOfTargetToken] = await Promise.all([
		contractWBNBToken.balanceOf(pair),
		contractTargetToken.balanceOf(pair),
	])
	return {
		balanceOfWBNB: parseFloat(ethers.utils.formatEther(balanceOfWBNB)),
		balanceOfTargetToken: parseFloat(ethers.utils.formatEther(balanceOfTargetToken)),
	}
}

const _getPairFromLog = (log) => {
	const iface = new ethers.utils.Interface(contractAbi.pancakeswapV2Factory)
	const result = iface.parseLog(log)
	return result.args.pair
}

const _getAmountOutTargetToken = async () => {
	const amountsOutResult = await contractPancakeswapV2Router.getAmountsOut(
		ethers.utils.parseUnits(configs.amountOfWBNB.toString()),
		[configs.WBNBContractAddress, configs.targetTokenAddress]
	)
	let amountOfTargetToken = amountsOutResult[1]
	amountOfTargetToken = ethers.utils.formatEther(amountOfTargetToken)
	amountOfTargetToken = parseFloat(amountOfTargetToken)

	return amountOfTargetToken
}

const _getPriceImpact = (balanceOfPool, amountOfTargetToken) => {
	const marketPriceTargetTokenPerWBNB =
		balanceOfPool.balanceOfTargetToken / balanceOfPool.balanceOfWBNB
	const amountOfMarketPriceTargetToken = configs.amountOfWBNB * marketPriceTargetTokenPerWBNB

	// this price impact is calculate from first added liquidity
	const priceImpact = 100 - (amountOfTargetToken / amountOfMarketPriceTargetToken) * 100

	return priceImpact
}

const _getMinAmountOut = (amount) => {
	return amount - (amount / 100) * configs.slipppagePercentage
}

const buyOnLiquidityAdded = async (log) => {
	const pair = _getPairFromLog(log)
	const [balanceOfPool, amountOfTargetToken] = await Promise.all([
		_getBalanceOfPool(pair),
		_getAmountOutTargetToken(),
	])
	const priceImpact = _getPriceImpact(balanceOfPool, amountOfTargetToken)

	console.log(amountOfTargetToken)
	console.log(priceImpact)

	// skip when the balance of pool is less than minimum liquidity added
	if (balanceOfPool.balanceOfWBNB < configs.minLiquidityWBNBAdded) {
		return
	}

	// skip when the price impact is higher than the limit, the default limit is 1%
	if (priceImpact > configs.priceImpactTolerancePercentage) {
		return
	}

	const mintAmountOut = _getMinAmountOut(amountOfTargetToken)
	await _buyToken(mintAmountOut)
}

const _detectLiquidity = async () => {
	const filter = contractPancakeswapV2Factory.filters.PairCreated(
		[configs.WBNBContractAddress, configs.targetTokenAddress],
		[configs.WBNBContractAddress, configs.targetTokenAddress]
	)
	provider.on(filter, buyOnLiquidityAdded)
}

const main = async () => {
	// _detectLiquidity()

	buyOnLiquidityAdded({
		blockNumber: 18038846,
		blockHash: '0x4407baacb15c34d6fe38a4a7a41a55e6008a5fff4ab9b5c5eef90774d27883b3',
		transactionIndex: 1,
		removed: false,
		address: '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc',
		data: '0x000000000000000000000000f3dc9cde2febf8df300ec1256def3fb03eb22507000000000000000000000000000000000000000000000000000000000002612b',
		topics: [
			'0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9',
			'0x0000000000000000000000006fdbf666474d41a7f93ff634eb74b059cac5411b',
			'0x000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd',
		],
		transactionHash: '0x2d6c89356ecbd3454ae4c2da0c5057fb428ff5e7860986667854517ef2e3bf46',
		logIndex: 3,
	})
}

main()
