require('dotenv').config()
const ethers = require('ethers')
const configs = require('./configs')

const provider = new ethers.providers.WebSocketProvider(configs.WSSProvider)

const _detectLiquidity = async () => {
	console.log('hello world')
}

const _buyToken = async () => {
	console.log('hello world')
}

const _sellToken = async () => {
	console.log('hello world')
}

const main = async () => {
	console.log(configs)
}

main()
