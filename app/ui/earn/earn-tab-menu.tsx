"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TabMenu = () => {
  const tabs = [
    { name: "Pools", href: "/earn" },
    { name: "Analytics", href: "/earn/analytics" },
    { name: "History", href: "/earn/history" },
  ];

  const pathname = usePathname();

  return (
    <div className="w-full">
      <div className="border-b border-neutral-100 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-1.5 border-b-2 font-medium text-2xl
                ${
                  pathname === tab.href
                    ? "border-baseBlack dark:border-baseWhite text-baseBlack dark:text-baseWhite"
                    : "border-transparent text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300 hover:border-gray-300 dark:hover:border-gray-500"
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

export default TabMenu;
