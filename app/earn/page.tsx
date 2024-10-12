"use client";

import { useState } from "react";
import PoolsTable from "../ui/earn/pool-table";
import FAQAccordion from "../ui/earn/faq-accordion";
import TabMenu from "../ui/earn/earn-tab-menu";

export default function Page() {
  const [isActivePoolsOnly, setIsActivePoolsOnly] = useState(false);
  return (
    <>
      <TabMenu />
      <div className="mt-6 flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isActivePoolsOnly}
              onChange={() => setIsActivePoolsOnly(!isActivePoolsOnly)}
            />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-full"></div>
            <div className="relative block bg-white dark:bg-baseDark w-11 h-5 rounded-full"></div>
            <div
              className={`dot absolute left-1 top-1 bg-gradient-to-r from-gradient-1 to-gradient-2 w-3 h-3 rounded-full transition ${
                isActivePoolsOnly ? "transform translate-x-6" : ""
              }`}
            ></div>
          </div>
          <div className="ml-3 text-neutral-500 font-semibold text-sm">
            Active pools
          </div>
        </label>
      </div>
      <div className="mt-6">
        <PoolsTable />
        <FAQAccordion />
      </div>
    </>
  );
}
