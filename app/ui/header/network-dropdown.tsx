"use client";

import { CaretDown } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

export const NetworkDropdown: React.FC<NetworkDropdownProps> = ({
  options,
  onSelect,
  displayName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(options[0]);

  const handleSelect = (network: NetworkOption) => {
    setSelectedNetwork(network);
    onSelect(network);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex items-center justify-center w-full border border-neutral-100 rounded-lg py-2 px-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Image
            src={selectedNetwork.icon}
            width="20"
            height="20"
            alt={selectedNetwork.name}
          />
          &nbsp;&nbsp;
          {displayName ? selectedNetwork.name : ""}
          <CaretDown color="baseBlack" weight="bold" />
        </button>
      </div>

      {isOpen && (
        <div className="bg-white origin-top-right absolute left-0 mt-2 w-40 rounded-md shadow-xl ring-1 ring-black ring-opacity-5">
          <div
            className="p-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {options.map((option) => (
              <button
                key={option.id}
                className="flex items-center p-3 text-sm text-baseBlack w-full rounded-lg hover:bg-neutral-100"
                role="menuitem"
                onClick={() => handleSelect(option)}
              >
                <Image
                  src={option.icon}
                  width="20"
                  height="20"
                  alt={option.name}
                />
                &nbsp;&nbsp;{option.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDropdown;
