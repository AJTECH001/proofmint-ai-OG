// String formatting functions for blockchain data

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTransactionHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

export const formatTokenAmount = (amount: bigint, decimals: number = 18): string => {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === 0n) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
};

export const formatGasPrice = (gasPrice: bigint): string => {
  const gwei = gasPrice / BigInt(10 ** 9);
  return `${gwei.toString()} Gwei`;
};

export const formatBlockNumber = (blockNumber: bigint): string => {
  return `#${blockNumber.toString()}`;
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatReceiptId = (id: bigint): string => {
  return `#${id.toString().padStart(6, '0')}`;
};

export const formatIPFSHash = (hash: string): string => {
  if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return 'No IPFS hash';
  }
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};