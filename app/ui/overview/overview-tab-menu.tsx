"use client";

import React, { useState } from "react";
import clsx from "clsx";
import LenderDashboard from "./lender-dashboard";
import BorrowerDashboard from "./borrower-dashboard";
import Image from "next/image";

const TotalHoldings: React.FC = () => (
  <div className="bg-white rounded-3xl border border-purpleBG-lighter p-4 lg:p-6 mb-7">
    <div className="flex justify-between items-start mb-10">
      <div>
        <h2 className="text-base font-medium text-neutral-500">
          Total Holdings
        </h2>
        <p className="text-3xl font-semibold text-baseBlack mb-2">$1000.00</p>
      </div>
      <Image
        src="/vanna-black-logo-text.svg"
        width="92"
        height="28"
        alt="Vanna"
      />
    </div>
    <p className="text-3xl font-semibold text-baseSuccess-300">
      +16,590 <span className="text-sm font-medium">(+12.05%)</span>
    </p>
    <p className="text-sm text-gray-500">Total Returns</p>
  </div>
);

const Rewards: React.FC = () => (
  <div className="bg-white rounded-3xl border border-purpleBG-lighter p-4 xl:p-10 mt-4">
    <h2 className="text-xl font-semibold mb-9">Rewards</h2>
    <div className="bg-gray-100 rounded-lg p-2 mb-4">
      <div className="flex justify-between bg-baseComplementary text-base font-medium mb-2">
        <span>Activity</span>
        <span>Your Allocation</span>
        <span>Claim</span>
      </div>
    </div>
    <div className="px-2 lg:px-4 text-baseBlack">
      {["WETH", "USDC", "WBTC"].map((pool, index) => (
        <div
          key={index}
          className="flex justify-between text-base font-medium items-center mb-2 py-2"
        >
          <span>{pool}</span>
          <span>{(index + 1) * 10} points</span>
          <button className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold text-baseBlack rounded-md group bg-gradient-to-br from-gradient-1 to-gradient-2 group-hover:from-gradient-1 group-hover:to-gradient-2 hover:text-white dark:text-white focus:ring-4 focus:outline-none">
            <span className="relative px-2 py-1.5 transition-all ease-in duration-75 bg-white dark:bg-white rounded-md group-hover:bg-opacity-0">
              Claim
            </span>
          </button>
        </div>
      ))}
    </div>
  </div>
);

const OverviewTabMenu = () => {
  const [activeTab, setActiveTab] = useState("Lender");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Lender":
        return <LenderDashboard />;
      case "Borrower":
        return <BorrowerDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white mt-6 rounded-lg">
      <div className="flex space-x-6 mb-6 border-b border-neutral-100 pb-2 text-xl">
        {["Lender", "Borrower"].map((tab) => (
          <div
            key={tab}
            className={clsx(
              "pb-2 relative font-semibold cursor-pointer flex flex-row",
              activeTab === tab
                ? "text-baseBlack after:content-[''] after:absolute after:-bottom-1/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
                : "text-neutral-500"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="container mx-auto pt-2">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 xl:w-1/3 pr-0 lg:pr-4 mb-4 lg:mb-0">
            <TotalHoldings />
            <Rewards />
          </div>
          <div className="w-full lg:w-1/2 xl:w-2/3">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTabMenu;
