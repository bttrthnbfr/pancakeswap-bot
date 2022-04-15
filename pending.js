require('dotenv').config()
const WebSocket = require('ws')
const { logType, transactionStatus } = require('./enums')
const { log, confirmYesNo, sleep } = require('./utils')
const ethers = require('ethers')
const configs = require('./configs')

class PancakeBot {
	constructor() {
		this.provider = null
		this.wallet = null
		this.blocknativeWs = null
		this.blocknativeWsConnectionId = null

		this.count = 0
		this.init()
	}

	async init() {
		this._initProvider()
		await this._initBlocknative()

		this.wallet = new ethers.Wallet(configs.userWalletPrivateKey, this.provider)
	}

	_initProvider() {
		this.provider = new ethers.providers.WebSocketProvider(configs.WSSProvider)

		this.provider._websocket.on('error', () => {
			log(`Unable to connect to ${configs.WSSProvider} retrying in 3s...`, logType.danger)
			setTimeout(this.initProvider, 3000)
		})
		this.provider._websocket.on('close', (code) => {
			log(`Connection lost with code ${code}! Attempting reconnect in 3s...`, logType.danger)
			this.provider._websocket.terminate()
			setTimeout(this.initProvider, 3000)
		})
	}

	async _initBlocknative() {
		this.blocknativeWs = new WebSocket(configs.WSSBlocknative, {
			perMessageDeflate: false,
		})

		this.blocknativeWs.on('error', () => {
			log(`Unable to connect to ${configs.WSSBlocknative} retrying in 3s...`, logType.danger)
			setTimeout(this.initBlocknative, 3000)
		})
		this.blocknativeWs.on('close', () => {
			log(`Connection Lost! Attempting reconnect in 3s...`, logType.danger)
			setTimeout(this.initBlocknative, 3000)
		})

		return new Promise((resolve) => {
			this.blocknativeWs.on('open', () => {
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

	_detectLiquidity(onLiquidityConfirmed) {
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

	_onLiquidityConfirmed(data) {
		const contractCall = data.event.contractCall
		console.log(contractCall)
	}

	async start() {
		this._detectLiquidity(this._onLiquidityConfirmed)
	}
}

const main = async () => {
	const pancakeBot = new PancakeBot()
	await pancakeBot.init()
	pancakeBot.start()
}

main()
