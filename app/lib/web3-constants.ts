import { InjectedConnector } from "@web3-react/injected-connector";

export const injected = new InjectedConnector({
  supportedChainIds: [
    1, // Mainet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    42, // Kovan
    11155111, // goreli arbitrum
    42161, // arbitrum mainnet
    901, // lyraTestNet
    10, // optimism
  ],
});

export const getShortenedAddress = (address: string, start = 6, end = 4) => {
  if (address != "") {
    const shortenedAddress = `${address.slice(0, start)}...${address.slice(-1 * end)}`;
    return shortenedAddress;
  } else {
    return "";
  }
};

const arbitrum = {
  usdcTokenAddress: "0xe80F2a02398BBf1ab2C9cc52caD1978159c215BD",
  wethContractAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
};

const usdcTokenAddress = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const usdtTokenAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const wethTokenAddress = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
const wbtcTokenAddress = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const daiTokenAddress = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";

export const addressList = {
  daiTokenAddress: daiTokenAddress,
  usdcTokenAddress: usdcTokenAddress,
  usdtTokenAddress: usdtTokenAddress,
  wethTokenAddress: wethTokenAddress,
  wbtcTokenAddress: wbtcTokenAddress,

  vDaiContractAddress: "0xA7d9c98dEDb545A6e66F46BEE8faF8f90c3a5c6f",
  vUSDCContractAddress: "0xE17258A56F0da671a028F2276Ddeaa5C1ccF3bdb",
  vUSDTContractAddress: "0x615A1B9A30C0C0e3E2391c5b93210Ce96FD2F0ef",
  vWBTCContractAddress: "0x15Dd8d2d7034eb3d249189964Cb44a114D79cF68",
  vEtherContractAddress: "0xA1f41ad5e26167db20c722835A6DB33889c49Cd7",
  accountManagerContractAddress: "0x13da9e485D17c0F62f64F77aAbE7b6c048a2f33C",
  registryContractAddress: "0x6DCD57f3C7CBc465832213646BEEf5501f63a3C4",
  lyraContractAddress: "0x919E5e0C096002cb8a21397D724C4e3EbE77bC15",
  muxFutureContractAddress: "0xa19fD5aB6C8DCffa2A295F78a5Bb4aC543AAF5e3",
  // spotUniswapContractAddress: "0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633",
  broker: "0x988aA44E12c7BCE07E449A4156b4A269d6642B3A",
  rateModelContractAddress: "0xbfB65FA7cC024c3315c4Eb13891f41223906f364",
  riskEngineContractAddress: "0x676fbE39A5a403b85474D155567e43D9b2b85922",
  uniswapRouterAddress: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  muxLiquidityPoolAddress: "0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633",
  multicallAddress:  "0xcA11bde05977b3631167028862bE2a173976CA11",
};

export const OptionType = {
  LongCall: 0,
  LongPut: 1,
  ShortCallBase: 2, // WETH
  ShortCallQuote: 3, // USDC
  ShortPutQuote: 4,
};

export const codeToAsset = {
  "00": "USDC",
  "01": "USDT",
  "02": "DAI",
  "03": "ETH",
  "04": "BTC",
};

export const CollateralAssetCode = {
  USDC: "00",
  USDT: "01",
  DAI: "02",
  WETH: "03",
  WBTC: "04",
  ETH: "03",
  BTC: "04",
};

export const tokensAddress = {
  USDC: usdcTokenAddress,
  USDT: usdtTokenAddress,
  DAI: daiTokenAddress,
  WETH: wethTokenAddress,
  WBTC: wbtcTokenAddress,
};
