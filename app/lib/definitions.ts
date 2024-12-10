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
};
/* eslint-disable @typescript-eslint/no-explicit-any */

interface PositionSectionProps {
  dataFetching: boolean;
}
