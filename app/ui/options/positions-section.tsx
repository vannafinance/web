"use client";

import React, { useState } from "react";

const PositionsComponent = () => <div>Positions Component</div>;
const OpenOrdersComponent = () => <div>Open Orders Component</div>;
const OrderHistoryComponent = () => <div>Order History Component</div>;
const TradeHistoryComponent = () => <div>Trade History Component</div>;
const TransactionHistoryComponent = () => (
  <div>Transaction History Component</div>
);
const PositionHistoryComponent = () => <div>Position History Component</div>;

const PositionsSection = () => {
  const [activeTab, setActiveTab] = useState("Positions");

  const navItems = [
    { name: "Positions", count: 0, component: PositionsComponent },
    { name: "Open Orders", count: 0, component: OpenOrdersComponent },
    { name: "Order History", count: null, component: OrderHistoryComponent },
    { name: "Trade History", count: null, component: TradeHistoryComponent },
    {
      name: "Transaction History",
      count: null,
      component: TransactionHistoryComponent,
    },
    {
      name: "Position History",
      count: null,
      component: PositionHistoryComponent,
    },
  ];

  // const ActiveComponent =
  //   navItems.find((item) => item.name === activeTab)?.component || (() => null);

  return (
    <div className="border border-neutral-100 dark:border-neutral-700 rounded-xl p-1">
      <nav className="border-b border-neutral-100 dark:border-neutral-700">
        <ul className="flex overflow-x-auto">
          {navItems.map((item) => (
            <li key={item.name} className="flex-shrink-0">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === item.name
                    ? "text-purple border-b-2 border-purple"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(item.name)}
              >
                {item.name}
                {item.count !== null && (
                  <span className="ml-1 text-xs">({item.count})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-5">{/* <ActiveComponent /> */}</div>
    </div>
  );
};

export default PositionsSection;
