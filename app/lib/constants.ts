export const poolMap: Map<string, Pool> = new Map<string, Pool>([
  ["1", { id: 1, name: "Ethereum", shortName: "WETH" }],
  ["2", { id: 2, name: "Wrap Bitcoin", shortName: "WBTC" }],
  ["3", { id: 3, name: "DAI", shortName: "DAI" }],
  ["4", { id: 4, name: "USDC", shortName: "USDC" }],
]);

export const networkOptions = [
  { id: "base", name: "Base", icon: "/eth-icon.svg" },
  { id: "arbitrum", name: "Arbitrum One", icon: "/vanna-logo.svg" },
  { id: "optimism", name: "OP Mainnet", icon: "/vanna-white-logo.svg" },
];

export const BASE_NETWORK = "base";
export const ARBITRUM_NETWORK = "arbitrum";
export const OPTIMISM_NETWORK = "optimism";
