const logType = Object.freeze({
	ok: 'ok',
	danger: 'danger',
})

const transactionStatus = Object.freeze({
	pending: 'pending',
	confirmed: 'confirmed',
})

module.exports = {
	logType,
	transactionStatus,
}
