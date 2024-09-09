"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TabComponent = () => {
  const tabs = [
    { name: "Pools", href: "/earn" },
    { name: "Analytics", href: "/earn/analytics" },
    { name: "History", href: "/earn/history" },
  ];

  const pathname = usePathname();

  return (
    <div className="w-full">
      <div className="border-b border-neutral-100">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-1.5 border-b-2 font-medium text-2xl
                ${
                  pathname === tab.href
                    ? "border-baseBlack text-baseBlack"
                    : "border-transparent text-neutral-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabComponent;
