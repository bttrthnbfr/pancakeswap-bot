const axios = require('axios')
const configs = require('./configs')

const getTokenInformation = (contractAddress) => {
	const config = {
		method: 'get',
		url: `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${configs.BSCApiKey}`,
		headers: {},
	}

	return new Promise((resolve, reject) => {
		axios(config)
			.then(function (response) {
				const data = response.data.result
				resolve(data[0])
			})
			.catch(function (error) {
				reject(error)
			})
	})
}

const getHoneypotChecker = async (contractAddress) => {
	const config = {
		method: 'get',
		url: `https://aywt3wreda.execute-api.eu-west-1.amazonaws.com/default/IsHoneypot?chain=bsc2&token=${contractAddress}`,
		headers: {},
	}

	return new Promise((resolve, reject) => {
		axios(config)
			.then(function (response) {
				const data = response.data
				resolve(data)
			})
			.catch(function (error) {
				console.log(error)
				reject(error)
			})
	})
}

module.exports = {
	getTokenInformation,
	getHoneypotChecker,
}
