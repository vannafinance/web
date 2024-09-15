interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

interface NetworkOption {
  id: string;
  name: string;
  icon: string;
}

interface NetworkDropdownProps {
  options: NetworkOption[];
  onSelect: (network: NetworkOption) => void;
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
  market: string;
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
  marketPrice: number;
  entryPrice: number;
  size: number;
  leverage: number;
  liqPrice: number;
  delta: number;
  pnl: number;
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
}
