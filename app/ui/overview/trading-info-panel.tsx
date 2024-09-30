"use client";

import { Info } from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";

type TabType = "Perps" | "Options" | "Spot";

interface InfoRowProps {
  label: string;
  value: string;
  subValue?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, subValue }) => (
  <div className="flex flex-col px-2 sm:px-5 py-7 text-baseBlack">
    <div className="flex justify-between items-center mb-4 sm:mb-1">
      <span className="text-base font-medium">{label}</span>
      <Info size={16} />
    </div>
    <div className="font-semibold text-2xl">
      {value ? value : "-"}{" "}
      {subValue && (
        <span className="text-baseSuccess-300 text-base font-medium ml-1">
          ({subValue})
        </span>
      )}
    </div>
  </div>
);

const TradingInfoPanel: React.FC = () => {
  const tabs: TabType[] = ["Perps", "Options", "Spot"];
  const [activeTab, setActiveTab] = useState<TabType>("Perps");

  const [initialMargin, setInitialMargin] = useState("");
  const [avgLeverage, setAvgLeverage] = useState("");
  const [borrowAPY, setBorrowAPY] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [liquidationPrice, setLiquidationPrice] = useState("");
  const [profitLoss, setProfitLoss] = useState("");
  const [profitLossPercentage, setProfitLossPercentage] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {
    setInitialMargin("");
    setAvgLeverage("");
    setBorrowAPY("");
    setRepayAmount("");
    setLiquidationPrice("");
    setProfitLoss("");
    setProfitLossPercentage("");
  }, []);

  return (
    <div className="bg-white rounded-lg">
      <div className="flex mb-9 border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`pb-2 px-4 font-medium relative ${
              activeTab === tab ? "text-baseBlack" : "text-neutral-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute -bottom-0.5 left-0 w-full h-[3px] bg-gradient-to-r from-gradient-1 to-gradient-2" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
        <InfoRow label="Initial Margin" value={initialMargin} />
        <InfoRow label="Avg Leverage" value={avgLeverage} />
        <InfoRow label="Borrow APY" value={borrowAPY} />

        <InfoRow label="Repay Amount" value={repayAmount} />
        <InfoRow label="Liquidation Price" value={liquidationPrice} />
        <InfoRow
          label="Profit/Loss"
          value={profitLoss}
          subValue={profitLossPercentage}
        />
      </div>
    </div>
  );
};

export default TradingInfoPanel;
