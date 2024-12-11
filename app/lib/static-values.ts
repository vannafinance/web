export const poolsPlaceholder: PoolTable[] = [
  {
    id: 1,
    name: "WETH",
    icon: "/eth-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vWETH",
  },
  {
    id: 2,
    name: "WBTC",
    icon: "/btc-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vWBTC",
  },
  {
    id: 3,
    name: "USDC",
    icon: "/usdc-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vUSDC",
  },
  {
    id: 4,
    name: "USDT",
    icon: "/usdt-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vUSDT",
  },
  {
    id: 5,
    name: "DAI",
    icon: "/dai-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vDAI",
  },
];

export const poolDetailsPlaceholder = [
  {
    label: "SUPPLY APY",
    value: "-",
    tooltip: "Average Deposit APY for the last 7 days",
  },
  {
    label: "BORROW APY",
    value: "-",
    tooltip: "Current Borrow Annual Percentage Yield",
  },
  {
    label: "VTOKEN RATE",
    value: "-",
    tooltip: "Current Diesel Rate",
  },
  {
    label: "TOTAL LIQUIDITY",
    value: "-",
    tooltip: "Expected liquidity in the pool",
  },
  {
    label: "LQ. IN DOLLAR",
    value: "-",
    tooltip: "Expected liquidity in the pool",
  },
  {
    label: "TOTAL BORROWED",
    value: "-",
    tooltip: "Total amount borrowed from the pool",
  },
  {
    label: "AVAILABLE LIQUIDITY",
    value: "-",
    tooltip: "Current available liquidity in the pool",
  },
  {
    label: "UNIQUE USERS",
    value: "-",
    tooltip: "Number of unique users in the pool",
  },
  {
    label: "WITHDRAWAL FEES",
    value: "-",
    tooltip: "Current withdrawal fees",
  },
];

export const menuLinks = [
  { title: "Overview", href: "/" },
  { title: "Earn", href: "/earn" },
  { title: "Margin", href: "/borrow" },
  { title: "Trade", href: "/trade/dashboard" },
  // { title: "Analytics", href: "/analytics" },
];

export const tradeMenuSubLinks = [
  {
    title: "Dashboard",
    href: "/trade/dashboard",
    subtitle: "Hedging tool to manage complex strategies with Greeks insights",
    icon: "/dashboard-menu-icon.svg",
  },
  {
    title: "Perps",
    href: "/trade/future",
    subtitle: "Leveraged perpetual contracts to trade crypto without expiration",
    icon: "/perps-menu-icon.svg",
  },
  {
    title: "Options",
    href: "/trade/options",
    subtitle: "Leveraged contracts for hedging, speculation, or income with controlled risk",
    icon: "/options-menu-icon.svg",
  },
  {
    title: "Spot",
    href: "/trade/spot",
    subtitle: "Margin trade to buy/sell assets at spot prices",
    icon: "/spot-menu-icon.svg",
  },
];

export const defaultTokenOptions: Option[] = [
  { value: "WETH", label: "WETH", icon: "/eth-icon.svg" },
  { value: "WBTC", label: "WBTC", icon: "/btc-icon.svg" },
  { value: "USDC", label: "USDC", icon: "/usdc-icon.svg" },
  { value: "USDT", label: "USDT", icon: "/usdt-icon.svg" },
  { value: "DAI", label: "DAI", icon: "/dai-icon.svg" },
];

export const ethPoolObj: PoolTable = {
  id: 0,
  name: "ETH",
  icon: "/eth-icon.svg",
  supply: "0",
  supplyAPY: "0",
  borrowAPY: "0",
  yourBalance: "0",
  isActive: false,
  version: 0,
  vToken: "ETH",
}
