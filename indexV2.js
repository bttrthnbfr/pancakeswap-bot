require('dotenv').config()
const WebSocket = require('ws')

const bigDecimal = require('js-big-decimal')
const ethers = require('ethers')
const { logType, transactionStatus } = require('./enums')
const { log, confirmYesNo, sleep } = require('./utils')
const configs = require('./configs')
const contractAbi = require('./contract-abi')
const { getTokenInformation, getHoneypotChecker } = require('./repo')
const { amountOfWBNB } = require('./configs')

class PancakeBot {
	constructor() {
		this.provider = null
		this.wallet = null
		this.blocknativeWs = null
		this.blocknativeWsConnectionId = null

		this.contractPancakeswapV2Router = null
		this.contractPancakeswapV2Factory = null
		this.contractTargetToken = null
		this.contractWBNBToken = null

		this.targetTokenPairAddress = null
		this.targetTokenDecimal = null
		this.WBNBTokenDecimal = null

		this.isTheTargetTokenAlreadyBought = false
	}

	async init() {
		this._initProvider()
		this.wallet = new ethers.Wallet(configs.userWalletPrivateKey, this.provider)

		const [
			contractPancakeswapV2Router,
			contractPancakeswapV2Factory,
			contractTargetToken,
			contractWBNBToken,
		] = this._contractFactory([
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

		this.contractPancakeswapV2Router = contractPancakeswapV2Router
		this.contractPancakeswapV2Factory = contractPancakeswapV2Factory
		this.contractTargetToken = contractTargetToken
		this.contractWBNBToken = contractWBNBToken
	}

	_contractFactory(dataContracts) {
		const results = []
		for (const dataContract of dataContracts) {
			results.push(
				new ethers.Contract(dataContract.address, dataContract.contractAbi, this.provider)
			)
		}
		return results
	}

	_initProvider() {
		this.provider = new ethers.providers.WebSocketProvider(configs.WSSProvider)

		this.provider._websocket.on('error', () => {
			log(`Unable to connect to ${configs.WSSProvider} retrying in 3s...`, logType.danger)
			setTimeout(this._initProvider, 3000)
		})
		this.provider._websocket.on('close', (code) => {
			log(`Connection lost with code ${code}! Attempting reconnect in 3s...`, logType.danger)
			this.provider._websocket.terminate()
			setTimeout(this._initProvider, 3000)
		})
	}

	async _initBlocknative(cbOnReconnect) {
		this.blocknativeWs = new WebSocket(configs.WSSBlocknative, {
			perMessageDeflate: false,
		})

		this.blocknativeWs.on('error', () => {
			log(`Unable to connect to ${configs.WSSBlocknative} retrying in 3s...`, logType.danger)
			setTimeout(cbOnReconnect, 3000)
		})
		this.blocknativeWs.on('close', () => {
			log(`Connection Lost! Attempting reconnect in 3s...`, logType.danger)
			setTimeout(cbOnReconnect, 3000)
		})

		return new Promise((resolve) => {
			this.blocknativeWs.on('open', () => {
				log(`Connection ${configs.WSSBlocknative} is open`, logType.ok)
				resolve()
			})
		})
	}

	_subscribeTxMsg() {
		return JSON.stringify({
			timeStamp: new Date().toISOString(),
			dappId: configs.BlocknativeDAPPID,
			version: '4.1.0',
			appName: 'Mempool Explorer',
			appVersion: '1.30.11',
			blockchain: {
				system: 'ethereum',
				network: 'bsc-main',
			},
			categoryCode: 'configs',
			eventCode: 'put',
			config: {
				scope: configs.pancakeSwapV2FactoryAddress,
				filters: [
					{
						_join: 'OR',
						terms: [
							{
								'contractCall.methodName': 'addLiquidity',
							},
							{
								'contractCall.methodName': 'addLiquidityETH',
							},
						],
					},
					{
						'contractCall.params.token': configs.targetTokenAddress,
					},
				],
				watchAddress: true,
			},
		})
	}

	_getUniqueId() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1)
		}
		return s4() + s4() + '-' + s4()
	}

	_initConnectionMsg() {
		return JSON.stringify({
			timeStamp: '2022-04-15T15:41:12.485Z',
			dappId: configs.BlocknativeDAPPID,
			version: '4.1.0',
			appName: 'Mempool Explorer',
			appVersion: '1.30.11',
			blockchain: { system: 'ethereum', network: 'bsc-main' },
			categoryCode: 'initialize',
			eventCode: 'checkDappId',
			connectionId: this._getUniqueId(),
		})
	}

	_parseMsg(msg) {
		let msgObj = {}
		try {
			msgObj = JSON.parse(msg)
		} catch (_) {
			return null
		}

		let txStatus = msgObj?.event?.transaction?.status?.valueOf() ?? ''
		if (txStatus === transactionStatus.pending || txStatus === transactionStatus.confirmed) {
			return msgObj
		}
		return null
	}

	async _detectLiquidity(onLiquidityConfirmed) {
		const exec = async () => {
			await this._initBlocknative(exec)

			log('Detecting liquidity..', logType.ok)
			this.blocknativeWs.send(this._initConnectionMsg())
			this.blocknativeWs.send(this._subscribeTxMsg())
			this.blocknativeWs.on('message', (msg) => {
				const parseMsg = this._parseMsg(msg)
				if (parseMsg) {
					if (parseMsg.event.transaction.status === transactionStatus.pending) {
						log('Detected transaction still pending..', logType.ok)
					} else {
						log('Detected transaction confirmed..', logType.ok)
						onLiquidityConfirmed(parseMsg)
					}
				}
			})
		}
		await exec()
	}

	async _isWBNBApproved() {
		const [allowance, balanceWBNBOfUser] = await Promise.all([
			this.contractWBNBToken.allowance(
				configs.userWalletAddress,
				configs.pancakeSwapV2RouterAddress
			),
			this.contractWBNBToken.balanceOf(configs.userWalletAddress),
		])
		if (allowance.lt(balanceWBNBOfUser)) {
			return false
		}

		return true
	}

	async _isTargetTokenApproved() {
		const [allowance, balanceTargetTokenOfUser] = await Promise.all([
			this.contractTargetToken.allowance(configs.userWalletAddress, configs.targetTokenAddress),
			this.contractTargetToken.balanceOf(configs.userWalletAddress),
		])

		if (allowance.lt(balanceTargetTokenOfUser)) {
			return false
		}

		return true
	}

	async _getTokenInformation() {
		let tokenInformation
		try {
			tokenInformation = await getTokenInformation(configs.targetTokenAddress)
			if (tokenInformation.ABI === 'Contract source code not verified') {
				return false
			}
		} catch (_) {
			return false
		}
		return tokenInformation
	}

	async _getHoneypotChecker() {
		let honeypotChecker
		try {
			honeypotChecker = await getHoneypotChecker(configs.targetTokenAddress)
		} catch (e) {
			return false
		}
		return honeypotChecker
	}

	async _approveWBNB() {
		const tx = await this.contractWBNBToken.connect(this.wallet).approve(
			configs.pancakeSwapV2RouterAddress,
			'115792089237316195423570985008687907853269984665640564039457584007913129639935' // max approve
		)
		await tx.wait()
		return tx
	}
	async _approveTargetToken() {
		const tx = await this.contractTargetToken.connect(this.wallet).approve(
			configs.pancakeSwapV2RouterAddress,
			'115792089237316195423570985008687907853269984665640564039457584007913129639935' // max approve
		)
		await tx.wait()
		return tx
	}

	async _getTargetTokenPairAddress() {
		const pairAddress = await this.contractPancakeswapV2Factory.getPair(
			configs.targetTokenAddress,
			configs.WBNBContractAddress
		)

		return pairAddress
	}

	async _getBalanceOfPool(pair) {
		const [balanceOfWBNB, balanceOfTargetToken] = await Promise.all([
			this.contractWBNBToken.balanceOf(pair),
			this.contractTargetToken.balanceOf(pair),
		])
		return {
			balanceOfWBNB: balanceOfWBNB,
			balanceOfTargetToken: balanceOfTargetToken,
		}
	}

	async _getAmountOutTargetToken() {
		const amountsOutResult = await this.contractPancakeswapV2Router.getAmountsOut(
			configs.amountOfWBNB,
			[configs.WBNBContractAddress, configs.targetTokenAddress]
		)
		let amountOfTargetToken = amountsOutResult[1]
		return amountOfTargetToken
	}

	_getPriceImpactInPercentage(balanceOfPool, amountOfTargetToken) {
		const marketPriceTargetTokenPerWBNB = bigDecimal.divide(
			balanceOfPool.balanceOfTargetToken.toString(),
			balanceOfPool.balanceOfWBNB.toString()
		)
		const amountOfMarketPriceTargetToken = bigDecimal.multiply(
			configs.amountOfWBNB.toString(),
			marketPriceTargetTokenPerWBNB
		)

		const priceImpact = bigDecimal.subtract(
			100,
			bigDecimal.multiply(
				bigDecimal.divide(amountOfTargetToken.toString(), amountOfMarketPriceTargetToken),
				100
			)
		)

		return parseFloat(bigDecimal.round(priceImpact, 2))
	}

	_getMinAmountOut(amount) {
		const res = bigDecimal.multiply(
			bigDecimal.divide(amount.toString(), 100),
			100 - configs.slipppagePercentage
		)
		return bigDecimal.floor(res)
	}

	async _buyToken(minAmountOutIn) {
		const tx = await this.contractPancakeswapV2Router
			.connect(this.wallet)
			.swapExactTokensForTokens(
				configs.amountOfWBNB,
				minAmountOutIn,
				[configs.WBNBContractAddress, configs.targetTokenAddress],
				configs.userWalletAddress,
				this._getTimeDeadline(),
				{
					gasLimit: configs.buyTokenGasLimit,
					gasPrice: configs.gasPrice,
					nonce: null,
				}
			)
		await tx.wait()
		return tx
	}

	async _sellToken(amountOfTargetToken, minAmountOutIn) {
		const tx = await this.contractPancakeswapV2Router
			.connect(this.wallet)
			.swapExactTokensForTokens(
				amountOfTargetToken,
				minAmountOutIn,
				[configs.targetTokenAddress, configs.WBNBContractAddress],
				configs.userWalletAddress,
				this._getTimeDeadline(),
				{
					gasLimit: configs.sellTokenGasLimit,
					gasPrice: configs.gasPrice,
					nonce: null,
				}
			)
		await tx.wait()
		return tx
	}

	_getTimeDeadline() {
		return Date.now() + configs.transactionDeadlineInSecond
	}

	async informationAndValidation() {
		log('Getting config & token information..\n', logType.ok)
		const [
			WBNBDecimal,
			targetTokenDecimal,
			targetTokenName,
			targetTokenSymbol,
			targetTokenTotalSupply,
			balanceWBNBOfUser,
			isWBNBApproved,
			isTargetTokenApproved,
			tokenInformation,
			honeypotChecker,
			targetTokenPairAddress,
		] = await Promise.all([
			this.contractWBNBToken.decimals(),
			this.contractTargetToken.decimals(),
			this.contractTargetToken.name(),
			this.contractTargetToken.symbol(),
			this.contractTargetToken.totalSupply(),
			this.contractWBNBToken.balanceOf(configs.userWalletAddress),
			this._isWBNBApproved(),
			this._isTargetTokenApproved(),
			this._getTokenInformation(),
			this._getHoneypotChecker(),
			this._getTargetTokenPairAddress(),
		])

		log(`User wallet address: ${configs.userWalletAddress}`, logType.ok)
		log(
			`User WBNB balance: ${balanceWBNBOfUser} (Unit) | ${ethers.utils.formatUnits(
				balanceWBNBOfUser,
				WBNBDecimal
			)} (decimal)\n`,
			logType.ok
		)
		log(
			`Amount of WBNB: ${configs.amountOfWBNB} (Unit) | ${ethers.utils.formatUnits(
				configs.amountOfWBNB,
				WBNBDecimal
			)} (decimal)`,
			logType.ok
		)
		log(`WBNB contract address: ${configs.WBNBContractAddress}`, logType.ok)
		log(
			`Min liqudity added: ${configs.minLiquidityWBNBAdded} (Unit) | ${ethers.utils.formatUnits(
				configs.minLiquidityWBNBAdded,
				WBNBDecimal
			)} (decimal)`,
			logType.ok
		)
		log(`Price impact tolerance: ${configs.priceImpactToleranceInPercentage}%`, logType.ok)
		log(`Transaction deadline: ${configs.transactionDeadlineInSecond}s`, logType.ok)
		log(
			`Gas price: ${configs.gasPrice} (Unit) | ${ethers.utils.formatUnits(
				configs.gasPrice,
				'gwei'
			)} (GWEI)`,
			logType.ok
		)
		log(`Buy token gas limit: ${configs.buyTokenGasLimit}`, logType.ok)
		log(`Sell token gas limit: ${configs.sellTokenGasLimit}`, logType.ok)
		log(`Pancakeswap V2 factory address: ${configs.pancakeSwapV2FactoryAddress}`, logType.ok)
		log(`Pancakeswap V2 router address: ${configs.pancakeSwapV2RouterAddress}`, logType.ok)
		log(`WSS provider: ${configs.WSSProvider}\n`, logType.ok)

		log(`Target token address: ${configs.targetTokenAddress}`, logType.ok)
		log(`Target token name: ${targetTokenName}`, logType.ok)
		log(`Target token symbol: ${targetTokenSymbol}`, logType.ok)
		log(`Target token decimal: ${targetTokenDecimal}`, logType.ok)
		log(
			`Target token total supply: ${targetTokenTotalSupply} (unit) | ${ethers.utils.formatUnits(
				targetTokenTotalSupply,
				targetTokenDecimal
			)} (decimal)\n`,
			logType.ok
		)

		if (tokenInformation) {
			log(`Is contract verified: TRUE`, logType.ok)
			log(`Contract name: ${tokenInformation.ContractName}`, logType.ok)
			log(`Compiler version: ${tokenInformation.CompilerVersion}`, logType.ok)
			log(`Runs: ${tokenInformation.Runs}\n`, logType.ok)
		} else {
			log(`Is contract verified: FALSE\n`, logType.danger)
		}

		if (balanceWBNBOfUser.lt(configs.amountOfWBNB)) {
			log(
				`Validation error: balance of amount WBNB is less than balance of user WBNB`,
				logType.danger
			)
			log('exiting..\n', logType.danger)
			process.exit(1)
		}

		if (honeypotChecker) {
			log(`Honeypot checker..`, logType.ok)
			log(
				`Is honeypot: ${honeypotChecker.IsHoneypot}`,
				honeypotChecker.IsHoneypot ? logType.danger : logType.ok
			)
			log(
				`Buy tax: ${honeypotChecker.BuyTax}%`,
				honeypotChecker.BuyTax > configs.maxBuyTax ? logType.danger : logType.ok
			)
			log(
				`Sell tax: ${honeypotChecker.SellTax}%`,
				honeypotChecker.SellTax > configs.maxSellTax ? logType.danger : logType.ok
			)

			log(`Buy gas: ${honeypotChecker.BuyGas}`, logType.ok)
			log(`Sell gas: ${honeypotChecker.SellGas}`, logType.ok)

			if (configs.buyTokenGasLimit <= honeypotChecker.BuyGas) {
				log('Buy gas limit is less than honeypot simulation checker', logType.danger)
			}

			if (configs.sellTokenGasLimit <= honeypotChecker.SellGas) {
				log('Sell gas limit is less than honeypot simulation checker', logType.danger)
			}
			log(`\n`, logType.ok)
		} else {
			log('Honeypot checker failed\n', logType.danger)
		}

		if (!isWBNBApproved) {
			log('WBNB is no approved', logType.ok)
			log('Approving WBNB..', logType.ok)
			let txApprove
			try {
				txApprove = await this._approveWBNB()
			} catch (error) {
				const txError = JSON.parse(JSON.stringify(error))
				log(`Error TX approve WBNB: ${txError.transactionHash} | ${txError.reason}`, logType.danger)
				log('exiting..\n', logType.danger)
				return
			}
			log(`TX approve WBNB success: ${txApprove.hash}\n`, logType.ok)
		}
		if (!isTargetTokenApproved) {
			log('Target token is no approved', logType.ok)
			log('Approving target token..', logType.ok)
			let txApprove
			try {
				txApprove = await this._approveTargetToken()
			} catch (error) {
				const txError = JSON.parse(JSON.stringify(error))
				log(`Error TX approve WBNB: ${txError.transactionHash} | ${txError.reason}`, logType.danger)
				log('exiting..\n', logType.ok)
				return
			}
			log(`TX approve target token success: ${txApprove.hash}\n`, logType.ok)
		}

		if (targetTokenPairAddress !== '0x0000000000000000000000000000000000000000') {
			log(`Pair address liquidity of target token is already created`, logType.danger)
		}

		await confirmYesNo('Continue process the target?')
		log(`\n`, logType.ok)
		this._detectLiquidity()
	}

	async _onLiquidityConfirmed(data) {
		log('Liquidity is detected\n', logType.ok)
		log('Getting balance of liquidity..\n', logType.ok)
		const [balanceOfPool, amountOfTargetToken] = await Promise.all([
			this._getBalanceOfPool(this.targetTokenPairAddress),
			this._getAmountOutTargetToken(),
		])
		log(
			`Balance of pool target token: ${
				balanceOfPool.balanceOfTargetToken
			} (Unit) | ${ethers.utils.formatUnits(
				balanceOfPool.balanceOfTargetToken,
				this.targetTokenDecimal
			)} (Decimal)`,
			logType.ok
		)
		log(
			`Balance of pool WBNB: ${balanceOfPool.balanceOfWBNB} (Unit) | ${ethers.utils.formatUnits(
				balanceOfPool.balanceOfWBNB,
				this.WBNBDecimal
			)} (Decimal)`,
			logType.ok
		)

		if (balanceOfPool.balanceOfTargetToken.eq(ethers.utils.parseUnits('0'))) {
			log(`Validation error: balance of pool target token is zero`, logType.danger)
			log('exiting..\n', logType.ok)
			return
		}

		// skip when the balance of pool is less than minimum liquidity added
		if (balanceOfPool.balanceOfWBNB.lt(configs.minLiquidityWBNBAdded)) {
			log(
				`Validation error: balance of WBNB is less than min liquidity WBNB added (${balanceOfPool.balanceOfWBNB} < ${configs.minLiquidityWBNBAdded})`,
				logType.danger
			)
			log('exiting..\n', logType.ok)
			return
		}

		const priceImpactInPercentage = this._getPriceImpactInPercentage(
			balanceOfPool,
			amountOfTargetToken
		)
		log(`Price impact: ${priceImpactInPercentage}%\n`, logType.ok)
		if (priceImpactInPercentage > configs.priceImpactToleranceInPercentage) {
			log(
				`Validation error: price impact is higher than the limit (${priceImpactInPercentage}% > ${configs.priceImpactToleranceInPercentage}%)`,
				logType.danger
			)
			log('exiting..\n', logType.ok)
			return
		}

		// sleep before buy
		log(`Sleep for ${configs.sleepBeforeBuyInMiliSecond}ms ..`, logType.ok)
		await sleep(configs.sleepBeforeBuyInMiliSecond)

		const mintAmountOut = this._getMinAmountOut(amountOfTargetToken)
		log('Process buy token..\n', logType.ok)
		log(
			`Amount in: ${configs.amountOfWBNB} (Unit) | ${ethers.utils.formatUnits(
				configs.amountOfWBNB,
				this.WBNBDecimal
			)} (Decimal)`,
			logType.ok
		)
		log(
			`Min amount out (calculate with slippage): ${mintAmountOut} (Unit) | ${ethers.utils.formatUnits(
				mintAmountOut,
				this.targetTokenDecimal
			)} (Decimal)\n`,
			logType.ok
		)

		let txBuy
		try {
			txBuy = await this._buyToken(mintAmountOut)
		} catch (error) {
			console.log(error)
			const txError = JSON.parse(JSON.stringify(error))
			log(`Error TX buy token: ${txError.transactionHash} | ${txError.reason}`, logType.danger)
			log('exiting..\n', logType.ok)
			return
		}
		log(`TX buy success: ${txBuy.hash}\n`, logType.ok)
		this.isTheTargetTokenAlreadyBought = true
	}

	async start() {
		await this.informationAndValidation()
		await confirmYesNo('Continue process the target?')
		log(`\n`, logType.ok)
		this._detectLiquidity()
	}
}

const main = async () => {
	const pancakeBot = new PancakeBot()
	pancakeBot.init()
	pancakeBot.start()
}

main()
