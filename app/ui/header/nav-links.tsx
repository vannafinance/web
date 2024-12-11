"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import FeatureCard from "./feature-card";
import { menuLinks, tradeMenuSubLinks } from "@/app/lib/static-values";

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex flex-row gap-2 items-center justify-center text-sm">
      {menuLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.title !== "Overview" && pathname.startsWith(link.href)) ||
          (link.href === "/trade/dashboard" && pathname.includes("/trade/"));

        const sublink =
          tradeMenuSubLinks.find((subItem) => pathname === subItem.href)
            ?.title || "";

        if (link.title === "Trade") {
          return (
            <div key={link.title} className="relative group">
              <Link
                key={link.title + "1"}
                href={link.href}
                className={clsx(
                  "py-1 px-4 inline-flex items-center whitespace-nowrap dark:bg-baseDark text-neutral-500",
                  isActive && sublink != ""
                    ? "font-medium after:content-[''] after:absolute after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2 after:-bottom-1/4 text-baseBlack dark:text-baseWhite"
                    : "after:-bottom-2/3"
                )}
              >
                <span>{link.title}</span>
                &nbsp;&nbsp;
                {isActive && sublink != "" ? (
                  <div className="flex flex-row items-center p-2 bg-baseComplementary dark:bg-baseDarkComplementary rounded-full">
                    <span>{sublink}&nbsp;</span>
                    <CaretDown />
                  </div>
                ) : (
                  <CaretDown color="gray" />
                )}
              </Link>
              <div
                key={link.title + "2"}
                className="absolute left-2 top-10 z-50 mt-2 rounded-md shadow-xl bg-white dark:bg-baseDark ring-1 ring-black dark:ring-neutral-800 ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300"
              >
                {tradeMenuSubLinks.map((subItem, index) => (
                  <Link
                    key={index}
                    href={subItem.href}
                    className="block p-1 w-72 text-sm"
                  >
                    <FeatureCard
                      key={"a" + index}
                      icon={subItem.icon}
                      title={subItem.title}
                      subtitle={subItem.subtitle}
                      isSoon={subItem.title === "Options"}
                    />
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        return (
          <>
            <Link
              key={link.title}
              href={link.href}
              className={clsx(
                "flex py-1 px-4 whitespace-nowrap relative text-neutral-500 dark:bg-baseDark",
                isActive &&
                  "text-baseBlack dark:text-baseWhite font-medium after:content-[''] after:absolute after:-bottom-2/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
              )}
            >
              {link.title}
            </Link>
            {link.title === "Earn" && (
              <div className="h-5 w-px bg-neutral-500 opacity-60 text-lg mx-2"></div>
            )}
          </>
        );
      })}
    </div>
  );
}
