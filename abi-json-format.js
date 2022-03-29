const { Interface, FormatTypes } = require('@ethersproject/abi')

const jsonAbi = []

const iface = new Interface(jsonAbi)
console.log(iface.format(FormatTypes.full))
