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
