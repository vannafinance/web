"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";

const FutureDropdown: React.FC<FutureDropdownProps> = ({
  options,
  defaultValue,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Option>(defaultValue);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    onChange(option);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 bg-white rounded"
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
        <CaretDown size={16} />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded shadow-lg font-normal text-sm">
          {options.map((option) => (
            <li
              key={option.value}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
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
