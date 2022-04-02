const { parseUnits } = require('@ethersproject/units')
const ethers = require('ethers')
const configs = {
	userWalletAddress: process.env.USER_WALLET_ADDRESS, // you wallet address
	userWalletPrivateKey: process.env.USER_WALLET_PRIVATE_KEY,

	targetTokenAddress: process.env.TARGET_TOKEN_ADDRESS, // target of token that you will buy

	amountOfWBNB: ethers.utils.parseUnits(process.env.AMOUNT_OF_WBNB, 'ether'), // how much you want to buy
	minLiquidityWBNBAdded: ethers.utils.parseUnits(process.env.MIN_LIQUIDITY_WBNB_ADDED, 'ether'), // min liquidity of the target token
	slipppagePercentage: process.env.SLIPPAGE_PERCENTAGE, // if the target token price has been reached the slippage, the bot will sell that token
	priceImpactToleranceInPercentage: parseFloat(process.env.PRICE_IMPACT_TOLERANCE_IN_PERCENTAGE),
	transactionDeadlineInSecond: parseInt(process.env.TRANSACTION_DEADLINE_IN_SECOND),
	sleepBeforeBuyInMiliSecond: parseInt(process.env.SLEEP_BEFORE_BUY_IN_MILI_SECOND),

	gasPrice: ethers.utils.parseUnits(process.env.GAS_PRICE_IN_GWEI, 'gwei'),
	buyTokenGasLimit: process.env.BUY_TOKEN_GAS_LIMIT, // default minimum transaction
	sellTokenGasLimit: process.env.SELL_TOKEN_GAS_LIMIT, // default minimum transaction

	WBNBContractAddress: process.env.WBNB_CONTRACT_ADDRESS,

	pancakeSwapV2FactoryAddress: process.env.PANCAKE_SWAP_V2_FACTORY_ADDRESS,
	pancakeSwapV2RouterAddress: process.env.PANCAKE_SWAP_V2_ROUTER_ADDRESS,

	WSSProvider: process.env.WSS_PROVIDER,

	BSCApiKey: process.env.BSC_API_KEY,
}

module.exports = configs
