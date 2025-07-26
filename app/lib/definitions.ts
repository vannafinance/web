/* eslint-disable @typescript-eslint/no-unused-vars */

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  isSoon: boolean;
}

interface NetworkOption {
  id: string;
  name: string;
  icon: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl: string;
}

interface TabProps {
  tabs: {
    name: string;
    href: string;
  }[];
}

interface PoolTable {
  id: number;
  name: string;
  icon: string;
  supply: string;
  supplyAPY: string;
  borrowAPY: string;
  yourBalance: string;
  isActive?: boolean;
  version?: number;
  vToken: string;
}

interface Pool {
  id: number;
  name: string;
  shortName: string;
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

interface SupplyWithdrawProps {
  balance: string;
  currentAPY: string;
}

interface CustomDropdownProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
}

type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
}

interface TokenDropdownProps {
  onSelect: (token: PoolTable) => void;
  defaultValue: PoolTable;
  options?: PoolTable[];
}

interface AccountOverviewProps {
  creditToken: PoolTable | undefined;
  activeAccount: string | undefined;
}

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface FutureDropdownProps {
  options: Option[];
  defaultValue: Option;
  onChange: (option: Option) => void;
  iconFill?: boolean;
}

interface CryptoData {
  price: string;
  change: string;
  indexPrice: string;
  markPrice: string;
  highLow: string;
  netRatePositive: string;
  netRateNegative: string;
  openInterestPositive: string;
  openInterestNegative: string;
  volume: string;
}

interface PositionOpenCloseProps {
  market: Option;
  setMarket: React.Dispatch<React.SetStateAction<Option>>;
  marketOption: Option[];
  setDataFetching: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPrice?: number | null;
  // Order-related props
  orderState?: any;
  orderValidation?: any;
  authState?: any;
  formErrors?: any;
  showValidationErrors?: boolean;
  orderFeedback?: any;
  recentOrderUpdates?: any[];
  showOrderHistory?: boolean;
  setShowOrderHistory?: (show: boolean) => void;
  orderSize?: string;
  setOrderSize?: (size: string) => void;
  orderLimitPrice?: string;
  setOrderLimitPrice?: (price: string) => void;
  orderDirection?: "buy" | "sell";
  setOrderDirection?: (direction: "buy" | "sell") => void;
  onOrderSubmit?: () => void;
  onClearFeedback?: () => void;
  onClearValidationErrors?: () => void;
}

interface UserData {
  availableBalance: string;
  marginUsage: string;
  totalPnl: string;
  healthFactor: string;
  borrowRate: string;
}

interface OptionPosition {
  id: number;
  selected: boolean;
  strikePrice: number;
  cp: "CE" | "PE";
  units: number;
  traded: number;
  price: number;
  delta: number;
  iv: number;
}

interface FuturePosition {
  id: number;
  selected: boolean;
  market: string;
  entryPrice: string;
  size: string;
  leverage: string;
  liqPrice: string;
  delta: string;
  pnl: string;
}

interface PortfolioSummaryProps {
  future: number;
  premium: number;
  option: number;
  grossPnl: number;
  netBal: number;
  theta: number;
  vega: number;
  gamma: number;
}

interface OptionsDeltaData {
  assets: string[];
  call: string[];
  put: string[];
  total: string[];
}

interface FutureDeltaData {
  assets: string[];
  equity: string[];
  future: string[];
  average: string[];
}

interface OptionData {
  delta: number;
  iv: number;
  volume: number;
  bidSize: number;
  bidPrice: number;
  askPrice: number;
  askSize: number;
  strike: number;
  instrument?: {
    instrument_name: string;
    option_details?: {
      strike: string;
      option_type: string;
    };
  };
}

interface PoolPropsLenderDashboard {
  number?: number;
  name: string;
  amount: number;
  profit: number;
  apy: number;
  percentage: number;
  icon: string;
  isLoss?: boolean;
}

interface BurgerMenuProps {
  onClose: () => void;
}

interface CreateSmartAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MuxPriceFetchingResponseObject {
  symbol: string;
  price: number;
  availableForLong: number;
  availableForShort: number;
}

interface MarketPosition {
  market: string;
  isLong: boolean;
  netValue: string;
  leverage: string;
  collateral: number;
  entryPrice: string;
  indexPrice: string;
  liqPrice: string;
  pnlAndRow: string;
  actions: JSX.Element;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface NavItem {
  name: string;
  count: number | null;
  component: React.ComponentType<any>; // Accepts any component
  props?: Record<string, any>; // Optional props
}
/* eslint-disable @typescript-eslint/no-explicit-any */

interface PositionSectionProps {
  dataFetching: boolean;
}

interface DeriveInstrument {
  instrument_name: string;
  instrument_type: string;
  base_currency: string;
  quote_currency: string;
  is_active: boolean;
  option_details?: {
    expiry: number;
    strike: string;
    option_type: "C" | "P"; // Call or Put
  };
}

interface DeriveInstrumentDetails {
  instrument_name: string;
  instrument_type: string;
  base_currency: string;
  quote_currency: string;
  is_active: boolean;
  // Market data - these might not be available for all instruments
  mark_price?: number;
  bid_price?: number;
  ask_price?: number;
  bid_size?: number;
  ask_size?: number;
  volume_24h?: number;
  // Greeks - only for options
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  implied_volatility?: number;
  option_details?: {
    expiry: number;
    strike: string;
    option_type: "C" | "P";
  };
}

interface JSONRPCRequest {
  method: string;
  params: any;
  id: string;
}

interface JSONRPCResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id: string;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}

// Futures market data interfaces
interface FuturesTickerData {
  instrument_name: string;
  mark_price: string;
  index_price: string;
  last_price: string;
  best_bid_price: string;
  best_ask_price: string;
  best_bid_amount: string;
  best_ask_amount: string;
  volume_24h: string;
  price_change_24h: string;
  price_change_percentage_24h: string;
  high_24h: string;
  low_24h: string;
  funding_rate: string;
  next_funding_rate: string;
  open_interest: string;
  timestamp: number;
  // Additional fields from actual Derive API response
  perp_details?: {
    funding_rate?: string;
    next_funding_rate?: string;
    funding_timestamp?: number;
  };
  stats?: {
    contract_volume?: string;
    high?: string;
    low?: string;
    open_interest?: string;
    price_change?: string;
    price_change_percentage?: string;
  };
}

interface FuturesOrderBookData {
  instrument_name: string;
  bids: Array<[string, string]>; // [price, amount]
  asks: Array<[string, string]>; // [price, amount]
  timestamp: number;
}

interface FuturesInstrument {
  instrument_name: string;
  instrument_type: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  contract_size: string;
  tick_size: string;
  min_trade_amount: string;
  is_active: boolean;
  kind: string; // "future" or "perpetual"
  expiration_timestamp?: number;
}

interface DeriveSubscriptionCallback {
  (data: any): void;
}

interface DeriveSubscription {
  channel: string;
  callback: DeriveSubscriptionCallback;
  instrumentName: string;
  type: "ticker" | "orderbook";
}

interface FuturesMarketData {
  ticker: FuturesTickerData | null;
  orderBook: FuturesOrderBookData | null;
  lastUpdated: number;
}

// WebSocket subscription response types
interface SubscriptionResponse {
  method: string;
  params: {
    channel: string;
    data: any;
  };
}

interface TickerSubscriptionData {
  instrument_name: string;
  timestamp: number;
  mark_price: string;
  index_price: string;
  last_price: string;
  best_bid_price: string;
  best_ask_price: string;
  best_bid_amount: string;
  best_ask_amount: string;
  volume_24h: string;
  price_change_24h: string;
  price_change_percentage_24h: string;
  high_24h: string;
  low_24h: string;
  funding_rate: string;
  next_funding_rate: string;
  open_interest: string;
}

interface OrderBookSubscriptionData {
  instrument_name: string;
  timestamp: number;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
}
