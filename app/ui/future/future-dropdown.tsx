"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

const FutureDropdown: React.FC<FutureDropdownProps> = ({
  options,
  defaultValue,
  onChange,
  iconFill = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Option>(defaultValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    onChange(option);
  };

  useEffect(() => {
    onChange(selectedOption);
  }, []);

  useEffect(() => {
    setSelectedOption(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-2 bg-white dark:bg-baseDark rounded w-max"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption.icon && (
          <img
            src={selectedOption.icon}
            alt={selectedOption.label}
            className="w-5 h-5 mr-2"
          />
        )}
        <span>{selectedOption.label}</span>
        {iconFill ? (
          <CaretDown size={16} weight="fill" />
        ) : (
          <CaretDown size={16} />
        )}
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white dark:bg-baseDark border border-gray-300 dark:border-neutral-800 mt-1 rounded shadow-lg font-normal text-sm">
          {options.map((option) => (
            <li
              key={option.value}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-baseDarkComplementary cursor-pointer flex items-center"
              onClick={() => handleSelect(option)}
            >
              {option.icon && (
                <img
                  src={option.icon}
                  alt={option.label}
                  className="w-5 h-5 mr-2"
                />
              )}
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FutureDropdown;
