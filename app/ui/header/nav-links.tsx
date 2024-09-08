"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import FeatureCard from "./feature-card";

const links = [
  { title: "Overview", href: "/" },
  { title: "Earn", href: "/earn" },
  { title: "Borrow", href: "/borrow" },
  { title: "Trade", href: "/trade" },
  { title: "Analytics", href: "/analystics" },
];

const tradeSubLinks = [
  { title: "Options", href: "/trade/options", subtitle: "Options Page" },
  { title: "Future", href: "/trade/futures", subtitle: "Future Page" },
  { title: "Spot", href: "/trade/spot", subtitle: "Spot Page" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex flex-row gap-2 items-center justify-center text-sm text-neutral-500">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.title === "Trade" && pathname.startsWith(link.href));

        if (link.title === "Trade") {
          return (
            <div key={link.title} className="relative group">
              <Link
                href={link.href}
                className={clsx(
                  "py-1 px-4 inline-flex items-center whitespace-nowrap",
                  isActive &&
                    "text-baseBlack font-medium after:content-[''] after:absolute after:-bottom-2/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
                )}
              >
                <span>{link.title}</span>
                &nbsp;<CaretDown color="baseBlack" />
              </Link>
              <div key={link.title} className="absolute left-2 top-10 mt-2 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                {tradeSubLinks.map((subItem) => (
                  <Link
                    key={subItem.title}
                    href={subItem.href}
                    className="block p-1 w-72 text-sm"
                  >
                    <FeatureCard
                      icon=""
                      title={subItem.title}
                      subtitle={subItem.subtitle}
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
                "flex py-1 px-4 whitespace-nowrap relative",
                isActive &&
                  "text-baseBlack font-medium after:content-[''] after:absolute after:-bottom-2/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
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
