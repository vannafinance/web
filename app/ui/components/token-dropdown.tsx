"use client";

import { poolsPlaceholder } from "@/app/lib/static-values";
import { CaretDown } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export const TokenDropdown: React.FC<TokenDropdownProps> = ({
  onSelect,
  defaultValue,
  options = poolsPlaceholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(defaultValue ? defaultValue : options[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (token: PoolTable) => {
    setSelectedToken(token);
    onSelect(token);
    setIsOpen(false);
  };

  useEffect(() => {
    onSelect(selectedToken);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          className="inline-flex items-center justify-center w-full border border-neutral-100 dark:border-neutral-700 rounded-lg py-2 px-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Image
            src={selectedToken.icon}
            width="20"
            height="20"
            alt={selectedToken.name}
          />
          &nbsp;&nbsp;
          {selectedToken.name}
          &nbsp;&nbsp;
          <CaretDown weight="bold" />
        </button>
      </div>

      {isOpen && (
        <div className="z-30 bg-white dark:bg-baseDark origin-top-right absolute left-0 mt-2 w-40 rounded-md shadow-xl ring-1 ring-black dark:ring-neutral-800 ring-opacity-5">
          <div
            className="p-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {options.map((option) => (
              <button
                key={option.id}
                className="flex items-center p-3 text-sm w-full rounded-lg hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary"
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

export default TokenDropdown;
