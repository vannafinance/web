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
  icon1: string;
  icon2?: string;
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
