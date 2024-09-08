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
