const ethers = require('ethers')

// console.log(ethers.utils.parseUnits('0.1'))
// console.log(ethers.utils.parseEther('0.1'))

// const res = ethers.utils.parseUnits('1000').div(ethers.utils.parseUnits('10'))
// console.log(res.toString())

const res = ethers.utils.parseEther('1', 18)
console.log(JSON.stringify(res))
