const chalk = require('chalk')
const Confirm = require('prompt-confirm')
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
	return new Promise((r) => {
		new Confirm(str).run().then((answer) => {
			if (answer) {
				r()
			} else {
				process.exit(1)
			}
		})
	})
}

module.exports = {
	log,
	confirmYesNo,
}
