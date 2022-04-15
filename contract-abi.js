const pancakeswapV2Factory = [
	'constructor(address _feeToSetter)',
	'function INIT_CODE_PAIR_HASH() view returns (bytes32)',
	'function allPairs(uint256) view returns (address)',
	'function allPairsLength() view returns (uint256)',
	'function createPair(address tokenA, address tokenB) returns (address pair)',
	'function feeTo() view returns (address)',
	'function feeToSetter() view returns (address)',
	'function getPair(address, address) view returns (address)',
	'function setFeeTo(address _feeTo)',
	'function setFeeToSetter(address _feeToSetter)',

	'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)', // this event is used to detect added liquidity
]

const pancakeswapV2Router = [
	'constructor(address _factory, address _WETH)',
	'function WETH() view returns (address)',

	'function factory() view returns (address)',

	'function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountIn)',
	'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountOut)',
	'function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)',
	'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',

	'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) pure returns (uint256 amountB)',

	'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256, amountB, uint256 liquidity)',

	'function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',

	'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
	'function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) returns (uint256 amountToken, uint256 amountETH)',
	'function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) returns (uint256 amountETH)',
	'function removeLiquidityETHWithPermit(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) returns ( uint256 amountToken, uint256 amountETH)',
	'function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) returns (uint256 amountETH)',
	'function removeLiquidityWithPermit(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) returns (uint256 amountA, uint256 amountB)',

	'function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
	'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
	'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable',
	'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
	'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
	'function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
]

const BEP20 = [
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'function allowance(address _owner, address spender) view returns (uint256)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function balanceOf(address account) view returns (uint256)',
	'function decimals() view returns (uint256)',
	'function getOwner() view returns (address)',
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function totalSupply() view returns (uint256)',
	'function transfer(address recipient, uint256 amount) returns (bool)',
	'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
]

module.exports = {
	pancakeswapv2router,
	pancakeswapv2factory,
	bep20,
}
