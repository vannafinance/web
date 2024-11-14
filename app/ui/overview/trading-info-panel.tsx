"use client";

import { useState } from "react";
import FutureTab from "./FutureTab";
import OptionTab from "./OptionTab";
import SpotTab from "./SpotTab";

type TabType = "Perps" | "Options" | "Spot";

const TradingInfoPanel: React.FC = () => {
  const tabs: TabType[] = ["Perps", "Options", "Spot"];
  const [activeTab, setActiveTab] = useState<TabType>("Perps");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Perps":
        return <FutureTab />;
      case "Options":
        return <OptionTab />;
      case "Spot":
        return <SpotTab />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-baseDark rounded-lg">
      <div className="flex mb-9  border-b-neutral-100 dark:border-b-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`pb-2 px-4 font-medium relative ${
              activeTab === tab
                ? "text-baseBlack dark:text-baseWhite"
                : "text-neutral-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute -bottom-0.5 left-0 w-full h-[3px] bg-gradient-to-r from-gradient-1 to-gradient-2" />
            )}
            {tab === "Options" && (
              <button className="ml-1 py-0.5 px-1 bg-gradient-to-r from-gradient-1 to-gradient-2 text-xs rounded-md text-baseWhite">
                soon
              </button>
            )}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default TradingInfoPanel;
