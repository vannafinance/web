"use client";

import React, { useState } from "react";
import { Info, Copy } from "@phosphor-icons/react";
import clsx from "clsx";
import { details } from "@/app/lib/static-values";

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 transform -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

const PoolDetails = () => {
  const [activeTab, setActiveTab] = useState("Details");

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      alert("Address copied to clipboard!");
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-12 px-4 border border-neutral-300 rounded-2xl">
            {details.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-sm text-baseBlack mr-1">
                    {item.label}
                  </span>
                  <Tooltip content={item.tooltip}>
                    <Info size={16} color="black" />
                  </Tooltip>
                </div>
                <div className="font-semibold text-lg mt-1.5">{item.value}</div>
              </div>
            ))}
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-sm text-baseBlack mr-1">ADDRESS</span>
                <Copy
                  size={16}
                  color="black"
                  onClick={() => handleCopyAddress("0xda00...614f")}
                />
              </div>
              <div className="font-semibold text-lg mt-1.5">0xda00...614f</div>
            </div>
          </div>
        );
      case "Utilization rate":
        return <div>Utilization rate content here</div>;
      case "Analytics":
        return <div>Analytics content here</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white mt-14 rounded-lg shadow-sm">
      <div className="flex space-x-4 mb-6 border-b border-neutral-100 pb-2 text-base">
        {["Details", "Utilization rate", "Analytics"].map((tab) => (
          <div
            key={tab}
            className={clsx(
              "pb-2 relative font-medium cursor-pointer",
              activeTab === tab
                ? "text-baseBlack after:content-[''] after:absolute after:-bottom-1/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
                : "text-neutral-500"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {/* TDOD: add logo here */}
            {tab}
          </div>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default PoolDetails;
