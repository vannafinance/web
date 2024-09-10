"use client";

import clsx from "clsx";
import React, { useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample data - to be replaced with fetched data later
const sampleData = [
  { date: "29", value: 2.15 },
  { date: "30", value: 2.25 },
  { date: "sept", value: 2.05 },
  { date: "3", value: 2.22 },
  { date: "4", value: 2.1 },
];

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  selected,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (
    event: MouseEvent,
    dropdownRef: React.RefObject<HTMLDivElement>,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) =>
      handleClickOutside(event, dropdownRef, setIsOpen);

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xl font-bold text-baseBlack"
      >
        {selected}
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="bg-white origin-top-right absolute left-0 mt-2 w-40 rounded-md shadow-xl z-10">
          <div
            className="p-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {options.map((option) => (
              <button
                key={option}
                className="flex items-center p-3 text-sm text-baseBlack w-full rounded-lg hover:bg-neutral-100"
                role="menuitem"
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsChart = () => {
  const [timeFrame, setTimeFrame] = useState("1D");
  const [selectedOption, setSelectedOption] = useState("Deposit APY");
  const options = ["Deposit APY", "Withdrawal APY", "Transfer APY"];

  return (
    <div className="bg-baseComplementary py-6 px-10 rounded-2xl text-baseBlack font-bold">
      <div className="flex justify-between items-center mb-4">
        <CustomDropdown
          options={options}
          selected={selectedOption}
          onSelect={setSelectedOption}
        />
        <div className="flex space-x-2">
          {["1D", "7D", "30D", "1Y"].map((frame) => (
            <button
              key={frame}
              onClick={() => setTimeFrame(frame)}
              className={clsx(
                "px-[1px] py-[1px] text-xs rounded-md bg-purpleBG-lighter relative z-10",
                timeFrame === frame &&
                  "bg-gradient-to-r from-gradient-1 to-gradient-2 p-[1px]"
              )}
            >
              <span
                className={clsx(
                  "relative z-10 flex items-center justify-center w-11 h-6",
                  timeFrame === frame && "bg-purpleBG-lighter rounded-md"
                )}
              >
                {frame}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col mb-2">
        <span className="text-xl">
          {sampleData[sampleData.length - 1].value.toFixed(2)}%
        </span>
        <span className="text-sm">
          {new Date().toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sampleData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#0a0a0b", fontSize: 14 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#0a0a0b", fontSize: 14 }}
              orientation="right"
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "#7a45da",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#fafafa" }}
              itemStyle={{ color: "#fafafa" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
