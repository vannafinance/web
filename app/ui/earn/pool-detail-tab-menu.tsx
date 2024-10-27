"use client";

import React, { useState } from "react";
import clsx from "clsx";
import UtilizationChart from "./utilization-chart";
import AnalyticsChart from "./analytics-chart";
import PoolDetails from "./pool-details";
import { ChartBar, ChartLineUp, FileText } from "@phosphor-icons/react";

const PoolDetailTabMenu = ({ pool, utilizationRate }: { pool: PoolTable, utilizationRate: string | undefined }) => {
  const [activeTab, setActiveTab] = useState("Details");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return <PoolDetails pool={pool} />;
      case "Utilization rate":
        return <UtilizationChart pool={pool} utilizationRate={utilizationRate} />;
      case "Analytics":
        return <AnalyticsChart pool={pool} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-baseDark rounded-lg">
      <div className="flex space-x-4 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-2 text-xs sm:text-base">
        {["Details", "Utilization rate", "Analytics"].map((tab) => (
          <div
            key={tab}
            className={clsx(
              "pb-2 relative font-medium cursor-pointer flex flex-row text-neutral-500",
              activeTab === tab &&
                "text-baseBlack dark:text-baseWhite after:content-[''] after:absolute after:-bottom-1/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Details" ? (
              <FileText className="text-sm sm:text-2xl" />
            ) : tab === "Utilization rate" ? (
              <ChartBar className="text-sm sm:text-2xl" />
            ) : (
              <ChartLineUp className="text-sm sm:text-2xl" />
            )}
            &nbsp;&nbsp;
            {tab}
          </div>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default PoolDetailTabMenu;
