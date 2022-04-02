const chalk = require('chalk')
const readline = require('readline')
const { logType } = require('./enums')

const log = (str, type) => {
	switch (type) {
		case logType.ok:
			console.log(chalk.green(str))
			break

		case logType.danger:
			console.log(chalk.red(str))
			break
	}
}

const confirmYesNo = async (str) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise((r, j) => {
		rl.question(`${str} (y/n) `, (answer) => {
			if (answer === 'y') {
				r()
			} else {
				process.exit(1)
			}
		})
	})
}

const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
	log,
	confirmYesNo,
	sleep,
}
