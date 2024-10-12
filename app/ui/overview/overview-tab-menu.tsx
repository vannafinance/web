"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import LenderDashboard from "./lender-dashboard";
import BorrowerDashboard from "./borrower-dashboard";
import Image from "next/image";

const TotalHoldings: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const [totalHoldings, setTotalHolding] = useState();
  const [totalReturnsAmount, setTotalReturnsAmount] = useState();
  const [totalReturnsPercentage, setTotalReturnsPercentage] = useState();
  const [healthFactor, setHealthFactor] = useState();

  // TODO: delete below useEffect
  useEffect(() => {
    setTotalHolding(undefined);
    setTotalReturnsAmount(undefined);
    setTotalReturnsPercentage(undefined);
    setHealthFactor(undefined);
  }, []);

  return (
    <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-4 lg:p-7 mb-7">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-base font-medium text-neutral-500">
            Total Holdings
          </h2>
          <p className="text-3xl font-semibold mb-2">
            {totalHoldings ? totalHoldings : "-"}
          </p>
        </div>
        <Image
          src="/vanna-black-logo-text.svg" // "/vanna-white-logo-text.svg"
          width="92"
          height="28"
          alt="Vanna"
        />
      </div>
      <div
        className={clsx(
          "flex items-start",
          activeTab === "Borrower" ? "justify-between" : "justify-start"
        )}
      >
        <div>
          <p
            className={clsx(
              "text-3xl font-semibold",
              totalReturnsAmount
                ? "text-baseSuccess-300"
                : "text-baseBlack dark:text-baseWhite"
            )}
          >
            {totalReturnsAmount ? totalReturnsAmount : "-"}
            {totalReturnsPercentage && (
              <span className="text-sm font-medium">
                ({totalReturnsPercentage})
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500">Total Returns</p>
        </div>
        {activeTab === "Borrower" && (
          <div>
            <p className="text-2xl font-semibold">
              {healthFactor ? healthFactor : "-"}
            </p>
            <p className="text-sm text-gray-500">Health Factor</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Rewards: React.FC = () => (
  <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-4 xl:p-10 mt-4">
    <h2 className="text-xl font-semibold mb-9">Rewards</h2>
    <div className="bg-baseComplementary dark:bg-baseDarkComplementary rounded-lg p-2 mb-4">
      <div className="flex justify-between text-base font-medium mb-2">
        <span>Activity</span>
        <span>Your Allocation</span>
        <span>Claim</span>
      </div>
    </div>
    <div className="px-2 lg:px-4">
      {["WETH", "USDC", "WBTC"].map((pool, index) => (
        <div
          key={index}
          className="flex justify-between text-base font-medium items-center mb-2 py-2"
        >
          <span>{pool}</span>
          <span>{(index + 1) * 10} points</span>
          <button className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold rounded-md group bg-gradient-to-br from-gradient-1 to-gradient-2 group-hover:from-gradient-1 group-hover:to-gradient-2 hover:text-white focus:ring-4 focus:outline-none">
            <span className="relative px-2 py-1.5 transition-all ease-in duration-75 bg-white dark:bg-baseDark rounded-md group-hover:bg-opacity-0">
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
    <div className="bg-white dark:bg-baseDark mt-6 rounded-lg text-baseBlack dark:text-baseWhite">
      <div className="flex space-x-6 mb-6 border-b border-neutral-100 dark:border-neutral-700 pb-2 text-xl">
        {["Lender", "Borrower"].map((tab) => (
          <div
            key={tab}
            className={clsx(
              "pb-2 relative font-semibold cursor-pointer flex flex-row text-neutral-500",
              activeTab === tab &&
                "after:content-[''] after:absolute after:-bottom-1/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
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
            <TotalHoldings activeTab={activeTab} />
            <Rewards />
          </div>
          <div className="w-full lg:w-1/2 xl:w-2/3">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTabMenu;
