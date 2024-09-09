import { SunDim } from "@phosphor-icons/react";
import NetworkDropdown from "./network-dropdown";

export default function NavbarButtons() {
  const networkOptions = [
    { id: "base", name: "Base", icon: "/eth-icon.svg" },
    { id: "arbitrum", name: "Arbitrum One", icon: "/eth-icon.svg" },
    { id: "optimism", name: "OP Mainnet", icon: "/eth-icon.svg" },
  ];

  const handleNetworkSelect = (network: NetworkOption) => {
    console.log("Selected network:", network);
  };

  return (
    <div className="flex flex-row gap-2 items-center justify-center my-auto">
      <div className="p-2 border border-neutral-100 rounded-lg">
        <SunDim size={24} color="baseBlack" weight="fill" />
      </div>
      <div>
        <NetworkDropdown
          options={networkOptions}
          onSelect={handleNetworkSelect}
        />
      </div>
      <button className="bg-gradient-to-r from-gradient-1 to-gradient-2 w-40 h-11 text-baseWhite rounded-lg text-base font-semibold">
        Connect Wallet
      </button>
    </div>
  );
}
