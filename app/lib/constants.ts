export const poolMap: Map<string, Pool> = new Map<string, Pool>([
  ["1", { id: 1, name: "Ethereum", shortName: "WETH" }],
  ["2", { id: 2, name: "Wrap Bitcoin", shortName: "WBTC" }],
  ["3", { id: 3, name: "DAI", shortName: "DAI" }],
  ["4", { id: 4, name: "USDC", shortName: "USDC" }],
]);

export const networkOptions = [
  { id: "base", name: "Base", icon: "/eth-icon.svg" },
  { id: "arbitrum", name: "Arbitrum One", icon: "/eth-icon.svg" },
  { id: "optimism", name: "OP Mainnet", icon: "/eth-icon.svg" },
];
