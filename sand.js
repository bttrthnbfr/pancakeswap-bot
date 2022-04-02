const ethers = require('ethers')
const { confirmYesNo } = require('./utils')

const main = async () => {
	await confirmYesNo('yes')
}

main()
