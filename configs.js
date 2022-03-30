const configs = {
	userWalletAddress: process.env.USER_WALLET_ADDRESS, // you wallet address
	userWalletPrivateKey: process.env.USER_WALLET_PRIVATE_KEY,

	targetTokenAddress: process.env.TARGET_TOKEN_ADDRESS, // target of token that you will buy
	minLiquidityWBNBAdded: process.env.MIN_LIQUIDITY_WBNB_ADDED, // min liquidity of the target token
	slipppagePercentage: process.env.SLIPPAGE_PERCENTAGE, // if the target token price has been reached the slippage, the bot will sell that token

	gasPrice: process.env.GAS_PRICE,
	buyTokenGasLimit: process.env.BUY_TOKEN_GAS_LIMIT, // default minimum transaction

	BNBContractAddress: process.env.BNB_CONTRACT_ADDRESS,
	WBNBContractAddress: process.env.WBNB_CONTRACT_ADDRESS,
	ammountOfWBNB: process.env.AMMOUNT_OF_WBNB, // how much you want to buy

	pancakeSwapV2FactoryAddress: process.env.PANCAKE_SWAP_V2_FACTORY_ADDRESS,
	pancakeSwapV2RouterAddress: process.env.PANCAKE_SWAP_V2_ROUTER_ADDRESS,

	WSSProvider: process.env.WSS_PROVIDER,
	RPCProvider: process.env.RPC_PROVIDER,
}

module.exports = configs
