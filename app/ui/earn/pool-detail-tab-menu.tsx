"use client";

import React, { useState } from "react";
import clsx from "clsx";
import UtilizationChart from "./utilization-chart";
import AnalyticsChart from "./analytics-chart";
import PoolDetails from "./pool-details";

const PoolDetailTabMenu = ({ pool }: { pool: PoolTable }) => {
  const [activeTab, setActiveTab] = useState("Details");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return <PoolDetails pool={pool} />;
      case "Utilization rate":
        return <UtilizationChart pool={pool} />;
      case "Analytics":
        return <AnalyticsChart pool={pool} />;
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

export default PoolDetailTabMenu;
